"use client"

import { useState, useMemo, useCallback } from "react"
import { ThemeProvider } from "./theme-provider"
import { Header } from "./header"
import { BottomNav } from "./bottom-nav"
import { JornadaSelector } from "./jornada-selector"
import { MatchCard } from "./match-card"
import { Leaderboard } from "./leaderboard"
import { RulesSection } from "./rules-section"
import { ParticipantPredictions } from "./participant-predictions"
import { ProfilePanel } from "./profile-panel"
import type { QuinielaData, Prediction } from "@/lib/types"

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
  }, [])

  const currentUserWithAvatar = useMemo(
    () => ({ ...data.currentUser, avatar: userAvatar }),
    [data.currentUser, userAvatar]
  )

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
        onClose={() => setProfileOpen(false)}
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
                      showPrediction
                    />
                  ))}
                </div>
              </div>
            )}

            {currentJornada && (
              <ParticipantPredictions
                participants={data.participants}
                matches={currentJornada.matches}
              />
            )}
          </>
        )}

        {activeTab === "leaderboard" && (
          <Leaderboard participants={data.participants} />
        )}

        {activeTab === "rules" && (
          <RulesSection rules={data.rules} />
        )}
      </main>

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalParticipants={data.participants.length}
        liveMatches={liveMatches}
        currentJornada={currentJornada?.name ?? ""}
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
