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

    // 2. Traer todos los partidos de Prisma
    const matchesData = await prisma.tournamentMatch.findMany({
      orderBy: { date: 'asc' },
      include: {
        homeTeam: true,
        awayTeam: true
      }
    })

    // 3. Traer todos los usuarios (para mapear Participants)
    // Asumimos que todos son del grupo global por ahora (ya construiremos grupos privados)
    const allUsers = await prisma.user.findMany({
      include: {
        predictions: true,
        memberships: true
      }
    })

    // Agrupar matches por jornada (1, 2, 3)
    const jornadasMap: Record<number, Match[]> = {}
    
    matchesData.forEach((m: any) => {
      // Si el phase es Grupos, va a las jornadas
      if (m.phase === "Grupos") {
        if (!jornadasMap[m.jornadaId]) {
          jornadasMap[m.jornadaId] = []
        }
        jornadasMap[m.jornadaId].push({
          id: m.id,
          date: m.date.toISOString(),
          venue: "Estadio Mundialista", // Mock por ahora
          status: m.status as any,
          homeTeam: { name: m.homeTeam?.name || m.homeTeamId || "TBD", shortName: m.homeTeam?.shortName || m.homeTeamId?.substring(0,3) || "TBD", logo: m.homeTeam?.logo || "" },
          awayTeam: { name: m.awayTeam?.name || m.awayTeamId || "TBD", shortName: m.awayTeam?.shortName || m.awayTeamId?.substring(0,3) || "TBD", logo: m.awayTeam?.logo || "" },
          score: (m.homeScore !== null && m.awayScore !== null) ? { home: m.homeScore, away: m.awayScore } : null
        })
      }
    })

    const mappedJornadas: Jornada[] = Object.keys(jornadasMap).map(jId => ({
      id: parseInt(jId),
      name: `Jornada ${jId}`,
      status: "upcoming",
      deadline: "", // TODO
      matches: jornadasMap[parseInt(jId)]
    }))

    // Participantes (Tabla principal)
    const mappedParticipants: Participant[] = allUsers.map((u: any) => {
      const predObj: Record<string, {home: number, away: number}> = {}
      u.predictions.forEach((p: any) => {
        predObj[p.matchId] = { home: p.homeScore, away: p.awayScore }
      })

      return {
        id: u.id,
        name: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u.username || "Desconocido"),
        avatar: u.image || "",
        totalPoints: u.memberships[0]?.points || 0, // Usar puntos del primer grupo (Global)
        predictions: predObj
      }
    })

    // Si queremos KnockoutPhase
    const mappedBracket: KnockoutMatch[] = matchesData.filter((m: any) => m.phase !== "Grupos").map((m: any) => ({
      id: m.id,
      phase: m.phase,
      date: m.date.toISOString(),
      status: m.status as any,
      homeTeam: { name: m.homeTeam?.name || m.homeTeamId || "TBD", shortName: m.homeTeam?.shortName || m.homeTeamId?.substring(0,3) || "TBD", logo: m.homeTeam?.logo || "" },
      awayTeam: { name: m.awayTeam?.name || m.awayTeamId || "TBD", shortName: m.awayTeam?.shortName || m.awayTeamId?.substring(0,3) || "TBD", logo: m.awayTeam?.logo || "" },
      score: (m.homeScore !== null && m.awayScore !== null) ? { home: m.homeScore, away: m.awayScore } : null,
    }))

    const data: QuinielaData = {
      currentUser: {
        participantId: userRow.id,
        name: userRow.firstName ? `${userRow.firstName} ${userRow.lastName || ''}`.trim() : (userRow.username || ''),
        avatar: userRow.image || "",
        isAdmin: userRow.role === "ADMIN"
      },
      tournament: {
        name: "Copa Mundial 2026",
        season: "2026",
        logo: "/fifa.png"
      },
      jornadas: mappedJornadas,
      groups: [], // Soccer groups (A, B, C...)
      bracket: mappedBracket,
      participants: mappedParticipants,
      rules: {
        exactScore: 5,
        correctGoalDifference: 3,
        correctResult: 1,
        description: "Acertar resultado exacto da 5 puntos. Diferencia de goles da 3. Ganador da 1."
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
    await prisma.prediction.upsert({
      where: {
        userId_matchId: {
          userId: userId,
          matchId: matchId
        }
      },
      update: {
        homeScore: home,
        awayScore: away,
        updatedAt: new Date()
      },
      create: {
        userId: userId,
        matchId: matchId,
        homeScore: home,
        awayScore: away
      }
    })
    return { success: true }
  } catch (err) {
    console.error("Failed to save prediction to DB", err)
    throw err
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
