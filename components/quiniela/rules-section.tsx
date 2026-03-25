"use client"

import { Target, CheckCircle2, TrendingUp, Minus, Info } from "lucide-react"
import type { Rules } from "@/lib/types"

interface RulesSectionProps {
  rules: Rules
}

export function RulesSection({ rules }: RulesSectionProps) {
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
      title: "Resultado Correcto (1X2)",
      description: "Aciertas quien gana o si es empate",
      points: rules.correctResult,
      example: "Predices 3-1 y el resultado es 2-0 (gana local)",
      color: "text-warning bg-warning/15",
    },
    {
      icon: TrendingUp,
      title: "Diferencia de Goles",
      description: "Aciertas la diferencia de goles",
      points: rules.correctGoalDifference,
      example: "Predices 2-0 y el resultado es 3-1 (diferencia de 2)",
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
            <h3 className="text-sm font-bold text-foreground">Como Funciona</h3>
            <p className="text-xs text-muted-foreground">Sistema de puntuacion de la quiniela</p>
          </div>
        </div>

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
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          Los puntos se otorgan de forma exclusiva: si aciertas el resultado exacto obtienes 5 puntos
          (no se suman los puntos de resultado correcto). La diferencia de goles es un punto extra que
          se suma al resultado correcto.
        </p>
      </div>
    </div>
  )
}
