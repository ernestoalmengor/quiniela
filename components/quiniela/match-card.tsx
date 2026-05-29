"use client"

import { MapPin, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Match, Prediction } from "@/lib/types"
import { adminScoreMatch, adminDeleteMatch } from "@/lib/admin-actions"
import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"

interface MatchCardProps {
  match: Match
  prediction?: Prediction
  onPredictionChange?: (matchId: string, prediction: Prediction) => void
  showPrediction?: boolean
  isAdmin?: boolean
  onEdit?: () => void
}

export function MatchCard({ match, prediction, onPredictionChange, showPrediction = true, isAdmin = false, onEdit }: MatchCardProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [adminScoreH, setAdminScoreH] = useState("")
  const [adminScoreA, setAdminScoreA] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const isLive = match.status === "live"
  const isFinished = match.status === "finished"
  const isUpcoming = match.status === "upcoming"

  const [localHome, setLocalHome] = useState(prediction?.home?.toString() ?? "")
  const [localAway, setLocalAway] = useState(prediction?.away?.toString() ?? "")
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    setLocalHome(prediction?.home?.toString() ?? "")
    setLocalAway(prediction?.away?.toString() ?? "")
  }, [prediction?.home, prediction?.away])

  const handleSavePrediction = () => {
    const h = parseInt(localHome)
    const a = parseInt(localAway)
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0 || h > 99 || a > 99) {
      alert("Por favor ingresa un marcador válido.")
      return
    }
    if (onPredictionChange) {
      onPredictionChange(match.id, { home: h, away: a })
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 2000)
    }
  }

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const matchDate = new Date(match.date)
  const dateFormatted = mounted ? matchDate.toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }) : "..."
  const timeFormatted = mounted ? matchDate.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }) : "--:--"

  const getPointsEarned = () => {
    if (!isFinished || !match.score || !prediction) return null
    const actualHome = match.score.home
    const actualAway = match.score.away
    const predHome = prediction.home
    const predAway = prediction.away

    if (predHome === actualHome && predAway === actualAway) return { points: 5, label: "Exacto" }

    const actualResult = actualHome > actualAway ? "H" : actualHome < actualAway ? "A" : "D"
    const predResult = predHome > predAway ? "H" : predHome < predAway ? "A" : "D"

    let points = 0
    if (actualResult === predResult) points += 3
    if (actualHome - actualAway === predHome - predAway) points += 1

    if (points > 0) return { points, label: points >= 3 ? "Resultado" : "Dif. goles" }
    return { points: 0, label: "Sin puntos" }
  }

  const handleAdminScore = async () => {
    if (!adminScoreH || !adminScoreA) return alert("Ingresa marcador final")
    if (!confirm("Finalizar partido y repartir puntos irrevocablemente?")) return
    setIsSubmitting(true)
    try {
      await adminScoreMatch(match.id, parseInt(adminScoreH), parseInt(adminScoreA))
      startTransition(() => router.refresh())
    } catch(e) {
      alert("Error")
    }
    setIsSubmitting(false)
  }

  const handleAdminDelete = async () => {
    if (!confirm("Eliminar partido?")) return
    setIsSubmitting(true)
    try {
      await adminDeleteMatch(match.id)
      startTransition(() => router.refresh())
    } catch(e) {
      alert("Error")
    }
    setIsSubmitting(false)
  }

  const pointsInfo = getPointsEarned()

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/30",
        isLive && "border-live/40 shadow-[0_0_20px_-5px] shadow-live/20"
      )}
    >
      {isLive && (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-live" />
      )}

      <div className="flex items-center justify-between px-4 py-2">
        <div suppressHydrationWarning className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span suppressHydrationWarning className="capitalize">{dateFormatted}</span>
          <span className="text-foreground/60">{'|'}</span>
          <span suppressHydrationWarning>{timeFormatted}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isLive && (
            <span className="flex items-center gap-1.5 rounded-full bg-live/15 px-2 py-0.5 text-xs font-semibold text-live">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-live" />
              </span>
              {match.minute ? `${match.minute}'` : "EN VIVO"}
            </span>
          )}
          {isFinished && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Final
            </span>
          )}
          {isUpcoming && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Pendiente
            </span>
          )}
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="flex items-center justify-between gap-3">
          {/* Home Team */}
          <div className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-secondary">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={match.homeTeam.logo}
                alt={match.homeTeam.name}
                className="h-8 w-8 object-contain"
                crossOrigin="anonymous"
              />
            </div>
            <span className="text-center text-xs font-semibold leading-tight text-foreground">
              {match.homeTeam.shortName}
            </span>
          </div>

          {/* Score / Prediction */}
          <div className="flex flex-col items-center gap-1.5">
            {(isLive || isFinished) && match.score ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tabular-nums text-foreground">
                  {match.score.home}
                </span>
                <span className="text-sm font-medium text-muted-foreground">-</span>
                <span className="text-2xl font-black tabular-nums text-foreground">
                  {match.score.away}
                </span>
              </div>
            ) : (
              <span className="text-sm font-bold text-muted-foreground">VS</span>
            )}

            {pointsInfo && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold",
                  pointsInfo.points === 5
                    ? "bg-primary/20 text-primary"
                    : pointsInfo.points >= 3
                      ? "bg-warning/20 text-warning"
                      : pointsInfo.points > 0
                        ? "bg-secondary text-muted-foreground"
                        : "bg-destructive/10 text-destructive"
                )}
              >
                +{pointsInfo.points} {pointsInfo.label}
              </span>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-secondary">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={match.awayTeam.logo}
                alt={match.awayTeam.name}
                className="h-8 w-8 object-contain"
                crossOrigin="anonymous"
              />
            </div>
            <span className="text-center text-xs font-semibold leading-tight text-foreground">
              {match.awayTeam.shortName}
            </span>
          </div>
        </div>

        {/* Prediction Input */}
        {showPrediction && isUpcoming && (
          <div className="mt-3 flex flex-col items-center justify-center gap-3 rounded-lg bg-secondary/50 px-4 py-3">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full">
              <div className="flex justify-start">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Tu prediccion
                </span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={localHome}
                  onChange={(e) => {
                    setLocalHome(e.target.value)
                    setIsSaved(false)
                  }}
                  placeholder="-"
                  className="h-8 w-10 rounded-lg bg-card text-center text-sm font-bold text-foreground outline-none ring-1 ring-border transition-all focus:ring-2 focus:ring-primary"
                />
                <span className="text-xs font-medium text-muted-foreground">-</span>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={localAway}
                  onChange={(e) => {
                    setLocalAway(e.target.value)
                    setIsSaved(false)
                  }}
                  placeholder="-"
                  className="h-8 w-10 rounded-lg bg-card text-center text-sm font-bold text-foreground outline-none ring-1 ring-border transition-all focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex justify-end"></div>
            </div>
            <button
              onClick={handleSavePrediction}
              className={cn(
                "w-full h-8 rounded-md text-xs font-bold transition-all",
                isSaved ? "bg-emerald-500/20 text-emerald-600 border border-emerald-500/30" : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {isSaved ? "¡Guardado!" : "Guardar Resultado"}
            </button>
          </div>
        )}

        {/* Show prediction for finished/live */}
        {showPrediction && !isUpcoming && prediction && (
          <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-secondary/50 px-4 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tu prediccion:
            </span>
            <span className="text-sm font-bold text-foreground">
              {prediction.home} - {prediction.away}
            </span>
          </div>
        )}
        
        {/* Admin Controls */}
        {isAdmin && !isFinished && (
           <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3 flex flex-col gap-2">
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-primary uppercase">Admin</span>
                <div className="flex items-center gap-2">
                  <button onClick={onEdit} className="px-2 py-1 bg-primary text-primary-foreground rounded text-[10px] font-bold hover:bg-primary/90 transition-colors">Editar</button>
                  <button onClick={handleAdminDelete} disabled={isSubmitting} className="px-2 py-1 bg-destructive text-destructive-foreground rounded text-[10px] font-bold hover:bg-destructive/90 transition-colors">Eliminar</button>
                </div>
             </div>
             <div className="flex gap-2 items-center">
                <input type="number" placeholder="L" className="w-12 h-8 rounded border border-input text-center text-sm font-bold" value={adminScoreH} onChange={e => setAdminScoreH(e.target.value)} />
                <span className="text-xs font-bold">-</span>
                <input type="number" placeholder="V" className="w-12 h-8 rounded border border-input text-center text-sm font-bold" value={adminScoreA} onChange={e => setAdminScoreA(e.target.value)} />
                <button onClick={handleAdminScore} disabled={isSubmitting} className="flex-1 h-8 rounded bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
                   Finalizar Partido
                </button>
             </div>
           </div>
        )}
      </div>
    </div>
  )
}
