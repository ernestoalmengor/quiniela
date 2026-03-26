"use client"

import { Calendar, BarChart3, Info, Users, Zap, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
  totalParticipants: number
  liveMatches: number
  currentJornada: string
}

const tabs = [
  { id: "matches", label: "Partidos", icon: Calendar },
  { id: "groups", label: "Grupos", icon: Users },
  { id: "bracket", label: "Llaves", icon: Trophy },
  { id: "leaderboard", label: "Ranking", icon: BarChart3 },
  { id: "rules", label: "Reglas", icon: Info },
]

export function BottomNav({
  activeTab,
  onTabChange,
  totalParticipants,
  liveMatches,
  currentJornada,
}: BottomNavProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/90 backdrop-blur-xl">
      {/* Mini stats ribbon */}
      <div className="mx-auto flex max-w-5xl items-center justify-center gap-4 px-4 py-1.5 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {totalParticipants} jugadores
        </span>
        <span className="h-3 w-px bg-border" aria-hidden="true" />
        <span className="flex items-center gap-1">
          <Trophy className="h-3 w-3" />
          {currentJornada}
        </span>
        {liveMatches > 0 && (
          <>
            <span className="h-3 w-px bg-border" aria-hidden="true" />
            <span className="flex items-center gap-1 font-medium text-live">
              <Zap className="h-3 w-3" />
              {liveMatches} en vivo
            </span>
          </>
        )}
      </div>

      {/* Tab navigation */}
      <nav
        className="mx-auto flex max-w-5xl items-center justify-around px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1"
        role="tablist"
        aria-label="Navegacion principal"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-5 py-1.5 text-[11px] font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5", isActive && "drop-shadow-[0_0_6px_var(--primary)]")} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 h-0.5 w-3 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </div>
              <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
