"use client"

import { Users, Zap, Calendar, Trophy } from "lucide-react"

interface StatsBarProps {
  totalParticipants: number
  totalMatches: number
  liveMatches: number
  currentJornada: string
}

export function StatsBar({ totalParticipants, totalMatches, liveMatches, currentJornada }: StatsBarProps) {
  const stats: Array<{ icon: typeof Users; label: string; value: number | string; highlight?: boolean }> = [
    { icon: Users, label: "Jugadores", value: totalParticipants },
    { icon: Calendar, label: "Partidos", value: totalMatches },
    { icon: Zap, label: "En Vivo", value: liveMatches, highlight: liveMatches > 0 },
    { icon: Trophy, label: "Jornada", value: currentJornada },
  ]

  return (
    <div className="grid grid-cols-4 gap-2">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className="flex flex-col items-center gap-1 rounded-lg border border-border bg-card px-2 py-2.5"
          >
            <Icon
              className={`h-4 w-4 ${stat.highlight ? "text-live" : "text-primary"}`}
            />
            <span className="text-sm font-black tabular-nums text-foreground">{stat.value}</span>
            <span className="text-[10px] text-muted-foreground">{stat.label}</span>
          </div>
        )
      })}
    </div>
  )
}
