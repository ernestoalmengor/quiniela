"use client"

import { MapPin, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Match, Prediction } from "@/lib/types"

interface MatchCardProps {
  match: Match
  prediction?: Prediction
  onPredictionChange?: (matchId: string, prediction: Prediction) => void
  showPrediction?: boolean
}

export function MatchCard({ match, prediction, onPredictionChange, showPrediction = true }: MatchCardProps) {
  const isLive = match.status === "live"
  const isFinished = match.status === "finished"
  const isUpcoming = match.status === "upcoming"

  const handleScoreChange = (team: "home" | "away", value: string) => {
    const num = parseInt(value)
    if (isNaN(num) || num < 0 || num > 99) return
    if (!onPredictionChange) return

    const current = prediction || { home: 0, away: 0 }
    onPredictionChange(match.id, {
      ...current,
      [team]: num,
    })
  }

  const matchDate = new Date(match.date)
  const dateFormatted = matchDate.toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
  const timeFormatted = matchDate.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })

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
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span className="capitalize">{dateFormatted}</span>
          <span className="text-foreground/60">{'|'}</span>
          <span>{timeFormatted}</span>
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
          <div className="mt-3 flex items-center justify-center gap-3 rounded-lg bg-secondary/50 px-4 py-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tu prediccion
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={99}
                value={prediction?.home ?? ""}
                onChange={(e) => handleScoreChange("home", e.target.value)}
                placeholder="-"
                className="h-8 w-10 rounded-lg bg-card text-center text-sm font-bold text-foreground outline-none ring-1 ring-border transition-all focus:ring-2 focus:ring-primary"
                aria-label={`Goles ${match.homeTeam.name}`}
              />
              <span className="text-xs font-medium text-muted-foreground">-</span>
              <input
                type="number"
                min={0}
                max={99}
                value={prediction?.away ?? ""}
                onChange={(e) => handleScoreChange("away", e.target.value)}
                placeholder="-"
                className="h-8 w-10 rounded-lg bg-card text-center text-sm font-bold text-foreground outline-none ring-1 ring-border transition-all focus:ring-2 focus:ring-primary"
                aria-label={`Goles ${match.awayTeam.name}`}
              />
            </div>
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
      </div>

      <div className="flex items-center gap-1.5 border-t border-border px-4 py-1.5">
        <MapPin className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">{match.venue}</span>
      </div>
    </div>
  )
}
