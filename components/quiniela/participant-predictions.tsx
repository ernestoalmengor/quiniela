"use client"

import { useState } from "react"
import { ChevronDown, User } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Participant, Match } from "@/lib/types"

interface ParticipantPredictionsProps {
  participants: Participant[]
  matches: Match[]
}

export function ParticipantPredictions({ participants, matches }: ParticipantPredictionsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const sorted = [...participants].sort((a, b) => b.totalPoints - a.totalPoints)

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <User className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Predicciones por Jugador</h3>
      </div>

      <div className="divide-y divide-border">
        {sorted.map((participant) => {
          const isExpanded = expandedId === participant.id

          return (
            <div key={participant.id}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : participant.id)}
                className="flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/50"
                aria-expanded={isExpanded}
              >
                <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={participant.avatar}
                    alt={participant.name}
                    className="h-full w-full object-cover"
                    crossOrigin="anonymous"
                  />
                </div>
                <span className="flex-1 text-left text-sm font-semibold text-foreground">
                  {participant.name}
                </span>
                <span className="text-sm font-bold text-primary">{participant.totalPoints} pts</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    isExpanded && "rotate-180"
                  )}
                />
              </button>

              {isExpanded && (
                <div className="border-t border-border bg-secondary/20 px-4 py-3">
                  <div className="flex flex-col gap-2">
                    {matches.map((match) => {
                      const pred = participant.predictions[match.id]
                      if (!pred) return null

                      return (
                        <div
                          key={match.id}
                          className="flex items-center justify-between rounded-lg bg-card px-3 py-2 text-xs"
                        >
                          <span className="font-medium text-muted-foreground">
                            {match.homeTeam.shortName} vs {match.awayTeam.shortName}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">
                              {pred.home} - {pred.away}
                            </span>
                            {match.status === "finished" && match.score && (
                              <span className="text-[10px] text-muted-foreground">
                                (Real: {match.score.home}-{match.score.away})
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
