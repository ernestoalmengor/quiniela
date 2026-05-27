"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { adminCreateJornada, adminCreateMatch, adminScoreMatch } from "@/lib/admin-actions"

export default function AdminDashboardClient({ jornadas, teams, matches }: { jornadas: any[], teams: any[], matches: any[] }) {
  const router = useRouter()
  
  // Estado para crear Jornada
  const [jName, setJName] = useState("")
  const [jDate, setJDate] = useState("")
  
  // Estado para crear Partido
  const [mJornada, setMJornada] = useState("")
  const [mPhase, setMPhase] = useState("Grupos")
  const [mHome, setMHome] = useState("")
  const [mAway, setMAway] = useState("")
  const [mDate, setMDate] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Estado para marcadores
  const [scores, setScores] = useState<Record<string, { h: string, a: string }>>({})

  const handleCreateJornada = async () => {
    if(!jName || !jDate) return alert("Llena todos los campos")
    setIsSubmitting(true)
    try {
      await adminCreateJornada(jName, jDate)
      router.refresh()
      setJName("")
      setJDate("")
    } catch(e) {
      alert("Error creando jornada")
    }
    setIsSubmitting(false)
  }

  const handleCreateMatch = async () => {
    if(!mJornada || !mHome || !mAway || !mDate) return alert("Llena todos los campos oblígatorios")
    setIsSubmitting(true)
    try {
      await adminCreateMatch(Number(mJornada), mPhase, mHome, mAway, mDate)
      router.refresh()
    } catch(e) {
      alert("Error creando partido")
    }
    setIsSubmitting(false)
  }

  const handleSaveScore = async (matchId: string) => {
    const s = scores[matchId]
    if(!s || s.h === "" || s.a === "") return alert("Ingresa ambos marcadores")
    
    if(!confirm("¿Estás seguro? Marcar como TERMINADO repartirá los puntos matemáticos irrevocablemente a los cientos de usuarios que predijeron esto.")) return

    setIsSubmitting(true)
    try {
      await adminScoreMatch(matchId, Number(s.h), Number(s.a))
      router.refresh()
      alert("¡Partido finalizado y puntos repartidos exitosamente!")
    } catch(e) {
      alert("Error guardando el marcador")
    }
    setIsSubmitting(false)
  }

  return (
    <Tabs defaultValue="matches" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-8">
        <TabsTrigger value="matches">Lista de Partidos</TabsTrigger>
        <TabsTrigger value="create_match">Programar Partido</TabsTrigger>
        <TabsTrigger value="jornadas">Fechas / Jornadas</TabsTrigger>
      </TabsList>

      {/* TABS: LISTA DE PARTIDOS Y MARCADORES EN VIVO */}
      <TabsContent value="matches" className="space-y-4">
        {matches.map(m => (
          <Card key={m.id} className={m.status === "finished" ? "opacity-60" : "border-l-4 border-l-primary"}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-bold">{m.jornada.name} • {m.phase}</span>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex flex-col items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.homeTeam.logo} className="w-8 h-8 rounded-full shadow-sm" alt="Home" />
                    <span className="font-bold mt-1 text-sm">{m.homeTeam.shortName}</span>
                  </div>
                  <span className="text-lg font-black text-muted-foreground">VS</span>
                  <div className="flex flex-col items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.awayTeam.logo} className="w-8 h-8 rounded-full shadow-sm" alt="Away" />
                    <span className="font-bold mt-1 text-sm">{m.awayTeam.shortName}</span>
                  </div>
                </div>
              </div>

              {m.status === "finished" ? (
                <div className="text-right">
                  <Badge className="mb-2" variant="outline">TERMINADO</Badge>
                  <div className="text-2xl font-black">
                    {m.homeScore} - {m.awayScore}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2 items-center">
                    <Input 
                      placeholder="0" type="number" className="w-16 text-center font-bold"
                      value={scores[m.id]?.h ?? ""}
                      onChange={e => setScores({ ...scores, [m.id]: { ...scores[m.id], h: e.target.value } })}
                    />
                    <span className="font-bold">-</span>
                    <Input 
                      placeholder="0" type="number" className="w-16 text-center font-bold"
                      value={scores[m.id]?.a ?? ""}
                      onChange={e => setScores({ ...scores, [m.id]: { ...scores[m.id], a: e.target.value } })}
                    />
                  </div>
                  <Button 
                    disabled={isSubmitting} 
                    onClick={() => handleSaveScore(m.id)} 
                    variant="destructive" size="sm" className="w-full font-bold"
                  >
                    Finalizar y Repartir Puntos
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {matches.length === 0 && <p className="text-muted-foreground text-center py-10">No hay partidos creados.</p>}
      </TabsContent>

      {/* TABS: PROGRAMAR PARTIDO */}
      <TabsContent value="create_match">
        <Card>
          <CardHeader>
            <CardTitle>Generar Nuevo Partido</CardTitle>
            <CardDescription>Escoge dos de las naciones participantes y asígnales una jornada.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jornada Origen</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={mJornada} onChange={e => setMJornada(e.target.value)}>
                  <option value="">Selecciona Jornada...</option>
                  {jornadas.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Fase Deportiva</Label>
                <Input value={mPhase} onChange={e => setMPhase(e.target.value)} placeholder="Ej. Grupos, Octavos..." />
              </div>
              <div className="space-y-2">
                <Label>Equipo Local</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={mHome} onChange={e => setMHome(e.target.value)}>
                  <option value="">Selecciona País...</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Equipo Visitante</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={mAway} onChange={e => setMAway(e.target.value)}>
                  <option value="">Selecciona País...</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Fecha y Hora Oficial de Inicio</Label>
                <Input type="datetime-local" value={mDate} onChange={e => setMDate(e.target.value)} />
              </div>
            </div>
            <Button className="w-full mt-4" disabled={isSubmitting} onClick={handleCreateMatch}>Instanciar Partido Reál</Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* TABS: JORNADAS */}
      <TabsContent value="jornadas">
         <Card>
          <CardHeader>
            <CardTitle>Gestor de Jornadas Mundiales</CardTitle>
            <CardDescription>Crea contenedores de tiempo para agrupar partidos (Ej. Jornada 1).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre de la Jornada</Label>
              <Input placeholder="Ej. Semifinales" value={jName} onChange={e=>setJName(e.target.value)}/>
            </div>
            <div className="space-y-2">
              <Label>Cierre Global de Apuestas (Deadline)</Label>
              <Input type="datetime-local" value={jDate} onChange={e=>setJDate(e.target.value)}/>
            </div>
            <Button disabled={isSubmitting} onClick={handleCreateJornada}>Crear Jornada</Button>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 mt-8">
          <h3 className="text-xl font-bold">Jornadas Históricas</h3>
          {jornadas.map(j => (
            <div key={j.id} className="p-4 rounded-lg border flex justify-between items-center">
              <span className="font-bold">{j.name}</span>
              <span className="text-sm text-muted-foreground">{new Date(j.deadline).toLocaleString()}</span>
            </div>
          ))}
          {jornadas.length === 0 && <p className="text-muted-foreground">No existen jornadas.</p>}
        </div>
      </TabsContent>
    </Tabs>
  )
}

function Badge({ children, className, variant }: any) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>{children}</span>
}
