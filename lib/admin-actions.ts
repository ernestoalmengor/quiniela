"use server"

import prisma from "./prisma"
import { auth } from "./auth"

// -----------------------------------------------------------------
// 0. GESTIÓN DE FASES
// -----------------------------------------------------------------
export async function adminGetPhases() {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error("Acceso Denegado")
  return prisma.phase.findMany({ include: { jornadas: true }, orderBy: { name: 'asc' } })
}

export async function adminCreatePhase(name: string) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error("Acceso Denegado")
  const trimmed = name.trim()
  if (!trimmed) throw new Error("El nombre de la fase es obligatorio")
  return prisma.phase.create({ data: { name: trimmed } })
}

export async function adminUpdatePhase(id: string, name: string) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error("Acceso Denegado")
  return prisma.phase.update({ where: { id }, data: { name: name.trim() } })
}

export async function adminDeletePhase(id: string) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error("Acceso Denegado")
  // Desvincula jornadas antes de eliminar
  await prisma.jornada.updateMany({ where: { phaseId: id }, data: { phaseId: null } })
  return prisma.phase.delete({ where: { id } })
}

// -----------------------------------------------------------------
// 1. GESTIÓN DE JORNADAS
// -----------------------------------------------------------------
export async function adminCreateJornada(name: string, deadlineStr: string, phaseId?: string) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error("Acceso Denegado")

  const agg = await prisma.jornada.aggregate({ _max: { id: true } })
  const nextId = (agg._max.id || 0) + 1
  return prisma.jornada.create({
    data: { id: nextId, name, deadline: new Date(deadlineStr), status: "upcoming", phaseId: phaseId || null }
  })
}

export async function adminUpdateJornada(id: number, name: string, deadlineStr: string, phaseId?: string) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error("Acceso Denegado")

  return prisma.jornada.update({
    where: { id },
    data: { name, deadline: new Date(deadlineStr), phaseId: phaseId || null }
  })
}

export async function adminToggleJornadaStatus(id: number, newStatus: string) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error("Acceso Denegado")

  return prisma.jornada.update({
    where: { id },
    data: { status: newStatus }
  })
}

export async function adminDeleteJornada(id: number) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error("Acceso Denegado")

  // Eliminación en cascada usando una transacción
  return prisma.$transaction(async (tx) => {
    // 1. Obtener IDs de todos los partidos de esta jornada
    const matches = await tx.tournamentMatch.findMany({
      where: { jornadaId: id },
      select: { id: true }
    })
    const matchIds = matches.map(m => m.id)

    // 2. Eliminar predicciones de esos partidos
    if (matchIds.length > 0) {
      await tx.prediction.deleteMany({ where: { matchId: { in: matchIds } } })
    }

    // 3. Eliminar los partidos
    await tx.tournamentMatch.deleteMany({ where: { jornadaId: id } })

    // 4. Eliminar la jornada
    return tx.jornada.delete({ where: { id } })
  })
}


export async function adminCreateMatch(jornadaId: number, phase: string, homeTeamId: string | null, awayTeamId: string | null, dateStr: string) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error("Acceso Degenagado")

  return prisma.tournamentMatch.create({
    data: {
      jornadaId: Number(jornadaId),
      phase,
      homeTeamId: homeTeamId || null,
      awayTeamId: awayTeamId || null,
      date: new Date(dateStr),
      status: "upcoming"
    }
  })
}

export async function adminScoreMatch(matchId: string, homeScore: number, awayScore: number) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error("Acceso Denegado")

  // 1. Obtener configuración de puntos
  let config = await prisma.systemConfig.findUnique({
    where: { id: "global" }
  })
  if (!config) {
    config = await prisma.systemConfig.create({
      data: { id: "global", exactScorePoints: 3, correctWinnerPoints: 2, drawPoints: 1 }
    })
  }

  const exactPts = config.exactScorePoints
  const winnerPts = config.correctWinnerPoints
  const drawPts = config.drawPoints

  // 2. Marcar Partido como Terminado
  const match = await prisma.tournamentMatch.update({
    where: { id: matchId },
    data: { homeScore, awayScore, status: "finished" }
  })

  // 3. Motor Matemático de Repartición de Puntos Dinámico
  const realDiff = homeScore - awayScore
  const realWinner = realDiff > 0 ? 'H' : (realDiff < 0 ? 'A' : 'D')

  const predictions = await prisma.prediction.findMany({ where: { matchId } })
  
  for (const p of predictions) {
    let pts = 0
    if (p.homeScore === homeScore && p.awayScore === awayScore) {
      // Marcador exacto (ej. 3 pts)
      pts = exactPts
    } else {
      const pDiff = p.homeScore - p.awayScore
      const pWinner = pDiff > 0 ? 'H' : (pDiff < 0 ? 'A' : 'D')
      
      if (realWinner === 'D' && pWinner === 'D') {
        // Empate acertado pero diferente marcador exacto (ej. 1 pt)
        pts = drawPts
      } else if (pWinner === realWinner) {
        // Ganador correcto (ej. 2 pts)
        pts = winnerPts
      }
    }
    
    // Si ganó puntos, inyectarlos a su membresía en los grupos
    if (pts > 0) {
      const memberships = await prisma.groupMember.findMany({ where: { userId: p.userId } })
      for (const m of memberships) {
         await prisma.groupMember.update({
           where: { id: m.id },
           data: { points: { increment: pts } }
         })
      }
    }
  }

  return match
}

// -----------------------------------------------------------------
// 4. GESTIÓN DE CONFIGURACIÓN Y REGLAS
// -----------------------------------------------------------------
export async function adminGetConfig() {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error("Acceso Denegado")

  let config = await prisma.systemConfig.findUnique({
    where: { id: "global" }
  })
  if (!config) {
    config = await prisma.systemConfig.create({
      data: { id: "global", exactScorePoints: 3, correctWinnerPoints: 2, drawPoints: 1 }
    })
  }
  return config
}

export async function adminUpdateConfig(exact: number, winner: number, draw: number) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error("Acceso Denegado")

  return prisma.systemConfig.upsert({
    where: { id: "global" },
    update: { exactScorePoints: exact, correctWinnerPoints: winner, drawPoints: draw },
    create: { id: "global", exactScorePoints: exact, correctWinnerPoints: winner, drawPoints: draw }
  })
}

// -----------------------------------------------------------------
// 5. GESTIÓN DE USUARIOS
// -----------------------------------------------------------------
export async function adminGetUsers() {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error("Acceso Denegado")

  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  })
}

export async function adminToggleBlockUser(userId: string) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error("Acceso Denegado")

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error("Usuario no encontrado")

  return prisma.user.update({
    where: { id: userId },
    data: { isBlocked: !user.isBlocked }
  })
}

export async function adminDeleteUser(userId: string) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error("Acceso Denegado")

  return prisma.user.delete({
    where: { id: userId }
  })
}

// -----------------------------------------------------------------
// 6. GESTIÓN DE EQUIPOS (CRUD)
// -----------------------------------------------------------------
export async function adminCreateTeam(shortName: string, name: string, groupId: string, logo: string) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error("Acceso Denegado")

  return prisma.team.create({
    data: {
      shortName: shortName.toUpperCase().trim(),
      name: name.trim(),
      groupId: groupId.toUpperCase().trim(),
      logo: logo.trim()
    }
  })
}

export async function adminUpdateTeam(id: string, shortName: string, name: string, groupId: string, logo: string) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error("Acceso Denegado")

  return prisma.team.update({
    where: { id },
    data: {
      shortName: shortName.toUpperCase().trim(),
      name: name.trim(),
      groupId: groupId.toUpperCase().trim(),
      logo: logo.trim()
    }
  })
}

export async function adminDeleteTeam(id: string) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error("Acceso Denegado")

  return prisma.team.delete({
    where: { id }
  })
}

// -----------------------------------------------------------------
// 7. GESTIÓN DE PARTIDOS (EDICIÓN, ELIMINACIÓN Y LLAVES)
// -----------------------------------------------------------------
export async function adminUpdateMatch(matchId: string, phase: string, homeTeamId: string | null, awayTeamId: string | null, dateStr: string) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error("Acceso Denegado")

  return prisma.tournamentMatch.update({
    where: { id: matchId },
    data: {
      phase,
      homeTeamId: homeTeamId || null,
      awayTeamId: awayTeamId || null,
      date: new Date(dateStr)
    }
  })
}

export async function adminDeleteMatch(matchId: string) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error("Acceso Denegado")

  return prisma.tournamentMatch.delete({
    where: { id: matchId }
  })
}

export async function adminUpdateKnockoutTeams(matchId: string, homeTeamId: string | null, awayTeamId: string | null) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error("Acceso Denegado")

  return prisma.tournamentMatch.update({
    where: { id: matchId },
    data: {
      homeTeamId: homeTeamId || null,
      awayTeamId: awayTeamId || null
    }
  })
}

export async function adminInitKnockoutStage() {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error("Acceso Denegado")

  await prisma.jornada.upsert({
    where: { id: 100 },
    update: {},
    create: { id: 100, name: "Fase Eliminatoria", status: "upcoming" }
  })

  // Limpiar llaves anteriores
  await prisma.tournamentMatch.deleteMany({
    where: { jornadaId: 100 }
  })

  const newMatches = [
    // Octavos (Fechas oficiales en Junio)
    { jornadaId: 100, phase: "Octavos de final", date: new Date("2026-06-04T11:00:00-05:00"), status: "upcoming" }, // Houston (CT)
    { jornadaId: 100, phase: "Octavos de final", date: new Date("2026-06-04T15:00:00-04:00"), status: "upcoming" }, // Philly (ET)
    { jornadaId: 100, phase: "Octavos de final", date: new Date("2026-06-05T14:00:00-04:00"), status: "upcoming" }, // NY/NJ (ET)
    { jornadaId: 100, phase: "Octavos de final", date: new Date("2026-06-05T18:00:00-06:00"), status: "upcoming" }, // CDMX (CT)
    { jornadaId: 100, phase: "Octavos de final", date: new Date("2026-06-06T13:00:00-05:00"), status: "upcoming" }, // Dallas (CT)
    { jornadaId: 100, phase: "Octavos de final", date: new Date("2026-06-06T18:00:00-07:00"), status: "upcoming" }, // Seattle (PT)
    { jornadaId: 100, phase: "Octavos de final", date: new Date("2026-06-07T10:00:00-04:00"), status: "upcoming" }, // Atlanta (ET)
    { jornadaId: 100, phase: "Octavos de final", date: new Date("2026-06-07T14:00:00-07:00"), status: "upcoming" }, // Vancouver (PT)
    
    // Cuartos
    { jornadaId: 100, phase: "Cuartos de final", date: new Date("2026-06-09T14:00:00-04:00"), status: "upcoming" }, // Boston (ET)
    { jornadaId: 100, phase: "Cuartos de final", date: new Date("2026-06-10T13:00:00-07:00"), status: "upcoming" }, // LA (PT)
    { jornadaId: 100, phase: "Cuartos de final", date: new Date("2026-06-11T15:00:00-04:00"), status: "upcoming" }, // Miami (ET)
    { jornadaId: 100, phase: "Cuartos de final", date: new Date("2026-06-11T19:00:00-05:00"), status: "upcoming" }, // Kansas City (CT)
    
    // Semifinales
    { jornadaId: 100, phase: "Semifinal", date: new Date("2026-06-14T13:00:00-05:00"), status: "upcoming" }, // Dallas (CT)
    { jornadaId: 100, phase: "Semifinal", date: new Date("2026-06-15T13:00:00-04:00"), status: "upcoming" }, // Atlanta (ET)
    
    // Tercer puesto
    { jornadaId: 100, phase: "Partido por el tercer puesto", date: new Date("2026-06-18T15:00:00-04:00"), status: "upcoming" }, // Miami (ET)
    
    // Final
    { jornadaId: 100, phase: "Final", date: new Date("2026-06-19T13:00:00-04:00"), status: "upcoming" }, // NY/NJ (ET)
  ]

  await prisma.tournamentMatch.createMany({
    data: newMatches
  })
  
  return { success: true }
}

// -----------------------------------------------------------------
// 8. GESTIÓN DE GRUPOS DE AMIGOS
// -----------------------------------------------------------------

export async function adminDeleteFriendGroup(groupId: string) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error("Acceso Denegado")

  return prisma.group.delete({
    where: { id: groupId }
  })
}
