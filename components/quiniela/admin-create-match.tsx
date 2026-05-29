"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, X } from "lucide-react"
import { adminCreateMatch, adminUpdateMatch } from "@/lib/admin-actions"

interface AdminCreateMatchProps {
  jornadas: any[]
  teams: any[]
  phases?: any[]
  matchToEdit?: any
  onCancelEdit?: () => void
}

export function AdminCreateMatch({ jornadas, teams, phases = [], matchToEdit, onCancelEdit }: AdminCreateMatchProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mJornada, setMJornada] = useState("")
  const [mPhase, setMPhase] = useState("Grupos")
  const [mHome, setMHome] = useState("")
  const [mAway, setMAway] = useState("")
  const [mDate, setMDate] = useState("")

  useEffect(() => {
    if (matchToEdit) {
      setMJornada(matchToEdit.jornadaId?.toString() || "")
      setMPhase(matchToEdit.phase || "Grupos")
      setMHome(matchToEdit.homeTeamId || "")
      setMAway(matchToEdit.awayTeamId || "")
      if (matchToEdit.date) {
        const d = new Date(matchToEdit.date)
        const pad = (n: number) => n.toString().padStart(2, '0')
        setMDate(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`)
      }
    } else {
      setMJornada(""); setMPhase("Grupos"); setMHome(""); setMAway(""); setMDate("")
    }
  }, [matchToEdit])

  const handleSaveMatch = async () => {
    if (!mJornada || !mDate) return alert("Llena los campos obligatorios (Jornada y Fecha)")
    setIsSubmitting(true)
    try {
      if (matchToEdit) {
        await adminUpdateMatch(matchToEdit.id, mPhase, mHome || null, mAway || null, mDate)
      } else {
        await adminCreateMatch(Number(mJornada), mPhase, mHome || null, mAway || null, mDate)
      }
      setMJornada(""); setMPhase("Grupos"); setMHome(""); setMAway(""); setMDate("")
      if (onCancelEdit) onCancelEdit()
      // Refresh server data without navigating away
      startTransition(() => { router.refresh() })
    } catch(e) {
      alert("Error al guardar partido")
    }
    setIsSubmitting(false)
  }

  const CLASSIC_PHASES = ["Grupos", "Dieciseisavos", "Octavos", "Cuartos", "Semifinal", "Final"]
  const phaseOptions = phases.length > 0 ? phases.map((p: any) => p.name) : CLASSIC_PHASES
  const busy = isSubmitting || isPending

  return (
    <div className="mt-6 mb-6 p-4 rounded-xl border border-primary/20 bg-primary/5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-primary">{matchToEdit ? "Editar Partido" : "Programar Nuevo Partido"}</h3>
        {matchToEdit && (
          <button onClick={onCancelEdit} className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1">
            <X className="w-3.5 h-3.5" /> Cancelar Edición
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold">Jornada Origen <span className="text-destructive">*</span></label>
          <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={mJornada} onChange={e => setMJornada(e.target.value)}>
            <option value="">Selecciona Jornada...</option>
            {jornadas.map(j => (
              <option key={j.id} value={j.id}>
                {j.name}{j.phase ? ` — ${j.phase.name}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold">Fase del Partido</label>
          <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={mPhase} onChange={e => setMPhase(e.target.value)}>
            {phaseOptions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold">Equipo Local</label>
          <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={mHome} onChange={e => setMHome(e.target.value)}>
            <option value="">TBD (Por Definir)...</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name} ({t.shortName})</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold">Equipo Visitante</label>
          <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={mAway} onChange={e => setMAway(e.target.value)}>
            <option value="">TBD (Por Definir)...</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name} ({t.shortName})</option>)}
          </select>
        </div>
        <div className="space-y-1.5 col-span-1 sm:col-span-2">
          <label className="text-xs font-semibold">Fecha y Hora de Inicio <span className="text-destructive">*</span></label>
          <input type="datetime-local" className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={mDate} onChange={e => setMDate(e.target.value)} />
        </div>
      </div>
      <button
        disabled={busy}
        onClick={handleSaveMatch}
        className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 rounded-md font-bold text-sm w-full flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity">
        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
        {matchToEdit ? "Guardar Cambios" : "Programar Partido"}
      </button>
    </div>
  )
}
