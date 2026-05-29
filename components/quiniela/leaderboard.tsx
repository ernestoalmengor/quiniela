"use client"

import { cn } from "@/lib/utils"
import { Trophy, Medal, TrendingUp, Copy } from "lucide-react"
import type { Participant, UserGroup } from "@/lib/types"

interface LeaderboardProps {
  participants: Participant[]
  userGroups?: UserGroup[]
  selectedGroupId?: string
  onGroupChange?: (groupId: string) => void
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="h-4 w-4 text-primary" />
  if (rank === 2) return <Medal className="h-4 w-4 text-warning" />
  if (rank === 3) return <Medal className="h-4 w-4 text-muted-foreground" />
  return null
}

export function Leaderboard({ 
  participants,
  userGroups = [],
  selectedGroupId = "global",
  onGroupChange
}: LeaderboardProps) {
  const sorted = [...participants].sort((a, b) => b.totalPoints - a.totalPoints)
  const maxPoints = sorted[0]?.totalPoints || 1

  return (
    <div className="flex flex-col gap-3">
      {/* Selector de Grupo */}
      {userGroups.length > 0 && onGroupChange && (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm">
          <label className="text-xs font-bold text-muted-foreground uppercase">
            Grupo / Quiniela de Amigos
          </label>
          <select
            value={selectedGroupId}
            onChange={(e) => onGroupChange(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {userGroups
              .filter(g => g.name !== "Clasificación Global" && g.inviteCode !== "GLOBAL-2026")
              .map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))
            }
          </select>

          {selectedGroupId !== "global" && (
            <div className="mt-2 text-xs flex items-center justify-between bg-secondary/50 rounded-lg p-2 border border-border">
              <span className="text-muted-foreground">
                Código para invitar amigos:{" "}
                <span className="font-mono font-bold text-foreground text-sm bg-background px-1.5 py-0.5 rounded border">
                  {userGroups.find(g => g.id === selectedGroupId)?.inviteCode}
                </span>
              </span>
              <button 
                onClick={() => {
                  const code = userGroups.find(g => g.id === selectedGroupId)?.inviteCode
                  if (code) {
                    navigator.clipboard.writeText(code)
                    alert("¡Código de invitación copiado al portapapeles!")
                  }
                }}
                className="text-primary font-bold hover:underline flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" /> Copiar
              </button>
            </div>
          )}
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 bg-card border border-border rounded-xl">
          No hay participantes en este grupo.
        </p>
      ) : (
        <>
          {/* Top 3 Podium */}
          <div className="flex items-end justify-center gap-3 pb-2 pt-4">
            {[sorted[1], sorted[0], sorted[2]].map((p, i) => {
              if (!p) return null
              const rank = i === 0 ? 2 : i === 1 ? 1 : 3
              const height = rank === 1 ? "h-28" : rank === 2 ? "h-20" : "h-16"

              return (
                <div key={p.id} className="flex flex-col items-center gap-2">
                  <div className="relative">
                    {rank === 1 && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Trophy className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "h-12 w-12 overflow-hidden rounded-full ring-2",
                        rank === 1 ? "ring-primary" : rank === 2 ? "ring-warning" : "ring-border"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.avatar}
                        alt={p.name}
                        className="h-full w-full object-cover bg-muted"
                        crossOrigin="anonymous"
                      />
                    </div>
                  </div>
                  <span className="max-w-[70px] truncate text-xs font-semibold text-foreground">{p.name}</span>
                  <div
                    className={cn(
                      "flex w-16 flex-col items-center justify-end rounded-t-lg transition-all duration-500",
                      height,
                      rank === 1
                        ? "bg-primary/20"
                        : rank === 2
                          ? "bg-warning/15"
                          : "bg-secondary"
                    )}
                  >
                    <span className="pb-2 text-lg font-black text-foreground">{p.totalPoints}</span>
                    <span className="pb-1.5 text-[10px] font-medium text-muted-foreground">pts</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Full List */}
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Clasificación del Grupo</h3>
            </div>

            <div className="divide-y divide-border">
              {sorted.map((participant, index) => {
                const rank = index + 1
                const progress = (participant.totalPoints / maxPoints) * 100

                return (
                  <div
                    key={participant.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/50",
                      rank <= 3 && "bg-secondary/20"
                    )}
                  >
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center">
                      {getRankIcon(rank) || (
                        <span className="text-sm font-bold text-muted-foreground">{rank}</span>
                      )}
                    </div>

                    <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={participant.avatar}
                        alt={participant.name}
                        className="h-full w-full object-cover bg-muted"
                        crossOrigin="anonymous"
                      />
                    </div>

                    <div className="flex flex-1 flex-col gap-1">
                      <span className="text-sm font-semibold text-foreground">{participant.name}</span>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            rank === 1 ? "bg-primary" : rank <= 3 ? "bg-warning" : "bg-muted-foreground/40"
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-lg font-black tabular-nums text-foreground">
                        {participant.totalPoints}
                      </span>
                      <span className="text-[10px] text-muted-foreground">puntos</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
