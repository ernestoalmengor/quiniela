"use server"

import prisma from "./prisma"
import { auth } from "./auth"

export async function adminCreateJornada(name: string, deadlineStr: string) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error("Acceso Degenagado")

  const agg = await prisma.jornada.aggregate({ _max: { id: true } })
  const nextId = (agg._max.id || 0) + 1
  return prisma.jornada.create({
    data: { id: nextId, name, deadline: new Date(deadlineStr), status: "upcoming" }
  })
}

export async function adminCreateMatch(jornadaId: number, phase: string, homeTeamId: string, awayTeamId: string, dateStr: string) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error("Acceso Degenagado")

  return prisma.tournamentMatch.create({
    data: {
      jornadaId: Number(jornadaId),
      phase,
      homeTeamId,
      awayTeamId,
      date: new Date(dateStr),
      status: "upcoming"
    }
  })
}

export async function adminScoreMatch(matchId: string, homeScore: number, awayScore: number) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error("Acceso Degenagado")

  // 1. Marcar Partido como Terminado
  const match = await prisma.tournamentMatch.update({
    where: { id: matchId },
    data: { homeScore, awayScore, status: "finished" }
  })

  // 2. Motor Matemático de Repartición de Puntos
  const rules = { exact: 5, dif: 3, res: 1 }
  const realDiff = homeScore - awayScore
  const realWinner = realDiff > 0 ? 'H' : (realDiff < 0 ? 'A' : 'D')

  const predictions = await prisma.prediction.findMany({ where: { matchId } })
  
  for (const p of predictions) {
    let pts = 0
    if (p.homeScore === homeScore && p.awayScore === awayScore) {
      pts = rules.exact
    } else {
      const pDiff = p.homeScore - p.awayScore
      const pWinner = pDiff > 0 ? 'H' : (pDiff < 0 ? 'A' : 'D')
      
      if (pWinner === realWinner) {
         if (pDiff === realDiff) {
            pts = rules.dif
         } else {
            pts = rules.res
         }
      }
    }
    
    // Si ganó puntos, inyectarlos a su membresía
    if (pts > 0) {
      // Obtenemos todos los grupos en los que participa el jugador
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
