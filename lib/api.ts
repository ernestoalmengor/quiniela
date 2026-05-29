"use server"

import { QuinielaData, Jornada, Match, Participant, KnockoutMatch, Group, TeamStats } from "./types"
import prisma from "./prisma"

export async function fetchQuinielaData(userId: string): Promise<QuinielaData> {
  try {
    // 1. Obtener al usuario que la solicita
    const userRow = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!userRow) {
      throw new Error("Usuario no encontrado")
    }

    const matchesData = await prisma.tournamentMatch.findMany({
      orderBy: { date: 'asc' },
      include: {
        homeTeam: true,
        awayTeam: true,
        jornada: {
          include: {
            phase: true
          }
        }
      }
    })

    // 3. Traer todos los usuarios (para mapear Participants) excluyendo administradores
    const allUsers = await prisma.user.findMany({
      where: { role: { not: "ADMIN" } },
      include: {
        predictions: true,
        memberships: {
          include: {
            group: true
          }
        }
      }
    })

    // Obtener las reglas desde SystemConfig
    let config = await prisma.systemConfig.findUnique({
      where: { id: "global" }
    })
    if (!config) {
      config = await prisma.systemConfig.create({
        data: { id: "global", exactScorePoints: 3, correctWinnerPoints: 2, drawPoints: 1 }
      })
    }

    // Obtener los grupos de amigos a los que pertenece el usuario
    const userGroupsDb = await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              include: {
                predictions: true
              }
            }
          },
          orderBy: {
            points: 'desc'
          }
        }
      }
    })

    const userGroups = userGroupsDb.map((g: any) => ({
      id: g.id,
      name: g.name,
      inviteCode: g.inviteCode,
      adminId: g.adminId,
      members: g.members.map((m: any) => {
        const predObj: Record<string, {home: number, away: number}> = {}
        m.user.predictions.forEach((p: any) => {
          predObj[p.matchId] = { home: p.homeScore, away: p.awayScore }
        })
        return {
          id: m.user.id,
          name: m.user.firstName ? `${m.user.firstName} ${m.user.lastName || ''}`.trim() : (m.user.username || "Desconocido"),
          avatar: m.user.image || "",
          points: m.points,
          predictions: predObj
        }
      })
    }))

    // Fases que se consideran eliminatorias (van al bracket, no a jornadas)
    const KNOCKOUT_PHASES = ["Dieciseisavos", "Dieciseisavos de final", "Octavos", "Octavos de final", "Cuartos", "Cuartos de final", "Semifinal", "Final"]

    // Agrupar matches por jornada — TODOS los partidos van a su jornada asignada
    const jornadasMap: Record<number, Match[]> = {}

    matchesData.forEach((m: any) => {
      if (!jornadasMap[m.jornadaId]) {
        jornadasMap[m.jornadaId] = []
      }
      jornadasMap[m.jornadaId].push({
        id: m.id,
        date: m.date.toISOString(),
        venue: "",
        status: m.status as any,
        homeTeam: { name: m.homeTeam?.name || "TBD", shortName: m.homeTeam?.shortName || "TBD", logo: m.homeTeam?.logo || "" },
        awayTeam: { name: m.awayTeam?.name || "TBD", shortName: m.awayTeam?.shortName || "TBD", logo: m.awayTeam?.logo || "" },
        score: (m.homeScore !== null && m.awayScore !== null) ? { home: m.homeScore, away: m.awayScore } : null
      })
    })

    // Obtener las jornadas que tienen partidos y mapearlas correctamente
    // También incluir jornadas sin partidos si existen en la DB
    const allJornadasDb = await prisma.jornada.findMany({
      orderBy: { id: 'asc' },
      include: { phase: true }
    })

    const mappedJornadas: Jornada[] = allJornadasDb
      .filter(dbJ => jornadasMap[dbJ.id] !== undefined || dbJ.status === "hidden") // Mantenemos jornadas para el admin
      .filter(dbJ => userRow.role === "ADMIN" || dbJ.status !== "hidden") // <-- Ocultar a usuarios si es hidden
      .map(dbJ => ({
        id: dbJ.id,
        name: dbJ.name,
        status: (dbJ.status as any) || "upcoming",
        deadline: dbJ.deadline?.toISOString() || "",
        phase: dbJ.phase ? { id: dbJ.phase.id, name: dbJ.phase.name } : undefined,
        matches: jornadasMap[dbJ.id] || []
      }))

    // Bracket: solo partidos de fases eliminatorias puras (sin jornada en el sentido navegable)
    const mappedBracket: KnockoutMatch[] = matchesData
      .filter((m: any) => KNOCKOUT_PHASES.includes(m.phase))
      .map((m: any) => ({
        id: m.id,
        phase: m.phase,
        date: m.date.toISOString(),
        status: m.status as any,
        homeTeam: { name: m.homeTeam?.name || "TBD", shortName: m.homeTeam?.shortName || "TBD", logo: m.homeTeam?.logo || "" },
        awayTeam: { name: m.awayTeam?.name || "TBD", shortName: m.awayTeam?.shortName || "TBD", logo: m.awayTeam?.logo || "" },
        score: (m.homeScore !== null && m.awayScore !== null) ? { home: m.homeScore, away: m.awayScore } : null,
      }))

    // Participantes (Tabla principal)
    const mappedParticipants: Participant[] = allUsers.map((u: any) => {
      const predObj: Record<string, {home: number, away: number}> = {}
      u.predictions.forEach((p: any) => {
        predObj[p.matchId] = { home: p.homeScore, away: p.awayScore }
      })

      // Buscar puntos en la clasificación global
      const globalMembership = u.memberships.find((m: any) => m.group?.name === "Clasificación Global" || m.group?.inviteCode === "GLOBAL-2026")
      const pts = globalMembership ? globalMembership.points : (u.memberships[0]?.points || 0)

      return {
        id: u.id,
        name: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u.username || "Desconocido"),
        avatar: u.image || "",
        totalPoints: pts,
        predictions: predObj
      }
    })

    // 4. Calcular grupos y sus posiciones dinámicamente
    const allTeams = await prisma.team.findMany()
    const groupsMap: Record<string, TeamStats[]> = {}

    allTeams.forEach((t: any) => {
      const gId = t.groupId || "Otros"
      if (!groupsMap[gId]) {
        groupsMap[gId] = []
      }
      groupsMap[gId].push({
        team: {
          id: t.id,
          name: t.name,
          shortName: t.shortName,
          logo: t.logo || ""
        },
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0
      })
    })

    const GROUP_PHASES = ["Grupos", "Fase de grupos", "Fase de Grupos"]
    matchesData.forEach((m: any) => {
      if (GROUP_PHASES.includes(m.phase) && m.status === "finished" && m.homeScore !== null && m.awayScore !== null) {
        const homeStats = Object.values(groupsMap).flatMap(ts => ts).find(s => s.team.shortName === m.homeTeam?.shortName)
        const awayStats = Object.values(groupsMap).flatMap(ts => ts).find(s => s.team.shortName === m.awayTeam?.shortName)

        if (homeStats && awayStats) {
          homeStats.played += 1
          awayStats.played += 1
          homeStats.goalsFor += m.homeScore
          homeStats.goalsAgainst += m.awayScore
          awayStats.goalsFor += m.awayScore
          awayStats.goalsAgainst += m.homeScore

          if (m.homeScore > m.awayScore) {
            homeStats.won += 1
            homeStats.points += 3
            awayStats.lost += 1
          } else if (m.homeScore < m.awayScore) {
            awayStats.won += 1
            awayStats.points += 3
            homeStats.lost += 1
          } else {
            homeStats.drawn += 1
            homeStats.points += 1
            awayStats.drawn += 1
            awayStats.points += 1
          }

          homeStats.goalDifference = homeStats.goalsFor - homeStats.goalsAgainst
          awayStats.goalDifference = awayStats.goalsFor - awayStats.goalsAgainst
        }
      }
    })

    const mappedGroups: Group[] = Object.keys(groupsMap)
      .filter(gId => gId !== "Otros" && gId !== "un" && gId !== "")
      .map(gId => {
        const sortedTeams = groupsMap[gId].sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points
          if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
          if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
          return a.team.name.localeCompare(b.team.name)
        })

        return {
          id: gId,
          name: `Grupo ${gId}`,
          teams: sortedTeams
        }
      })
      .sort((a, b) => a.id.localeCompare(b.id))

    const data: QuinielaData = {
      currentUser: {
        participantId: userRow.id,
        name: userRow.firstName ? `${userRow.firstName} ${userRow.lastName || ''}`.trim() : (userRow.username || ''),
        username: userRow.username || "",
        avatar: userRow.image || "",
        isAdmin: userRow.role === "ADMIN"
      },
      tournament: {
        name: "Copa Mundial 2026",
        season: "2026",
        logo: "/fifa.png"
      },
      jornadas: mappedJornadas,
      groups: mappedGroups,
      bracket: mappedBracket,
      participants: mappedParticipants,
      userGroups: userGroups,
      rules: {
        exactScore: config.exactScorePoints,
        correctResult: config.correctWinnerPoints,
        correctGoalDifference: config.drawPoints,
        description: `Acertar el resultado exacto otorga ${config.exactScorePoints} puntos. Acertar el ganador o empate con marcador diferente otorga ${config.correctWinnerPoints} puntos si es victoria y ${config.drawPoints} si es empate.`
      }
    }

    if (userRow.role === "ADMIN") {
      const rawJornadas = await prisma.jornada.findMany({
        orderBy: { id: 'asc' },
        include: { phase: true }
      })
      const allPhases = await prisma.phase.findMany({
        include: { jornadas: { orderBy: { id: 'asc' } } },
        orderBy: { name: 'asc' }
      })
      const allGroups = await prisma.group.findMany({
        include: { _count: { select: { members: true } }, admin: true }
      })
      data.adminData = {
        users: allUsers,
        teams: allTeams,
        matches: matchesData,
        jornadas: rawJornadas,
        phases: allPhases,
        systemConfig: config,
        groups: allGroups
      }
    }

    return data
  } catch (err) {
    console.error("Error obteniendo base de datos Prisma:", err)
    throw new Error("Error interno extrayendo datos de Quiniela")
  }
}

export async function savePredictionApi(userId: string, matchId: string, home: number, away: number) {
  try {
    const match = await prisma.tournamentMatch.findUnique({
      where: { id: matchId }
    })

    if (!match) {
      throw new Error("Partido no encontrado")
    }

    const now = new Date()
    if (now >= new Date(match.date)) {
      throw new Error("El partido ya ha comenzado, no se pueden registrar predicciones.")
    }

    const existing = await prisma.prediction.findUnique({
      where: {
        userId_matchId: {
          userId: userId,
          matchId: matchId
        }
      }
    })

    if (existing) {
      throw new Error("Ya registraste tu marcador para este partido y no se puede modificar.")
    }

    await prisma.prediction.create({
      data: {
        userId: userId,
        matchId: matchId,
        homeScore: home,
        awayScore: away
      }
    })
    return { success: true }
  } catch (err: any) {
    console.error("Failed to save prediction to DB", err)
    throw new Error(err.message || "Error al guardar la predicción")
  }
}

export async function updateAvatarApi(userId: string, avatarUrl: string) {
  try {
    let eyes = null;
    let mouth = null;
    let color = null;
    try {
      const url = new URL(avatarUrl);
      eyes = url.searchParams.get('eyes');
      mouth = url.searchParams.get('mouth');
      color = url.searchParams.get('backgroundColor');
    } catch (e) {
      // url inválida, ignora la extracción
    }

    await prisma.user.update({
      where: { id: userId },
      data: { 
        image: avatarUrl,
        avatarEyes: eyes,
        avatarMouth: mouth,
        avatarColor: color
      }
    })
    return { success: true }
  } catch (err) {
    console.error("Error actualizando avatar", err)
    throw err
  }
}

export async function createFriendGroupAction(userId: string, name: string) {
  try {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        inviteCode,
        adminId: userId
      }
    })
    // Auto-join creator
    await prisma.groupMember.create({
      data: {
        userId,
        groupId: group.id,
        points: 0
      }
    })
    return { success: true, group }
  } catch (err: any) {
    console.error("Error creating group:", err)
    throw new Error(err.message || "Error al crear el grupo")
  }
}

export async function joinFriendGroupAction(userId: string, inviteCode: string) {
  try {
    const code = inviteCode.trim().toUpperCase()
    
    // special handling for seed/global group
    const group = await prisma.group.findFirst({
      where: {
        OR: [
          { inviteCode: code },
          { inviteCode: inviteCode.trim() }
        ]
      }
    })
    if (!group) {
      throw new Error("Grupo no encontrado. Verifica el código de invitación.")
    }
    
    // Check if already a member
    const existing = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId: group.id
        }
      }
    })
    if (existing) {
      return { success: true, message: "Ya eres miembro de este grupo" }
    }

    await prisma.groupMember.create({
      data: {
        userId,
        groupId: group.id,
        points: 0
      }
    })
    return { success: true }
  } catch (err: any) {
    console.error("Error joining group:", err)
    throw new Error(err.message || "Error al unirse al grupo")
  }
}
