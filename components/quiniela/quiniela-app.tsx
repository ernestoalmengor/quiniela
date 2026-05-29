"use client"

import { useState, useMemo, useCallback, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ThemeProvider } from "./theme-provider"
import { cn } from "@/lib/utils"
import { Header } from "./header"
import { BottomNav } from "./bottom-nav"
import { JornadaSelector } from "./jornada-selector"
import { MatchCard } from "./match-card"
import { Leaderboard } from "./leaderboard"
import { RulesSection } from "./rules-section"
import { ParticipantPredictions } from "./participant-predictions"
import { ProfilePanel } from "./profile-panel"
import { GroupsView } from "./groups-view"
import { BracketView } from "./bracket-view"
import { AdminSettingsView } from "./admin-settings-view"
import { AdminCreateMatch } from "./admin-create-match"
import { updateAvatarApi, savePredictionApi, createFriendGroupAction, joinFriendGroupAction } from "@/lib/api"
import { adminToggleJornadaStatus } from "@/lib/admin-actions"
import type { QuinielaData, Prediction } from "@/lib/types"
import { Plus, Users, Globe, Copy, ShieldAlert, Check } from "lucide-react"

interface QuinielaAppProps {
  data: QuinielaData
}

function QuinielaContent({ data }: QuinielaAppProps) {
  const [activeTab, setActiveTab] = useState("matches")
  const [profileOpen, setProfileOpen] = useState(false)
  const [userAvatar, setUserAvatar] = useState(data.currentUser.avatar)
  const [selectedJornada, setSelectedJornada] = useState(() => {
    const live = data.jornadas.find((j) => j.status === "live")
    return live?.id ?? data.jornadas[0]?.id ?? 1
  })
  const [userPredictions, setUserPredictions] = useState<Record<string, Prediction>>({})

  // Private Group States
  const [selectedGroupId, setSelectedGroupId] = useState<string>(() => {
    const realGroups = data.userGroups?.filter(g => g.name !== "Clasificación Global" && g.inviteCode !== "GLOBAL-2026") || []
    return realGroups.length > 0 ? realGroups[0].id : ""
  })
  const [groupTab, setGroupTab] = useState<"mundial" | "amigos">("amigos")
  const [newGroupName, setNewGroupName] = useState("")
  const [joinInviteCode, setJoinInviteCode] = useState("")
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false)
  const [groupError, setGroupError] = useState("")
  const [groupSuccess, setGroupSuccess] = useState("")
  
  // Admin Editing state
  const [editingMatch, setEditingMatch] = useState<any>(null)

  const router = useRouter()
  const [, startTransition] = useTransition()
  const refresh = () => startTransition(() => router.refresh())

  const currentJornada = useMemo(
    () => data.jornadas.find((j) => j.id === selectedJornada),
    [data.jornadas, selectedJornada]
  )

  const liveMatches = useMemo(
    () => data.jornadas.reduce((acc, j) => acc + j.matches.filter((m) => m.status === "live").length, 0),
    [data.jornadas]
  )

  const userParticipant = useMemo(
    () => data.participants.find((p) => p.id === data.currentUser.participantId),
    [data.participants, data.currentUser.participantId]
  )

  const handlePredictionChange = useCallback((matchId: string, prediction: Prediction) => {
    setUserPredictions((prev) => ({
      ...prev,
      [matchId]: prediction,
    }))
    savePredictionApi(data.currentUser.participantId, matchId, prediction.home, prediction.away)
  }, [data.currentUser.participantId])

  const currentUserWithAvatar = useMemo(
    () => ({ ...data.currentUser, avatar: userAvatar }),
    [data.currentUser, userAvatar]
  )

  // Actions
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return
    setIsSubmittingGroup(true)
    setGroupError("")
    setGroupSuccess("")
    try {
      const res = await createFriendGroupAction(data.currentUser.participantId, newGroupName)
      setGroupSuccess(`¡Grupo "${res.group.name}" creado con éxito! Código: ${res.group.inviteCode}`)
      setNewGroupName("")
      refresh()
    } catch (err: any) {
      setGroupError(err.message || "Error al crear grupo")
    } finally {
      setIsSubmittingGroup(false)
    }
  }

  const handleJoinGroup = async () => {
    if (!joinInviteCode.trim()) return
    setIsSubmittingGroup(true)
    setGroupError("")
    setGroupSuccess("")
    try {
      await joinFriendGroupAction(data.currentUser.participantId, joinInviteCode)
      setGroupSuccess("¡Te has unido al grupo correctamente!")
      setJoinInviteCode("")
      refresh()
    } catch (err: any) {
      setGroupError(err.message || "Error al unirse al grupo")
    } finally {
      setIsSubmittingGroup(false)
    }
  }

  const handleToggleJornadaVisibility = async (id: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "hidden" ? "upcoming" : "hidden"
      await adminToggleJornadaStatus(id, newStatus)
      refresh()
    } catch (err: any) {
      alert(err.message || "Error al cambiar estado")
    }
  }

  // Active group members filtering for Leaderboard
  const activeGroup = data.userGroups?.find(g => g.id === selectedGroupId)
  const activeGroupMembers = useMemo(() => {
    if (selectedGroupId === "global") {
      const glob = data.userGroups?.find(g => g.name === "Clasificación Global" || g.inviteCode === "GLOBAL-2026")
      if (glob) {
        return glob.members.map(m => ({
          id: m.id,
          name: m.name,
          avatar: m.avatar,
          totalPoints: m.points,
          predictions: m.predictions
        }))
      }
      return data.participants
    }
    if (activeGroup) {
      return activeGroup.members.map(m => ({
        id: m.id,
        name: m.name,
        avatar: m.avatar,
        totalPoints: m.points,
        predictions: m.predictions
      }))
    }
    // Si no ha seleccionado grupo válido o no tiene grupos, solo se ve a sí mismo
    return data.participants.filter(p => p.id === data.currentUser.participantId)
  }, [selectedGroupId, activeGroup, data.userGroups, data.participants, data.currentUser.participantId])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header
        user={currentUserWithAvatar}
        tournamentName={data.tournament.name}
        userPoints={userParticipant?.totalPoints ?? 0}
        onAvatarClick={() => setProfileOpen(true)}
      />
      <ProfilePanel
        open={profileOpen}
        onClose={() => {
          setProfileOpen(false)
          if (userAvatar !== data.currentUser.avatar) {
            updateAvatarApi(data.currentUser.participantId, userAvatar)
          }
        }}
        user={currentUserWithAvatar}
        participant={userParticipant}
        jornadas={data.jornadas}
        onAvatarChange={setUserAvatar}
      />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-4 pb-32">
        {activeTab === "matches" && (
          <>
            <JornadaSelector
              jornadas={data.jornadas}
              selectedId={selectedJornada}
              onSelect={setSelectedJornada}
            />
            
            {data.currentUser.isAdmin && currentJornada && (
              <div className="flex justify-end -mt-2 mb-2">
                <button
                  onClick={() => handleToggleJornadaVisibility(currentJornada.id, currentJornada.status)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-md transition-colors border",
                    currentJornada.status === "hidden"
                      ? "bg-secondary text-muted-foreground border-border hover:bg-secondary/80"
                      : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20"
                  )}
                >
                  {currentJornada.status === "hidden" ? "👁️ Jornada Oculta (Clic para Mostrar)" : "✅ Jornada Visible (Clic para Ocultar)"}
                </button>
              </div>
            )}
            
            {data.currentUser.isAdmin && data.adminData && !editingMatch && (
              <AdminCreateMatch 
                jornadas={data.adminData.jornadas} 
                teams={data.adminData.teams}
                phases={data.adminData.phases || []}
                matchToEdit={null}
              />
            )}

            {editingMatch && data.currentUser.isAdmin && data.adminData && (
              <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-card border border-border shadow-lg rounded-xl p-2 w-full max-w-lg overflow-y-auto max-h-[90vh]">
                  <AdminCreateMatch 
                    jornadas={data.adminData.jornadas} 
                    teams={data.adminData.teams}
                    phases={data.adminData.phases || []}
                    matchToEdit={editingMatch}
                    onCancelEdit={() => setEditingMatch(null)}
                  />
                </div>
              </div>
            )}

            {currentJornada && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-foreground">
                    {currentJornada.matches.length} Partidos
                  </h2>
                  {currentJornada.status === "upcoming" && (
                    <span className="text-xs text-muted-foreground">
                      Ingresa tus predicciones abajo
                    </span>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {currentJornada.matches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      prediction={userPredictions[match.id]}
                      onPredictionChange={handlePredictionChange}
                      showPrediction={!data.currentUser.isAdmin}
                      isAdmin={data.currentUser.isAdmin}
                      onEdit={() => {
                        const rawMatch = data.adminData?.matches.find((rm: any) => rm.id === match.id)
                        setEditingMatch(rawMatch || match)
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "groups" && (
          <GroupsView groups={data.groups ?? []} isAdmin={data.currentUser.isAdmin} />
        )}

        {activeTab === "friends" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Crear Grupo */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Crear Nuevo Grupo</h3>
                  <p className="text-xs text-muted-foreground mb-3">Crea tu propio grupo privado e invita a tus amigos con el código único.</p>
                  <input 
                    placeholder="Nombre de tu grupo (ej. Los Chamos)"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                  />
                </div>
                <button 
                  disabled={isSubmittingGroup || !newGroupName.trim()}
                  onClick={handleCreateGroup}
                  className="mt-4 w-full bg-primary hover:bg-primary/95 text-primary-foreground h-10 rounded-md font-bold text-sm transition-transform active:scale-95 disabled:opacity-50"
                >
                  Crear Grupo
                </button>
              </div>

              {/* Unirse a Grupo */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Unirse a un Grupo</h3>
                  <p className="text-xs text-muted-foreground mb-3">Ingresa el código de invitación que te compartió tu amigo para competir.</p>
                  <input 
                    placeholder="Código de Invitación (ej. AB12CD)"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm uppercase"
                    value={joinInviteCode}
                    onChange={e => setJoinInviteCode(e.target.value)}
                  />
                </div>
                <button 
                  disabled={isSubmittingGroup || !joinInviteCode.trim()}
                  onClick={handleJoinGroup}
                  className="mt-4 w-full bg-secondary hover:bg-secondary/90 text-foreground h-10 rounded-md font-bold text-sm transition-transform active:scale-95 disabled:opacity-50"
                >
                  Unirse a Grupo
                </button>
              </div>
            </div>

            {/* Notifications feedback */}
            {groupError && (
              <div className="flex items-center gap-2 text-xs font-bold text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                <ShieldAlert className="w-4 h-4" /> {groupError}
              </div>
            )}
            {groupSuccess && (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                <Check className="w-4 h-4" /> {groupSuccess}
              </div>
            )}

            {/* List of Joined/Admin groups */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-foreground">Mis Grupos y Quinielas</h3>
              {data.userGroups && data.userGroups.filter(g => g.name !== "Clasificación Global").length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.userGroups
                    .filter(g => g.name !== "Clasificación Global" && g.inviteCode !== "GLOBAL-2026")
                    .map((g) => (
                      <div key={g.id} className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between">
                            <h4 className="font-bold text-sm text-foreground">{g.name}</h4>
                            <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-full font-bold text-muted-foreground">
                              {g.members.length} miembros
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
                            Código:{" "}
                            <span className="font-mono font-bold text-foreground bg-secondary px-1.5 py-0.5 rounded">
                              {g.inviteCode}
                            </span>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(g.inviteCode)
                                alert("Código copiado al portapapeles")
                              }}
                              className="text-primary hover:underline font-bold"
                            >
                              Copiar
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedGroupId(g.id)
                            setActiveTab("leaderboard")
                          }}
                          className="mt-4 w-full border border-border hover:bg-secondary/50 text-foreground h-9 rounded-md font-bold text-xs transition-colors"
                        >
                          Ver Tabla de Posiciones
                        </button>
                      </div>
                    ))
                  }
                </div>
              ) : (
                <p className="text-center text-xs text-muted-foreground py-8 bg-card border border-border rounded-xl">
                  Aún no te has unido a ningún grupo privado de amigos.
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === "bracket" && (
          <BracketView bracket={data.bracket ?? []} isAdmin={data.currentUser.isAdmin} adminTeams={data.adminData?.teams} />
        )}

        {activeTab === "leaderboard" && (
          <Leaderboard 
            participants={activeGroupMembers} 
            userGroups={data.userGroups || []} 
            selectedGroupId={selectedGroupId} 
            onGroupChange={setSelectedGroupId} 
          />
        )}

        {activeTab === "rules" && (
          <RulesSection rules={data.rules} isAdmin={data.currentUser.isAdmin} />
        )}

        {activeTab === "admin" && data.currentUser.isAdmin && data.adminData && (
          <AdminSettingsView adminData={data.adminData} />
        )}
      </main>

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalParticipants={data.participants.length}
        liveMatches={liveMatches}
        currentJornada={currentJornada?.name ?? ""}
        isAdmin={data.currentUser.isAdmin}
      />
    </div>
  )
}

export function QuinielaApp({ data }: QuinielaAppProps) {
  return (
    <ThemeProvider>
      <QuinielaContent data={data} />
    </ThemeProvider>
  )
}
