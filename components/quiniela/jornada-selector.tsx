"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Jornada } from "@/lib/types"

interface JornadaSelectorProps {
  jornadas: Jornada[]
  selectedId: number
  onSelect: (id: number) => void
}

function getStatusLabel(status: Jornada["status"]) {
  switch (status) {
    case "finished":
      return "Finalizada"
    case "live":
      return "En Vivo"
    case "upcoming":
      return "Proxima"
  }
}

function getStatusColor(status: Jornada["status"]) {
  switch (status) {
    case "finished":
      return "text-muted-foreground"
    case "live":
      return "text-live"
    case "upcoming":
      return "text-primary"
  }
}

export function JornadaSelector({ jornadas, selectedId, onSelect }: JornadaSelectorProps) {
  const currentIndex = jornadas.findIndex((j) => j.id === selectedId)
  const canPrev = currentIndex > 0
  const canNext = currentIndex < jornadas.length - 1
  const selected = jornadas[currentIndex]

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
      <button
        onClick={() => canPrev && onSelect(jornadas[currentIndex - 1].id)}
        disabled={!canPrev}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
          canPrev
            ? "bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground"
            : "text-muted-foreground/30 cursor-not-allowed"
        )}
        aria-label="Jornada anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="flex flex-col items-center gap-0.5">
        <span className="text-xs font-medium text-muted-foreground">{selected?.phase?.name || "Fase de grupos"}</span>
        <span className="text-sm font-bold text-foreground">{selected?.name}</span>
      </div>

      <button
        onClick={() => canNext && onSelect(jornadas[currentIndex + 1].id)}
        disabled={!canNext}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
          canNext
            ? "bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground"
            : "text-muted-foreground/30 cursor-not-allowed"
        )}
        aria-label="Jornada siguiente"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
