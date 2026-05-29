"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Target, CheckCircle2, TrendingUp, Minus, Info, Settings } from "lucide-react"
import type { Rules } from "@/lib/types"
import { adminUpdateConfig } from "@/lib/admin-actions"

interface RulesSectionProps {
  rules: Rules
  isAdmin?: boolean
}

export function RulesSection({ rules, isAdmin }: RulesSectionProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)
  const [exactScore, setExactScore] = useState(rules.exactScore)
  const [correctResult, setCorrectResult] = useState(rules.correctResult)
  const [correctGoalDifference, setCorrectGoalDifference] = useState(rules.correctGoalDifference)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      await adminUpdateConfig(Number(exactScore), Number(correctResult), Number(correctGoalDifference))
      setIsEditing(false)
      startTransition(() => router.refresh())
    } catch(e) {
      alert("Error al actualizar reglas")
    }
    setIsSubmitting(false)
  }

  const ruleItems = [
    {
      icon: Target,
      title: "Resultado Exacto",
      description: "Aciertas el marcador exacto del partido",
      points: rules.exactScore,
      example: "Predices 2-1 y el resultado es 2-1",
      color: "text-primary bg-primary/15",
    },
    {
      icon: CheckCircle2,
      title: "Ganador Correcto",
      description: "Aciertas qué equipo gana el partido, pero no el marcador exacto",
      points: rules.correctResult,
      example: "Predices 3-1 y el resultado es 2-0 (ganador acertado)",
      color: "text-warning bg-warning/15",
    },
    {
      icon: TrendingUp,
      title: "Empate Correcto",
      description: "Aciertas que el partido termina en empate, pero no el marcador exacto",
      points: rules.correctGoalDifference,
      example: "Predices 1-1 y el resultado es 2-2 (empate acertado)",
      color: "text-muted-foreground bg-secondary",
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2.5 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
            <Info className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Cómo Funciona</h3>
            <p className="text-xs text-muted-foreground">Sistema de puntuación de la quiniela</p>
          </div>
        </div>
        {isAdmin && (
          <div className="mb-6 flex justify-end">
             <button onClick={() => setIsEditing(!isEditing)} className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-bold text-sm px-6 py-2.5 rounded-lg shadow-sm flex items-center gap-2">
               {isEditing ? "Cancelar Edición" : "Editar Puntuaciones del Sistema"}
             </button>
          </div>
        )}
        {isAdmin && isEditing && (
          <div className="mb-6 p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col gap-3">
             <h4 className="text-sm font-bold text-primary">Modificar Puntuaciones</h4>
             <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                   <label className="text-xs font-semibold">Exacto</label>
                   <input type="number" className="h-8 rounded border border-input px-2 text-sm" value={exactScore} onChange={e => setExactScore(Number(e.target.value))} />
                </div>
                <div className="flex flex-col gap-1">
                   <label className="text-xs font-semibold">Ganador</label>
                   <input type="number" className="h-8 rounded border border-input px-2 text-sm" value={correctResult} onChange={e => setCorrectResult(Number(e.target.value))} />
                </div>
                <div className="flex flex-col gap-1">
                   <label className="text-xs font-semibold">Empate</label>
                   <input type="number" className="h-8 rounded border border-input px-2 text-sm" value={correctGoalDifference} onChange={e => setCorrectGoalDifference(Number(e.target.value))} />
                </div>
             </div>
             <button onClick={handleSave} disabled={isSubmitting} className="mt-2 h-8 w-full rounded bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
               Guardar Cambios
             </button>
          </div>
        )}


        <div className="flex flex-col gap-3">
          {ruleItems.map((rule) => {
            const Icon = rule.icon
            return (
              <div
                key={rule.title}
                className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-3"
              >
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${rule.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">{rule.title}</span>
                    <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-sm font-black text-primary">
                      +{rule.points}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">{rule.description}</p>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Minus className="h-3 w-3" />
                    <span className="italic">{rule.example}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Nota Importante</h4>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground font-medium">
          Los puntos son excluyentes y no se acumulan entre sí por partido. Si aciertas el marcador exacto, obtienes {rules.exactScore} puntos. Si solo aciertas al ganador obtienes {rules.correctResult} puntos, y si aciertas el empate obtienes {rules.correctGoalDifference} puntos.
        </p>
      </div>
    </div>
  )
}
