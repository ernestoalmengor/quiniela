"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { X, ChevronRight, Trophy, Target, TrendingUp, Pencil, Palette, UserCircle, Smile, LogOut } from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import type { CurrentUser, Participant, Jornada, Match, Prediction } from "@/lib/types"

const DICEBEAR_BASE = "https://api.dicebear.com/9.x/fun-emoji/svg"

// Opciones para el avatar (DiceBear Fun Emoji)
const EYE_STYLES: { value: string; label: string }[] = [
  { value: "cute", label: "Lindos" },
  { value: "love", label: "Amor" },
  { value: "shades", label: "Gafas oscuras" },
  { value: "glasses", label: "Lentes" },
  { value: "stars", label: "Estrellas" },
  { value: "wink", label: "Guiño 1" },
  { value: "wink2", label: "Guiño 2" },
  { value: "closed", label: "Cerrados" },
  { value: "closed2", label: "Cerrados 2" },
  { value: "sleepClose", label: "Dormido" },
  { value: "plain", label: "Mirada" },
  { value: "pissed", label: "Molesto" },
  { value: "sad", label: "Triste" },
  { value: "tearDrop", label: "Lágrima" },
  { value: "crying", label: "Llorando" },
]

const MOUTH_OPTIONS: { value: string; label: string }[] = [
  { value: "wideSmile", label: "Sonrisa amplia" },
  { value: "smileTeeth", label: "Sonrisa con dientes" },
  { value: "smileLol", label: "Riendo (LOL)" },
  { value: "lilSmile", label: "Sonrisita" },
  { value: "plain", label: "Normal" },
  { value: "cute", label: "Tierna" },
  { value: "kissHeart", label: "Beso corazón" },
  { value: "tongueOut", label: "Sacando lengua" },
  { value: "shy", label: "Tímida" },
  { value: "pissed", label: "Molesta" },
  { value: "shout", label: "Grito" },
  { value: "faceMask", label: "Cubrebocas" },
  { value: "drip", label: "Babear" },
  { value: "sick", label: "Enfermo" },
  { value: "sad", label: "Triste" },
]

const BG_COLORS: { value: string; label: string }[] = [
  { value: "b6e3f4", label: "Celeste" },
  { value: "c0aede", label: "Morado" },
  { value: "d1d4f9", label: "Lila" },
  { value: "ffd5dc", label: "Rosa" },
  { value: "ffdfbf", label: "Naranja" },
  { value: "fde047", label: "Amarillo" },
  { value: "bbf7d0", label: "Verde claro" },
  { value: "fecaca", label: "Rojo claro" },
  { value: "e5e7eb", label: "Gris" },
  { value: "transparent", label: "Transparente" },
]



export interface AvatarOptions {
  seed: string
  eyes: string
  mouth: string
  backgroundColor: string
}

const DEFAULT_AVATAR_OPTIONS: AvatarOptions = {
  seed: "avatar",
  eyes: "cute",
  mouth: "wideSmile",
  backgroundColor: "transparent",
}

function parseAvatarUrl(url: string): AvatarOptions {
  try {
    const u = new URL(url)
    const p = u.searchParams
    return {
      seed: p.get("seed") ?? DEFAULT_AVATAR_OPTIONS.seed,
      eyes: p.get("eyes") ?? DEFAULT_AVATAR_OPTIONS.eyes,
      mouth: p.get("mouth") ?? DEFAULT_AVATAR_OPTIONS.mouth,
      backgroundColor: p.get("backgroundColor") ?? DEFAULT_AVATAR_OPTIONS.backgroundColor,
    }
  } catch {
    return { ...DEFAULT_AVATAR_OPTIONS }
  }
}

function buildAvatarUrl(opts: AvatarOptions): string {
  const params = new URLSearchParams()
  params.set("seed", opts.seed)
  if (opts.eyes !== "default") params.set("eyes", opts.eyes)
  if (opts.mouth !== "default") params.set("mouth", opts.mouth)
  if (opts.backgroundColor !== "transparent") params.set("backgroundColor", opts.backgroundColor)
  return `${DICEBEAR_BASE}?${params.toString()}`
}

function buildAvatarUrlWithOverride(opts: AvatarOptions, override: Partial<AvatarOptions>): string {
  return buildAvatarUrl({ ...opts, ...override })
}

interface ProfilePanelProps {
  open: boolean
  onClose: () => void
  user: CurrentUser
  participant: Participant | undefined
  jornadas: Jornada[]
  onAvatarChange: (newAvatar: string) => void
}

function getMatchResult(match: Match): "H" | "A" | "D" | null {
  if (!match.score) return null
  if (match.score.home > match.score.away) return "H"
  if (match.score.home < match.score.away) return "A"
  return "D"
}

function getPredResult(pred: Prediction): "H" | "A" | "D" {
  if (pred.home > pred.away) return "H"
  if (pred.home < pred.away) return "A"
  return "D"
}

function calcPoints(match: Match, pred: Prediction): number {
  if (!match.score) return 0
  const { home: aH, away: aA } = match.score
  const { home: pH, away: pA } = pred
  if (pH === aH && pA === aA) return 5
  let pts = 0
  if (getMatchResult(match) === getPredResult(pred)) pts += 3
  if (aH - aA === pH - pA) pts += 1
  return pts
}

export function ProfilePanel({ open, onClose, user, participant, jornadas, onAvatarChange }: ProfilePanelProps) {
  const [editingAvatar, setEditingAvatar] = useState(false)
  const [expandedJornada, setExpandedJornada] = useState<number | null>(null)
  const [avatarOptions, setAvatarOptions] = useState<AvatarOptions>(() =>
    user.avatar.includes("fun-emoji") ? parseAvatarUrl(user.avatar) : DEFAULT_AVATAR_OPTIONS
  )

  useEffect(() => {
    if (editingAvatar && user.avatar.includes("fun-emoji")) {
      setAvatarOptions(parseAvatarUrl(user.avatar))
    }
  }, [editingAvatar, user.avatar])

  const previewAvatarUrl = useMemo(() => buildAvatarUrl(avatarOptions), [avatarOptions])
  const updateAvatarOption = useCallback(<K extends keyof AvatarOptions>(key: K, value: AvatarOptions[K]) => {
    setAvatarOptions((prev) => {
      const next = { ...prev, [key]: value }
      onAvatarChange(buildAvatarUrl(next))
      return next
    })
  }, [onAvatarChange])

  const totalPoints = participant?.totalPoints ?? 0
  const predictions = participant?.predictions ?? {}

  // Build prediction history grouped by jornada
  const history = jornadas
    .filter((j) => j.status === "finished" || j.status === "live")
    .map((jornada) => {
      const matchResults = jornada.matches
        .filter((m) => m.status === "finished" && predictions[m.id])
        .map((m) => {
          const pred = predictions[m.id]
          const pts = calcPoints(m, pred)
          return {
            match: m,
            prediction: pred,
            points: pts,
            exact: pts === 5,
            correctResult: pts >= 3 && pts < 5,
          }
        })

      const jornadaPoints = matchResults.reduce((sum, r) => sum + r.points, 0)
      const exactCount = matchResults.filter((r) => r.exact).length
      const correctCount = matchResults.filter((r) => r.correctResult).length

      return {
        jornada,
        matchResults,
        jornadaPoints,
        exactCount,
        correctCount,
      }
    })

  const totalExact = history.reduce((s, h) => s + h.exactCount, 0)
  const totalCorrect = history.reduce((s, h) => s + h.correctCount, 0)
  const totalPredictions = history.reduce((s, h) => s + h.matchResults.length, 0)

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-background/60 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-[70] flex w-full max-w-sm flex-col bg-card shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-label="Mi perfil"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-bold text-foreground">Mi Perfil</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Cerrar perfil"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Avatar + Name Section */}
          <div className="flex flex-col items-center gap-3 px-5 py-6">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.avatar}
                alt={`Avatar de ${user.name}`}
                className="h-20 w-20 rounded-full border-4 border-primary/30 bg-secondary"
                crossOrigin="anonymous"
              />
              <button
                onClick={() => setEditingAvatar(!editingAvatar)}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground transition-transform hover:scale-110"
                aria-label="Editar avatar"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-lg font-bold text-foreground">{user.name}</span>
              <span className="text-sm text-muted-foreground">{totalPoints} puntos totales</span>
            </div>
          </div>

          {/* Editor de avatar estilo Duolingo: vista previa grande + filas táctiles */}
          {editingAvatar && (
            <div className="mx-5 mb-4 space-y-5 rounded-xl border border-border bg-secondary/50 p-4">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Personalizar avatar
                </span>
              </div>

              {/* Vista previa grande */}
              <div className="flex justify-center py-2">
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-primary/40 bg-card shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    key={previewAvatarUrl}
                    src={previewAvatarUrl}
                    alt="Vista previa de tu avatar"
                    className="h-full w-full object-cover"
                    crossOrigin="anonymous"
                  />
                </div>
              </div>



              {/* Filas de opciones táctiles (sin dropdowns) */}
              <div className="space-y-4">
                {/* Ojos */}
                <div className="space-y-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Smile className="h-3.5 w-3.5 text-primary" />
                    Ojos
                  </span>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {EYE_STYLES.map((o) => {
                      const isSelected = avatarOptions.eyes === o.value
                      const url = buildAvatarUrlWithOverride(avatarOptions, { eyes: o.value })
                      return (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => updateAvatarOption("eyes", o.value)}
                          className={cn(
                            "relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 bg-card transition-transform active:scale-95",
                            isSelected ? "border-primary ring-2 ring-primary/50" : "border-border hover:border-primary/50"
                          )}
                          title={o.label}
                          aria-label={o.label}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="" className="h-full w-full object-cover" crossOrigin="anonymous" />
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Boca */}
                <div className="space-y-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Smile className="h-3.5 w-3.5 text-primary" />
                    Boca
                  </span>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {MOUTH_OPTIONS.map((o) => {
                      const isSelected = avatarOptions.mouth === o.value
                      const url = buildAvatarUrlWithOverride(avatarOptions, { mouth: o.value })
                      return (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => updateAvatarOption("mouth", o.value)}
                          className={cn(
                            "relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 bg-card transition-transform active:scale-95",
                            isSelected ? "border-primary ring-2 ring-primary/50" : "border-border hover:border-primary/50"
                          )}
                          title={o.label}
                          aria-label={o.label}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="" className="h-full w-full object-cover" crossOrigin="anonymous" />
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Color de fondo */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-foreground">Color de fondo</span>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {BG_COLORS.map((o) => {
                      const isSelected = avatarOptions.backgroundColor === o.value
                      return (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => updateAvatarOption("backgroundColor", o.value)}
                          className={cn(
                            "h-9 w-9 shrink-0 rounded-full border-2 transition-transform active:scale-95",
                            isSelected ? "border-primary ring-2 ring-primary/50" : "border-border hover:border-primary/50"
                          )}
                          style={{ backgroundColor: o.value !== "transparent" ? `#${o.value}` : "transparent" }}
                          title={o.label}
                          aria-label={o.label}
                        >
                          {o.value === "transparent" && (
                            <span className="block h-full w-full rounded-full border-2 border-dashed border-muted-foreground/30" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <p className="text-[10px] text-muted-foreground text-center">
                  Toca una opción para aplicarla. Los cambios se ven al instante.
                </p>
                <button
                  type="button"
                  onClick={() => setEditingAvatar(false)}
                  className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:bg-primary/90 active:scale-95"
                >
                  Confirmar Avatar
                </button>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-2 px-5">
            <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-secondary/50 py-3">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-lg font-black text-foreground">{totalPoints}</span>
              <span className="text-[10px] text-muted-foreground">Puntos</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-secondary/50 py-3">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-lg font-black text-foreground">{totalExact}</span>
              <span className="text-[10px] text-muted-foreground">Exactos</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-secondary/50 py-3">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-lg font-black text-foreground">{totalPredictions}</span>
              <span className="text-[10px] text-muted-foreground">Predicciones</span>
            </div>
          </div>

          {/* Prediction History */}
          <div className="mt-5 px-5 pb-8">
            <h3 className="mb-3 text-sm font-bold text-foreground">Historial de Predicciones</h3>

            {history.length === 0 ? (
              <p className="rounded-xl border border-border bg-secondary/30 px-4 py-6 text-center text-sm text-muted-foreground">
                Aun no hay predicciones con resultados
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {history.map(({ jornada, matchResults, jornadaPoints, exactCount, correctCount }) => (
                  <div
                    key={jornada.id}
                    className="overflow-hidden rounded-xl border border-border"
                  >
                    <button
                      onClick={() =>
                        setExpandedJornada(expandedJornada === jornada.id ? null : jornada.id)
                      }
                      className="flex w-full items-center justify-between bg-secondary/50 px-4 py-3 text-left transition-colors hover:bg-secondary"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-foreground">{jornada.name}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {exactCount > 0 && `${exactCount} exacto${exactCount > 1 ? "s" : ""}`}
                          {exactCount > 0 && correctCount > 0 && " / "}
                          {correctCount > 0 && `${correctCount} resultado${correctCount > 1 ? "s" : ""}`}
                          {exactCount === 0 && correctCount === 0 && `${matchResults.length} partido${matchResults.length > 1 ? "s" : ""}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-primary">{jornadaPoints} pts</span>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform",
                            expandedJornada === jornada.id && "rotate-90"
                          )}
                        />
                      </div>
                    </button>

                    {expandedJornada === jornada.id && (
                      <div className="divide-y divide-border bg-card">
                        {matchResults.map(({ match, prediction, points, exact }) => (
                          <div
                            key={match.id}
                            className="flex items-center gap-3 px-4 py-2.5"
                          >
                            <div className="flex flex-1 flex-col gap-0.5">
                              <span className="text-xs font-semibold text-foreground">
                                {match.homeTeam.shortName} vs {match.awayTeam.shortName}
                              </span>
                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                <span>
                                  Real: {match.score?.home}-{match.score?.away}
                                </span>
                                <span className="text-foreground/30">{'|'}</span>
                                <span>
                                  Tu: {prediction.home}-{prediction.away}
                                </span>
                              </div>
                            </div>
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[11px] font-bold",
                                exact
                                  ? "bg-primary/20 text-primary"
                                  : points >= 3
                                    ? "bg-warning/20 text-warning"
                                    : points > 0
                                      ? "bg-secondary text-muted-foreground"
                                      : "bg-destructive/10 text-destructive"
                              )}
                            >
                              +{points}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {/* Sign Out Button */}
            <div className="mt-8 px-5 pb-8">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive/10 py-3 text-sm font-bold text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground active:scale-95"
              >
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
