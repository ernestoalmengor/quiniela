/**
 * QUINIELA MUNDIAL 2026 - GOOGLE APPS SCRIPT BACKEND
 * 
 * Este script convierte tu Google Sheet en una base de datos API para la Quiniela.
 * Lee las diferentes hojas, calcula los puntos y posiciones de los grupos,
 * y recibe las nuevas predicciones de la página web.
 */

// Las hojas (pestañas) que debe tener tu Excel:
const SHEETS = {
  CONFIG: 'Config',
  EQUIPOS: 'Equipos',
  JORNADAS: 'Jornadas',
  PARTIDOS: 'Partidos',
  USUARIOS: 'Usuarios',
  PREDICCIONES: 'Predicciones'
};

/**
 * Función que maneja las peticiones GET (cuando la App pide los datos)
 */
function doGet(e) {
  try {
    const data = buildQuinielaData(e.parameter.userId);
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString(), stack: error.stack }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Función que maneja las peticiones POST (cuando la App guarda predicciones o actualiza avatar)
 */
function doPost(e) {
  try {
    const action = e.parameter.action;
    const bodyData = JSON.parse(e.postData.contents);
    
    if (action === 'savePrediction') {
      savePrediction(bodyData.userId, bodyData.matchId, bodyData.home, bodyData.away);
    } else if (action === 'updateUser') {
      updateUser(bodyData.userId, bodyData.name, bodyData.avatar);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * LÓGICA DE LECTURA Y CONSTRUCCIÓN DE DATOS
 */
function buildQuinielaData(requestingUserId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Leer Config (Reglas)
  const rules = getRules(ss);
  const tournament = {
    name: getItemFromConfig(ss, "Torneo_Nombre") || "Mundial FIFA 2026",
    season: "2026",
    logo: getItemFromConfig(ss, "Torneo_Logo") || ""
  };
  
  // 2. Leer Equipos
  const equiposMap = getEquiposMap(ss);
  
  // 3. Leer Partidos y Jornadas
  const partidosRaw = getSheetData(ss, SHEETS.PARTIDOS); // [id, jornada_id, fase, local_id, visitante_id, fecha, estatus, goles_local, goles_visitante, avanza_a]
  const jornadasRaw = getSheetData(ss, SHEETS.JORNADAS); // [id, nombre, status, deadline]
  
  const partidosMap = {};
  const partidosList = [];
  
  partidosRaw.forEach(r => {
    const homeTeam = equiposMap[r.local_id] || { name: r.local_id || 'TBD', shortName: r.local_id || 'TBD', logo: '' };
    const awayTeam = equiposMap[r.visitante_id] || { name: r.visitante_id || 'TBD', shortName: r.visitante_id || 'TBD', logo: '' };
    
    let score = null;
    if (r.goles_local !== '' && r.goles_visitante !== '') {
      score = { home: parseInt(r.goles_local), away: parseInt(r.goles_visitante) };
    }
    
    const partido = {
      id: r.id.toString(),
      jornadaId: r.jornada_id,
      phase: r.fase,
      homeTeam,
      awayTeam,
      date: r.fecha,
      status: r.estatus || "upcoming",
      score,
      winnerTo: r.avanza_a || null
    };
    partidosMap[partido.id] = partido;
    partidosList.push(partido);
  });
  
  // 4. Armar Jornadas y Bracket
  const jornadasMap = {};
  const jornadasList = [];
  
  jornadasRaw.forEach(j => {
    jornadasMap[j.id] = {
      id: parseInt(j.id),
      name: j.nombre,
      status: j.status,
      deadline: j.deadline,
      matches: []
    };
    jornadasList.push(jornadasMap[j.id]);
  });
  
  const bracket = [];
  partidosList.forEach(p => {
    // Si tiene jornada ID, va a su jornada
    if (p.jornadaId && jornadasMap[p.jornadaId]) {
      // Remover param extras para no poluir matches
      jornadasMap[p.jornadaId].matches.push({
        id: p.id,
        homeTeam: p.homeTeam,
        awayTeam: p.awayTeam,
        date: p.date,
        status: p.status,
        score: p.score
      });
    }
    // Si es fase eliminatoria, también va al bracket
    if (["Octavos", "Cuartos", "Semifinal", "Final", "Tercer Lugar"].includes(p.phase)) {
      bracket.push(p);
    }
  });

  // 5. Calcular Grupos (Solo con partidos de fase de grupos terminados)
  const groups = calculateGroups(partidosList.filter(p => !["Octavos", "Cuartos", "Semifinal", "Final", "Tercer Lugar"].includes(p.phase)));

  // 6. Leer Predicciones y armar Usuarios
  const prediccionesRaw = getSheetData(ss, SHEETS.PREDICCIONES); // [usuario_id, partido_id, goles_local, goles_visitante]
  const predictionsByUser = {};
  
  prediccionesRaw.forEach(pr => {
    const uid = pr.usuario_id.toString();
    if (!predictionsByUser[uid]) predictionsByUser[uid] = {};
    predictionsByUser[uid][pr.partido_id.toString()] = {
      home: parseInt(pr.goles_local),
      away: parseInt(pr.goles_visitante)
    };
  });
  
  const usuariosRaw = getSheetData(ss, SHEETS.USUARIOS); // [id, nombre, avatar_url]
  const participants = [];
  let currentUser = { name: "Invitado", avatar: "", participantId: requestingUserId || "invitado" };

  usuariosRaw.forEach(u => {
    const uid = u.id.toString();
    const userPreds = predictionsByUser[uid] || {};
    
    // CALCULAR PUNTOS DE ESTE USUARIO
    let totalPoints = 0;
    Object.keys(userPreds).forEach(matchId => {
      const match = partidosMap[matchId];
      if (match && match.score) {
        // Lógica de puntos
        const realH = match.score.home;
        const realA = match.score.away;
        const predH = userPreds[matchId].home;
        const predA = userPreds[matchId].away;
        
        let matchPts = 0;
        if (realH === predH && realA === predA) {
          matchPts = rules.exactScore; // ej. 5
        } else {
          // Atino ganador/empate?
          const realRes = realH > realA ? 'H' : realH < realA ? 'A' : 'D';
          const predRes = predH > predA ? 'H' : predH < predA ? 'A' : 'D';
          if (realRes === predRes) {
            matchPts += rules.correctResult; // ej. 3
          }
          // Diferencia de goles
          if ((realH - realA) === (predH - predA)) {
            matchPts += rules.correctGoalDifference; // ej. 1
          }
        }
        totalPoints += matchPts;
      }
    });

    participants.push({
      id: uid,
      name: u.nombre,
      avatar: u.avatar_url,
      totalPoints: totalPoints,
      predictions: userPreds
    });

    if (uid === (requestingUserId || "1")) {
      currentUser = {
        name: u.nombre,
        avatar: u.avatar_url,
        participantId: uid
      };
    }
  });

  return {
    currentUser,
    tournament,
    rules,
    jornadas: jornadasList,
    groups: groups,
    bracket: bracket,
    participants: participants.sort((a,b) => b.totalPoints - a.totalPoints)
  };
}

/**
 * CÁLCULO DE GRUPOS
 */
function calculateGroups(groupMatches) {
  const groupsStatsMap = {}; // { grupoId: { teamId: { played, won... } } }
  
  groupMatches.forEach(m => {
    if (!m.score || m.status !== "finished") return;
    
    // Necesitamos que homeTeam y awayTeam tengan la prop "grupo" pasándolo desde el excel...
    // Para simplificar, agruparemos dinámicamente o asumiendo que el excel se lo dió en Equipos
    const gH = m.homeTeam.group || "A";
    const gA = m.awayTeam.group || "A";
    
    if (!groupsStatsMap[gH]) groupsStatsMap[gH] = {};
    if (!groupsStatsMap[gA]) groupsStatsMap[gA] = {};
    
    initTeamStatsIfNeed(groupsStatsMap[gH], m.homeTeam);
    initTeamStatsIfNeed(groupsStatsMap[gA], m.awayTeam);
    
    const hStats = groupsStatsMap[gH][m.homeTeam.shortName];
    const aStats = groupsStatsMap[gA][m.awayTeam.shortName];
    
    hStats.played++; aStats.played++;
    hStats.goalsFor += m.score.home; hStats.goalsAgainst += m.score.away;
    aStats.goalsFor += m.score.away; aStats.goalsAgainst += m.score.home;
    
    if (m.score.home > m.score.away) {
      hStats.won++; aStats.lost++; hStats.points += 3;
    } else if (m.score.home < m.score.away) {
      aStats.won++; hStats.lost++; aStats.points += 3;
    } else {
      hStats.drawn++; aStats.drawn++; hStats.points += 1; aStats.points += 1;
    }
    
    hStats.goalDifference = hStats.goalsFor - hStats.goalsAgainst;
    aStats.goalDifference = aStats.goalsFor - aStats.goalsAgainst;
  });

  const parsedGroups = [];
  Object.keys(groupsStatsMap).sort().forEach(groupId => {
    const teamsInGroup = Object.values(groupsStatsMap[groupId]);
    // Ordenar por puntos, dif de goles, goles favor
    teamsInGroup.sort((a,b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });
    
    parsedGroups.push({
      id: groupId,
      name: "Grupo " + groupId,
      teams: teamsInGroup
    });
  });

  return parsedGroups;
}

function initTeamStatsIfNeed(groupObj, teamMapRef) {
  if (!groupObj[teamMapRef.shortName]) {
    groupObj[teamMapRef.shortName] = { 
      team: teamMapRef, played: 0, won: 0, drawn: 0, lost: 0, 
      goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 
    };
  }
}

/**
 * LÓGICA ESDRITURA (POST)
 */
function savePrediction(userId, matchId, home, away) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.PREDICCIONES);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // Buscar si ya existe la predicción
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString() === userId.toString() && data[i][1].toString() === matchId.toString()) {
      sheet.getRange(i + 1, 3).setValue(home);
      sheet.getRange(i + 1, 4).setValue(away);
      return;
    }
  }
  
  // Si no existe, agregarla
  sheet.appendRow([userId, matchId, home, away]);
}

function updateUser(userId, name, avatarUrl) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.USUARIOS);
  const data = sheet.getDataRange().getValues();
  
  // Buscar si ya existe
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString() === userId.toString()) {
      if(name) sheet.getRange(i + 1, 2).setValue(name);
      if(avatarUrl) sheet.getRange(i + 1, 3).setValue(avatarUrl);
      return;
    }
  }
  
  // Si no existe lo crea
  sheet.appendRow([userId, name || "Nuevo Usuario", avatarUrl || ""]);
}

/**
 * UTILIDADES DE HOJAS
 */
function getRules(ss) {
  let exact = 5, res = 3, diff = 1;
  const sheet = ss.getSheetByName(SHEETS.CONFIG);
  if (sheet) {
    const data = sheet.getDataRange().getValues();
    data.forEach(row => {
      if (row[0] === 'Reglas_Exacto') exact = parseInt(row[1]) || exact;
      if (row[0] === 'Reglas_Resultado') res = parseInt(row[1]) || res;
      if (row[0] === 'Reglas_Diferencia') diff = parseInt(row[1]) || diff;
    });
  }
  return { exactScore: exact, correctResult: res, correctGoalDifference: diff, description: "Puntuación Oficial" };
}

function getItemFromConfig(ss, key) {
  const sheet = ss.getSheetByName(SHEETS.CONFIG);
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  for(let i=0; i<data.length; i++){
    if(data[i][0] === key) return data[i][1];
  }
  return null;
}

function getEquiposMap(ss) {
  const equipos = {};
  const data = getSheetData(ss, SHEETS.EQUIPOS); // [id, nombre, grupo, iso_bandera]
  data.forEach(r => {
    equipos[r.id] = {
      name: r.nombre,
      shortName: r.id,
      group: r.grupo,
      logo: r.iso_bandera ? `https://flagcdn.com/${r.iso_bandera}.svg` : ""
    };
  });
  return equipos;
}

function getSheetData(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const range = sheet.getDataRange();
  const values = range.getValues();
  if (values.length <= 1) return [];
  
  const headers = values[0].map(h => h.toString().toLowerCase().trim().replace(/ /g, '_'));
  const rows = [];
  
  for (let i = 1; i < values.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[i][j];
    }
    rows.push(row);
  }
  return rows;
}
