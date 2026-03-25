"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { X, ChevronRight, Trophy, Target, TrendingUp, Pencil, Palette, UserCircle, Smile } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CurrentUser, Participant, Jornada, Match, Prediction } from "@/lib/types"

const DICEBEAR_BASE = "https://api.dicebear.com/9.x/avataaars/svg"

// Opciones para el avatar (DiceBear Avataaars)
const SKIN_COLORS: { value: string; label: string }[] = [
  { value: "edb98a", label: "Claro" },
  { value: "f8d9ce", label: "Muy claro" },
  { value: "d08b5b", label: "Medio" },
  { value: "ae5d29", label: "Moreno" },
  { value: "614335", label: "Oscuro" },
]

const EYE_STYLES: { value: string; label: string }[] = [
  { value: "default", label: "Normal" },
  { value: "happy", label: "Feliz" },
  { value: "wink", label: "Guiño" },
  { value: "squint", label: "Entrecerrado" },
  { value: "surprised", label: "Sorpresa" },
  { value: "side", label: "Lateral" },
  { value: "hearts", label: "Corazones" },
]

const HAIR_STYLES: { value: string; label: string }[] = [
  { value: "longHairStraight", label: "Largo liso" },
  { value: "longHairCurly", label: "Largo rizado" },
  { value: "longHairBob", label: "Bob" },
  { value: "shortHairShortWaved", label: "Corto ondulado" },
  { value: "shortHairShortFlat", label: "Corto plano" },
  { value: "shortHairFrizzle", label: "Corto crespo" },
  { value: "noHair", label: "Sin pelo" },
  { value: "hat", label: "Sombrero" },
  { value: "hijab", label: "Hiyab" },
  { value: "turban", label: "Turbante" },
  { value: "eyepatch", label: "Parche" },
]

const HAIR_COLORS: { value: string; label: string }[] = [
  { value: "000", label: "Negro" },
  { value: "4a312c", label: "Castaño oscuro" },
  { value: "724133", label: "Castaño" },
  { value: "b58143", label: "Rubio oscuro" },
  { value: "a0652a", label: "Rubio" },
  { value: "f59797", label: "Pelirrojo" },
  { value: "e6e6e6", label: "Blanco/Gris" },
  { value: "fff", label: "Blanco" },
]

const CLOTHING_TYPES: { value: string; label: string }[] = [
  { value: "blazerShirt", label: "Blazer" },
  { value: "blazerSweater", label: "Blazer suéter" },
  { value: "collarSweater", label: "Sweater con cuello" },
  { value: "graphicShirt", label: "Playera con estampado" },
  { value: "hoodie", label: "Hoodie" },
  { value: "overall", label: "Overall" },
  { value: "shirtCrewNeck", label: "Cuello redondo" },
  { value: "shirtScoopNeck", label: "Escote cuchara" },
  { value: "shirtVNeck", label: "Cuello V" },
]

const CLOTHING_COLORS: { value: string; label: string }[] = [
  { value: "1f2937", label: "Gris oscuro" },
  { value: "374151", label: "Gris" },
  { value: "4b5563", label: "Gris medio" },
  { value: "6b7280", label: "Gris claro" },
  { value: "2563eb", label: "Azul" },
  { value: "dc2626", label: "Rojo" },
  { value: "16a34a", label: "Verde" },
  { value: "ca8a04", label: "Amarillo" },
  { value: "000", label: "Negro" },
  { value: "fff", label: "Blanco" },
]

const ACCESSORIES: { value: string; label: string }[] = [
  { value: "blank", label: "Ninguno" },
  { value: "round", label: "Gafas redondas" },
  { value: "wayfarers", label: "Gafas wayfarer" },
  { value: "sunglasses", label: "Gafas de sol" },
  { value: "prescription01", label: "Lentes fórmula 1" },
  { value: "prescription02", label: "Lentes fórmula 2" },
  { value: "kurt", label: "Kurt" },
]

/** Expresiones animadas: boca + cejas (como Duolingo). */
const MOUTH_OPTIONS: { value: string; label: string }[] = [
  { value: "smile", label: "Sonrisa" },
  { value: "tongue", label: "Lengua (muy feliz)" },
  { value: "twinkle", label: "Guiño sonriente" },
  { value: "default", label: "Neutral" },
  { value: "serious", label: "Serio" },
  { value: "sad", label: "Triste" },
  { value: "concerned", label: "Preocupado" },
  { value: "disbelief", label: "Increíble" },
  { value: "eating", label: "Comiendo" },
  { value: "grimace", label: "Mueca" },
  { value: "screamOpen", label: "Grito" },
  { value: "vomit", label: "Asco" },
]

const EYEBROW_OPTIONS: { value: string; label: string }[] = [
  { value: "defaultNatural", label: "Natural" },
  { value: "raisedExcited", label: "Emocionado" },
  { value: "raisedExcitedNatural", label: "Alegre" },
  { value: "flatNatural", label: "Plano" },
  { value: "unibrowNatural", label: "Uniceja" },
  { value: "angry", label: "Enojado" },
  { value: "sadConcerned", label: "Triste" },
  { value: "frownNatural", label: "Ceño" },
  { value: "default", label: "Normal" },
]

/** Seeds para elegir un personaje/avatar base distinto (cada uno genera una cara diferente). */
const AVATAR_SEEDS = [
  "carlos",
  "maria",
  "jorge",
  "ana",
  "roberto",
  "laura",
  "diego",
  "sofia",
  "pedro",
  "lucia",
  "marcos",
  "elena",
  "miguel",
  "carmen",
  "pablo",
  "rosa",
  "fernando",
  "isabel",
  "andres",
  "valentina",
]

export interface AvatarOptions {
  seed: string
  skinColor: string
  eyes: string
  eyebrow: string
  mouth: string
  top: string
  hairColor: string
  clothes: string
  clothColor: string
  accessories: string
}

const DEFAULT_AVATAR_OPTIONS: AvatarOptions = {
  seed: "avatar",
  skinColor: SKIN_COLORS[0].value,
  eyes: EYE_STYLES[0].value,
  eyebrow: "defaultNatural",
  mouth: "smile",
  top: HAIR_STYLES[0].value,
  hairColor: HAIR_COLORS[0].value,
  clothes: CLOTHING_TYPES[0].value,
  clothColor: CLOTHING_COLORS[0].value,
  accessories: ACCESSORIES[0].value,
}

function parseAvatarUrl(url: string): AvatarOptions {
  try {
    const u = new URL(url)
    const p = u.searchParams
    return {
      seed: p.get("seed") ?? DEFAULT_AVATAR_OPTIONS.seed,
      skinColor: p.get("skinColor") ?? DEFAULT_AVATAR_OPTIONS.skinColor,
      eyes: p.get("eyes") ?? DEFAULT_AVATAR_OPTIONS.eyes,
      eyebrow: p.get("eyebrow") ?? DEFAULT_AVATAR_OPTIONS.eyebrow,
      mouth: p.get("mouth") ?? DEFAULT_AVATAR_OPTIONS.mouth,
      top: p.get("topType") ?? p.get("top") ?? DEFAULT_AVATAR_OPTIONS.top,
      hairColor: p.get("hairColor") ?? DEFAULT_AVATAR_OPTIONS.hairColor,
      clothes: p.get("clothes") ?? DEFAULT_AVATAR_OPTIONS.clothes,
      clothColor: p.get("clothColor") ?? DEFAULT_AVATAR_OPTIONS.clothColor,
      accessories: p.get("accessories") ?? DEFAULT_AVATAR_OPTIONS.accessories,
    }
  } catch {
    return { ...DEFAULT_AVATAR_OPTIONS }
  }
}

/** Convierte hex 3 chars a 6 (ej: 000 -> 000000, fff -> ffffff) para la API. */
function normalizeHex(color: string): string {
  if (color.length === 3) {
    return color
      .split("")
      .map((c) => c + c)
      .join("")
  }
  return color
}

function buildAvatarUrl(opts: AvatarOptions): string {
  const params = new URLSearchParams()
  params.set("seed", opts.seed)
  params.set("skinColor", normalizeHex(opts.skinColor))
  params.set("eyes", opts.eyes)
  params.set("eyebrow", opts.eyebrow)
  params.set("mouth", opts.mouth)
  params.set("topType", opts.top) // La API usa topType, no top
  params.set("hairColor", normalizeHex(opts.hairColor))
  params.set("clothes", opts.clothes)
  params.set("clothColor", "#" + normalizeHex(opts.clothColor))
  if (opts.accessories && opts.accessories !== "blank") {
    params.set("accessories", opts.accessories)
    params.set("accessoriesProbability", "100") // Para que siempre se muestren gafas, etc.
  }
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
    user.avatar.includes("avataaars") ? parseAvatarUrl(user.avatar) : DEFAULT_AVATAR_OPTIONS
  )

  useEffect(() => {
    if (editingAvatar && user.avatar.includes("avataaars")) {
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

              {/* Elegir personaje / Cambiar avatar base */}
              <div className="space-y-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <UserCircle className="h-3.5 w-3.5 text-primary" />
                  Elegir personaje
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Elige un avatar base; luego personaliza abajo.
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {AVATAR_SEEDS.map((seed) => {
                    const isSelected = avatarOptions.seed === seed
                    const url = buildAvatarUrlWithOverride(avatarOptions, { seed })
                    return (
                      <button
                        key={seed}
                        type="button"
                        onClick={() => updateAvatarOption("seed", seed)}
                        className={cn(
                          "relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 bg-card transition-transform active:scale-95",
                          isSelected ? "border-primary ring-2 ring-primary/50" : "border-border hover:border-primary/50"
                        )}
                        title={seed}
                        aria-label={`Personaje ${seed}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="h-full w-full object-cover" crossOrigin="anonymous" />
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Filas de opciones táctiles (sin dropdowns) */}
              <div className="space-y-4">
                {/* Expresión (boca + cejas) - avatares más animados */}
                <div className="space-y-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Smile className="h-3.5 w-3.5 text-primary" />
                    Expresión
                  </span>
                  <p className="text-[11px] text-muted-foreground">Boca (animada)</p>
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
                  <p className="text-[11px] text-muted-foreground mt-1">Cejas</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {EYEBROW_OPTIONS.map((o) => {
                      const isSelected = avatarOptions.eyebrow === o.value
                      const url = buildAvatarUrlWithOverride(avatarOptions, { eyebrow: o.value })
                      return (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => updateAvatarOption("eyebrow", o.value)}
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

                {/* Color de piel - círculos de color */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-foreground">Color de piel</span>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {SKIN_COLORS.map((o) => {
                      const isSelected = avatarOptions.skinColor === o.value
                      return (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => updateAvatarOption("skinColor", o.value)}
                          className={cn(
                            "h-9 w-9 shrink-0 rounded-full border-2 transition-transform active:scale-95",
                            isSelected ? "border-primary ring-2 ring-primary/50" : "border-border hover:border-primary/50"
                          )}
                          style={{ backgroundColor: `#${normalizeHex(o.value)}` }}
                          title={o.label}
                          aria-label={o.label}
                        />
                      )
                    })}
                  </div>
                </div>

                {/* Estilo de ojos - mini avatares */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-foreground">Ojos</span>
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

                {/* Estilo de cabello / Sombrero */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-foreground">Cabello / Sombrero</span>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {HAIR_STYLES.map((o) => {
                      const isSelected = avatarOptions.top === o.value
                      const url = buildAvatarUrlWithOverride(avatarOptions, { top: o.value })
                      return (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => updateAvatarOption("top", o.value)}
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

                {/* Color de cabello - círculos */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-foreground">Color de cabello</span>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {HAIR_COLORS.map((o) => {
                      const isSelected = avatarOptions.hairColor === o.value
                      const hex = normalizeHex(o.value)
                      return (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => updateAvatarOption("hairColor", o.value)}
                          className={cn(
                            "h-9 w-9 shrink-0 rounded-full border-2 transition-transform active:scale-95",
                            isSelected ? "border-primary ring-2 ring-primary/50" : "border-border hover:border-primary/50"
                          )}
                          style={{ backgroundColor: `#${hex}` }}
                          title={o.label}
                          aria-label={o.label}
                        />
                      )
                    })}
                  </div>
                </div>

                {/* Tipo de ropa */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-foreground">Ropa</span>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {CLOTHING_TYPES.map((o) => {
                      const isSelected = avatarOptions.clothes === o.value
                      const url = buildAvatarUrlWithOverride(avatarOptions, { clothes: o.value })
                      return (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => updateAvatarOption("clothes", o.value)}
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

                {/* Color de ropa - mismo formato hex que la API */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-foreground">Color de ropa</span>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {CLOTHING_COLORS.map((o) => {
                      const isSelected = avatarOptions.clothColor === o.value
                      const hex = normalizeHex(o.value)
                      return (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => updateAvatarOption("clothColor", o.value)}
                          className={cn(
                            "h-9 w-9 shrink-0 rounded-full border-2 transition-transform active:scale-95",
                            isSelected ? "border-primary ring-2 ring-primary/50" : "border-border hover:border-primary/50"
                          )}
                          style={{ backgroundColor: `#${hex}` }}
                          title={o.label}
                          aria-label={o.label}
                        />
                      )
                    })}
                  </div>
                </div>

                {/* Accesorios (gafas, etc.) */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-foreground">Accesorios</span>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {ACCESSORIES.map((o) => {
                      const isSelected = avatarOptions.accessories === o.value
                      const url = buildAvatarUrlWithOverride(avatarOptions, { accessories: o.value })
                      return (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => updateAvatarOption("accessories", o.value)}
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
              </div>

              <p className="text-[10px] text-muted-foreground">
                Toca una opción para aplicarla. Los cambios se ven al instante.
              </p>
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
          </div>
        </div>
      </div>
    </>
  )
}
