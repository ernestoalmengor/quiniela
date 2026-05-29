"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ShieldAlert, CheckCircle, Trash2, Edit2, PlusCircle, Tag, Calendar, X, Loader2 } from "lucide-react"
import {
  adminToggleBlockUser,
  adminDeleteUser,
  adminCreateTeam,
  adminUpdateTeam,
  adminDeleteTeam,
  adminCreateJornada,
  adminUpdateJornada,
  adminDeleteJornada,
  adminDeleteFriendGroup,
  adminCreatePhase,
  adminUpdatePhase,
  adminDeletePhase,
} from "@/lib/admin-actions"

interface AdminSettingsViewProps {
  adminData: any
}

const TAB_CLASSES = (active: boolean) =>
  `flex whitespace-nowrap items-center gap-1.5 px-3 py-2.5 border-b-2 font-bold text-xs sm:text-sm transition-colors ${
    active
      ? "border-primary text-primary"
      : "border-transparent text-muted-foreground hover:text-foreground"
  }`

// ---- Toast-like inline feedback ----
function useToast() {
  const [msg, setMsg] = useState<{ text: string; type: "ok" | "err" } | null>(null)
  const show = (text: string, type: "ok" | "err" = "ok") => {
    setMsg({ text, type })
    setTimeout(() => setMsg(null), 3000)
  }
  const Toast = msg ? (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-xl shadow-lg text-sm font-semibold text-white transition-all ${
        msg.type === "ok" ? "bg-emerald-600" : "bg-destructive"
      }`}
    >
      {msg.type === "ok" ? "✓ " : "✗ "}
      {msg.text}
    </div>
  ) : null
  return { show, Toast }
}

export function AdminSettingsView({ adminData }: AdminSettingsViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Helper: refresh server data without full reload
  const refresh = () => startTransition(() => { router.refresh() })

  const [activeTab, setActiveTab] = useState("teams")
  const { show: toast, Toast } = useToast()

  // ---- Loading IDs (per-row feedback) ----
  const [loadingId, setLoadingId] = useState<string | null>(null)

  // ---- Team state ----
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null)
  const [tShortName, setTShortName] = useState("")
  const [tName, setTName] = useState("")
  const [tGroupId, setTGroupId] = useState("")
  const [tLogo, setTLogo] = useState("")

  // ---- Phase state ----
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null)
  const [pName, setPName] = useState("")

  // ---- Jornada state ----
  const [editingJornadaId, setEditingJornadaId] = useState<number | null>(null)
  const [jName, setJName] = useState("")
  const [jDate, setJDate] = useState("")
  const [jPhaseId, setJPhaseId] = useState("")

  // =========================================================
  //  Generic action runner
  // =========================================================
  const run = async (
    id: string,
    action: () => Promise<any>,
    successMsg: string,
    onSuccess?: () => void
  ) => {
    setLoadingId(id)
    try {
      await action()
      toast(successMsg, "ok")
      onSuccess?.()
      refresh()
    } catch (e: any) {
      toast(e?.message || "Error inesperado", "err")
    } finally {
      setLoadingId(null)
    }
  }

  // =========================================================
  //  TEAM HANDLERS
  // =========================================================
  const handleSaveTeam = () => {
    if (!tShortName || !tName || !tGroupId) return toast("Llena los campos obligatorios", "err")
    const id = editingTeamId || "new-team"
    run(
      id,
      () =>
        editingTeamId
          ? adminUpdateTeam(editingTeamId, tShortName, tName, tGroupId, tLogo)
          : adminCreateTeam(tShortName, tName, tGroupId, tLogo),
      editingTeamId ? "Equipo actualizado" : "Equipo creado",
      () => {
        setEditingTeamId(null)
        setTShortName(""); setTName(""); setTGroupId(""); setTLogo("")
      }
    )
  }

  const handleEditTeam = (team: any) => {
    setEditingTeamId(team.id)
    setTShortName(team.shortName); setTName(team.name)
    setTGroupId(team.groupId || ""); setTLogo(team.logo || "")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDeleteTeam = (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este equipo?")) return
    run(id, () => adminDeleteTeam(id), "Equipo eliminado")
  }

  // =========================================================
  //  USER HANDLERS
  // =========================================================
  const handleToggleBlock = (userId: string, isBlocked: boolean) =>
    run(userId, () => adminToggleBlockUser(userId), isBlocked ? "Usuario desbloqueado" : "Usuario bloqueado")

  const handleDeleteUser = (userId: string) => {
    if (!confirm("¿Seguro que deseas eliminar este usuario?")) return
    run(userId, () => adminDeleteUser(userId), "Usuario eliminado")
  }

  // =========================================================
  //  GROUP HANDLERS
  // =========================================================
  const handleDeleteGroup = (groupId: string) => {
    if (!confirm("¿Seguro que deseas eliminar este grupo? Toda la actividad en él se perderá.")) return
    run(groupId, () => adminDeleteFriendGroup(groupId), "Grupo eliminado")
  }

  // =========================================================
  //  PHASE HANDLERS
  // =========================================================
  const handleSavePhase = () => {
    if (!pName.trim()) return toast("El nombre de la fase es obligatorio", "err")
    const id = editingPhaseId || "new-phase"
    run(
      id,
      () =>
        editingPhaseId
          ? adminUpdatePhase(editingPhaseId, pName)
          : adminCreatePhase(pName),
      editingPhaseId ? "Fase actualizada" : "Fase creada",
      () => { setEditingPhaseId(null); setPName("") }
    )
  }

  const handleEditPhase = (ph: any) => {
    setEditingPhaseId(ph.id); setPName(ph.name)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDeletePhase = (id: string) => {
    if (!confirm("¿Eliminar esta fase? Las jornadas vinculadas quedarán sin fase asignada.")) return
    run(id, () => adminDeletePhase(id), "Fase eliminada")
  }

  // =========================================================
  //  JORNADA HANDLERS
  // =========================================================
  const handleSaveJornada = () => {
    if (!jName || !jDate) return toast("Nombre y deadline son obligatorios", "err")
    const id = editingJornadaId?.toString() || "new-jornada"
    run(
      id,
      () =>
        editingJornadaId
          ? adminUpdateJornada(editingJornadaId, jName, jDate, jPhaseId || undefined)
          : adminCreateJornada(jName, jDate, jPhaseId || undefined),
      editingJornadaId ? "Jornada actualizada" : "Jornada creada",
      () => { setEditingJornadaId(null); setJName(""); setJDate(""); setJPhaseId("") }
    )
  }

  const handleEditJornada = (j: any) => {
    setEditingJornadaId(j.id); setJName(j.name); setJPhaseId(j.phaseId || "")
    if (j.deadline) {
      const d = new Date(j.deadline)
      const pad = (n: number) => n.toString().padStart(2, "0")
      setJDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`)
    }
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDeleteJornada = (id: number) => {
    if (!confirm("⚠️ ¿Eliminar esta jornada permanentemente?\n\nEsto también eliminará TODOS sus partidos y predicciones asociadas. Esta acción NO se puede deshacer.")) return
    run(id.toString(), () => adminDeleteJornada(id), "Jornada eliminada")
  }

  if (!adminData) return <p>No admin data available.</p>

  const phases: any[] = adminData.phases || []
  const isLoading = (id: string) => loadingId === id

  const PRESET_PHASES = [
    "Fase de grupos", "Dieciseisavos de final", "Octavos de final",
    "Cuartos de final", "Semifinal", "Final",
  ]

  return (
    <>
      {Toast}

      <div className="space-y-6">
        {/* ---- TABS ---- */}
        <div className="flex border-b border-border overflow-x-auto scrollbar-hide">
          {[
            { key: "teams",    label: "Equipos" },
            { key: "phases",   label: "Fases" },
            { key: "jornadas", label: "Jornadas" },
            { key: "users",    label: "Usuarios" },
            { key: "groups",   label: "Grupos Amigos" },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)} className={TAB_CLASSES(activeTab === key)}>
              {label}
            </button>
          ))}
        </div>

        {/* ==================== TAB: EQUIPOS ==================== */}
        {activeTab === "teams" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <h3 className="text-sm font-bold text-foreground mb-4">
                {editingTeamId ? "Editar Selección Nacional" : "Ingresar Nueva Selección Nacional"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold">Código Corto (3 Letras)</label>
                  <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                    placeholder="MEX" value={tShortName} onChange={e => setTShortName(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold">Nombre</label>
                  <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                    placeholder="México" value={tName} onChange={e => setTName(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold">Grupo</label>
                  <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                    placeholder="A" value={tGroupId} onChange={e => setTGroupId(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold">URL Bandera/Logo</label>
                  <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                    placeholder="https://..." value={tLogo} onChange={e => setTLogo(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2 mt-4 flex-wrap">
                <button
                  disabled={isLoading(editingTeamId || "new-team")}
                  onClick={handleSaveTeam}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 rounded-md font-bold text-sm transition-colors flex items-center gap-2 disabled:opacity-60">
                  {isLoading(editingTeamId || "new-team") && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingTeamId ? "Guardar Cambios" : "Registrar Selección"}
                </button>
                {editingTeamId && (
                  <button
                    onClick={() => { setEditingTeamId(null); setTShortName(""); setTName(""); setTGroupId(""); setTLogo("") }}
                    className="border border-input bg-background hover:bg-accent h-9 px-4 rounded-md font-bold text-sm transition-colors flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> Cancelar
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-foreground">
                  <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">No.</th>
                      <th className="px-4 py-3 text-left font-medium">Bandera</th>
                      <th className="px-4 py-3 text-left font-medium">Nombre</th>
                      <th className="px-4 py-3 text-left font-medium">Grupo</th>
                      <th className="px-4 py-3 text-right font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {adminData.teams.map((t: any, idx: number) => (
                      <tr key={t.id} className={`hover:bg-muted/30 transition-opacity ${isLoading(t.id) ? "opacity-50" : ""}`}>
                        <td className="px-4 py-3">{idx + 1}</td>
                        <td className="px-4 py-3">
                          {t.logo
                            ? <img src={t.logo} alt={t.name} className="w-6 h-6 object-contain rounded-full shadow-sm" crossOrigin="anonymous" />
                            : <div className="w-6 h-6 bg-muted rounded-full" />}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {t.name} <span className="text-xs text-muted-foreground ml-1">({t.shortName})</span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-primary">{t.groupId}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleEditTeam(t)} disabled={!!loadingId}
                              className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-40">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteTeam(t.id)} disabled={!!loadingId}
                              className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40">
                              {isLoading(t.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: FASES ==================== */}
        {activeTab === "phases" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                {editingPhaseId ? "Editar Fase" : "Crear Nueva Fase"}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold">Nombre de la Fase</label>
                  <input
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                    placeholder="Ej. Fase de grupos"
                    value={pName}
                    onChange={e => setPName(e.target.value)}
                    list="preset-phases"
                    onKeyDown={e => e.key === "Enter" && handleSavePhase()}
                  />
                  <datalist id="preset-phases">
                    {PRESET_PHASES.map(p => <option key={p} value={p} />)}
                  </datalist>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sugerencias: {PRESET_PHASES.join(" · ")}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-4 flex-wrap">
                <button
                  disabled={isLoading(editingPhaseId || "new-phase")}
                  onClick={handleSavePhase}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 rounded-md font-bold text-sm transition-colors flex items-center gap-2 disabled:opacity-60">
                  {isLoading(editingPhaseId || "new-phase")
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <PlusCircle className="w-4 h-4" />}
                  {editingPhaseId ? "Guardar Cambios" : "Crear Fase"}
                </button>
                {editingPhaseId && (
                  <button onClick={() => { setEditingPhaseId(null); setPName("") }}
                    className="border border-input bg-background hover:bg-accent h-9 px-4 rounded-md font-bold text-sm transition-colors flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> Cancelar
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-sm text-foreground">
                Fases Registradas <span className="text-muted-foreground font-normal">({phases.length})</span>
              </h3>
              {phases.length === 0 && (
                <div className="text-center py-10 text-muted-foreground text-sm rounded-xl border border-dashed border-border">
                  No hay fases creadas aún. Crea la primera arriba.
                </div>
              )}
              {phases.map((ph: any) => (
                <div key={ph.id}
                  className={`p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-opacity ${isLoading(ph.id) ? "opacity-50" : ""}`}>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-primary" />
                      <span className="font-bold text-sm">{ph.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground pl-5">
                      {ph.jornadas?.length || 0} jornada(s) vinculada(s)
                      {ph.jornadas?.length > 0 && (
                        <span className="ml-2">({ph.jornadas.map((j: any) => j.name).join(", ")})</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button onClick={() => handleEditPhase(ph)} disabled={!!loadingId}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-40">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeletePhase(ph.id)} disabled={!!loadingId}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40">
                      {isLoading(ph.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB: JORNADAS ==================== */}
        {activeTab === "jornadas" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                {editingJornadaId ? "Editar Jornada" : "Nueva Jornada / Fecha"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold">Nombre <span className="text-destructive">*</span></label>
                  <input
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                    placeholder="Ej. Jornada 1"
                    value={jName}
                    onChange={e => setJName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Cierre Global (Deadline) <span className="text-destructive">*</span></label>
                  <input
                    type="datetime-local"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                    value={jDate}
                    onChange={e => setJDate(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold">Fase Asociada</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                    value={jPhaseId}
                    onChange={e => setJPhaseId(e.target.value)}>
                    <option value="">— Sin fase asignada —</option>
                    {phases.map((ph: any) => (
                      <option key={ph.id} value={ph.id}>{ph.name}</option>
                    ))}
                  </select>
                  {phases.length === 0 && (
                    <p className="text-xs text-amber-500 mt-1">
                      ⚠️ No hay fases creadas. Ve a la pestaña "Fases" para crearlas primero.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-4 flex-wrap">
                <button
                  disabled={isLoading(editingJornadaId?.toString() || "new-jornada")}
                  onClick={handleSaveJornada}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 rounded-md font-bold text-sm transition-colors flex items-center gap-2 disabled:opacity-60">
                  {isLoading(editingJornadaId?.toString() || "new-jornada")
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <PlusCircle className="w-4 h-4" />}
                  {editingJornadaId ? "Guardar Cambios" : "Crear Jornada"}
                </button>
                {editingJornadaId && (
                  <button
                    onClick={() => { setEditingJornadaId(null); setJName(""); setJDate(""); setJPhaseId("") }}
                    className="border border-input bg-background hover:bg-accent h-9 px-4 rounded-md font-bold text-sm transition-colors flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> Cancelar
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-sm text-foreground">
                Jornadas Existentes <span className="text-muted-foreground font-normal">({adminData.jornadas?.length || 0})</span>
              </h3>
              {(!adminData.jornadas || adminData.jornadas.length === 0) && (
                <div className="text-center py-10 text-muted-foreground text-sm rounded-xl border border-dashed border-border">
                  No hay jornadas creadas aún.
                </div>
              )}
              {adminData.jornadas?.map((j: any) => (
                <div key={j.id}
                  className={`p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-opacity ${isLoading(j.id.toString()) ? "opacity-50" : ""}`}>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">{j.name}</span>
                      {j.phase
                        ? <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold">{j.phase.name}</span>
                        : <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold">Sin fase</span>}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Deadline: {j.deadline ? new Date(j.deadline).toLocaleString("es-GT") : "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button onClick={() => handleEditJornada(j)} disabled={!!loadingId}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-40">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteJornada(j.id)} disabled={!!loadingId}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40">
                      {isLoading(j.id.toString()) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB: USUARIOS ==================== */}
        {activeTab === "users" && (
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-foreground">
                <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
                  <tr>
                    <th className="px-4 py-3">Usuario</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Rol</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {adminData.users.map((u: any) => (
                    <tr key={u.id} className={`hover:bg-muted/30 transition-opacity ${isLoading(u.id) ? "opacity-50" : ""}`}>
                      <td className="px-4 py-3 font-semibold">
                        {u.firstName ? `${u.firstName} ${u.lastName || ""}`.trim() : (u.username || "Usuario")}
                        <div className="text-xs font-normal text-muted-foreground">@{u.username}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.role === "ADMIN" ? "bg-primary/20 text-primary" : "bg-secondary text-secondary-foreground"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.isBlocked
                          ? <span className="inline-flex items-center gap-1 text-xs text-destructive font-bold"><ShieldAlert className="w-3.5 h-3.5" /> Bloqueado</span>
                          : <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-bold"><CheckCircle className="w-3.5 h-3.5" /> Activo</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {u.role !== "ADMIN" && (
                            <>
                              <button onClick={() => handleToggleBlock(u.id, u.isBlocked)} disabled={!!loadingId}
                                className={`h-8 px-3 rounded-md font-bold text-xs transition-colors flex items-center gap-1 disabled:opacity-40 ${u.isBlocked ? "border border-input bg-background hover:bg-accent" : "bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground"}`}>
                                {isLoading(u.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                {u.isBlocked ? "Desbloquear" : "Bloquear"}
                              </button>
                              <button onClick={() => handleDeleteUser(u.id)} disabled={!!loadingId}
                                className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40">
                                {isLoading(u.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== TAB: GRUPOS AMIGOS ==================== */}
        {activeTab === "groups" && (
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-foreground">
                <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
                  <tr>
                    <th className="px-4 py-3">Nombre del Grupo</th>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Administrador</th>
                    <th className="px-4 py-3 text-center">Miembros</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {adminData.groups?.map((g: any) => (
                    <tr key={g.id} className={`hover:bg-muted/30 transition-opacity ${isLoading(g.id) ? "opacity-50" : ""}`}>
                      <td className="px-4 py-3 font-semibold">{g.name}</td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-primary">{g.inviteCode}</td>
                      <td className="px-4 py-3 text-xs">{g.admin?.username || g.admin?.email || "Desconocido"}</td>
                      <td className="px-4 py-3 text-center font-bold">{g._count?.members || 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleDeleteGroup(g.id)}
                            disabled={!!loadingId || g.name === "Clasificación Global"}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent">
                            {isLoading(g.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
