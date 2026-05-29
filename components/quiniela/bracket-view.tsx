import { KnockoutMatch } from "@/lib/types"
import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { adminUpdateKnockoutTeams, adminInitKnockoutStage } from "@/lib/admin-actions"

interface BracketViewProps {
  bracket: KnockoutMatch[]
  isAdmin?: boolean
  adminTeams?: any[]
}

export function BracketView({ bracket, isAdmin, adminTeams = [] }: BracketViewProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [bracketSelections, setBracketSelections] = useState<Record<string, { home: string, away: string }>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const handleSaveBracketTeams = async (matchId: string) => {
    const select = bracketSelections[matchId]
    const homeId = select?.home === "TBD" ? null : select?.home
    const awayId = select?.away === "TBD" ? null : select?.away
    setIsSubmitting(true)
    try {
      await adminUpdateKnockoutTeams(matchId, homeId, awayId)
      startTransition(() => router.refresh())
    } catch(e) {
      alert("Error al actualizar llaves")
    }
    setIsSubmitting(false)
  }

  const handleInitKnockouts = async () => {
    setIsSubmitting(true)
    try {
      await adminInitKnockoutStage()
      startTransition(() => router.refresh())
    } catch(e) {
      alert("Error inicializando llaves")
    }
    setIsSubmitting(false)
  }

  if (!bracket || bracket.length === 0) {
    return (
      <div className="p-8 text-center bg-card rounded-xl border border-border shadow-sm flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Aún no hay llaves de fase final definidas.</p>
        {isAdmin && (
          <button disabled={isSubmitting} onClick={handleInitKnockouts} className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
            Generar Árbol desde Octavos de Final
          </button>
        )}
      </div>
    )
  }

  // Clasificar partidos
  const octavos = bracket.filter(m => m.phase.toLowerCase().includes("octavo"))
  const cuartos = bracket.filter(m => m.phase.toLowerCase().includes("cuarto"))
  const semis = bracket.filter(m => m.phase.toLowerCase().includes("semi"))
  const final = bracket.filter(m => m.phase.toLowerCase().includes("final") && !m.phase.toLowerCase().includes("octavo") && !m.phase.toLowerCase().includes("cuarto") && !m.phase.toLowerCase().includes("semi"))
  const tercer = bracket.filter(m => m.phase.toLowerCase().includes("tercer") || m.phase.toLowerCase().includes("third"))

  // Función para renderizar un partido individual
  const renderMatch = (match: KnockoutMatch | undefined, homeLabel = "TBD", awayLabel = "TBD", venue = "") => {
    if (!match) return <div className="w-36 sm:w-48 h-[88px] opacity-0 pointer-events-none" />
    return (
      <div key={match.id} className="w-36 sm:w-48 bg-card border border-border rounded-lg overflow-hidden flex flex-col shadow-sm relative z-10 transition-transform hover:scale-105">
        <div className="flex justify-between items-center px-2 sm:px-3 py-1.5 sm:py-2 border-b border-border bg-secondary/20">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden">
            {match.homeTeam?.logo ? (
              <img src={match.homeTeam.logo} alt="" className="w-3.5 h-3.5 sm:w-4 sm:h-4" crossOrigin="anonymous" />
            ) : <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-muted rounded-full flex-shrink-0"/>}
            <span className="text-xs sm:text-sm font-bold text-foreground truncate">{match.homeTeam?.shortName ?? homeLabel}</span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-foreground pl-2">{match.score?.home ?? "-"}</span>
        </div>
        <div className="flex justify-between items-center px-2 sm:px-3 py-1.5 sm:py-2 bg-secondary/20">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden">
            {match.awayTeam?.logo ? (
              <img src={match.awayTeam.logo} alt="" className="w-3.5 h-3.5 sm:w-4 sm:h-4" crossOrigin="anonymous" />
            ) : <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-muted rounded-full flex-shrink-0"/>}
            <span className="text-xs sm:text-sm font-bold text-foreground truncate">{match.awayTeam?.shortName ?? awayLabel}</span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-foreground pl-2">{match.score?.away ?? "-"}</span>
        </div>
        <div suppressHydrationWarning className="px-2 py-1 bg-muted/50 text-[9px] sm:text-[10px] text-center text-muted-foreground uppercase tracking-wider flex flex-col gap-0.5 leading-tight">
          <span suppressHydrationWarning>
            {mounted ? `${new Date(match.date).toLocaleDateString([], { month: "short", day: "numeric" })} · ${new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}` : "..."}
          </span>
          {venue && <span className="text-[8.5px] opacity-80 truncate">{venue}</span>}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <h2 className="text-xl font-bold px-2 text-foreground">Fase Eliminatoria</h2>
      <div className="w-full overflow-x-auto pb-6 pt-2 scrollbar-thin">
        <div className="min-w-[900px] flex gap-2 sm:gap-4 px-2 scale-90 sm:scale-100 origin-top-left">
          
          {/* ALA IZQUIERDA */}
          <div className="flex gap-2 sm:gap-4">
            {/* Octavos Izquierda (Houston, Philly, Dallas, Seattle) */}
            <div className="flex flex-col justify-around gap-2">
              <h3 className="text-[10px] font-bold text-center text-muted-foreground uppercase mb-2">Octavos</h3>
              {renderMatch(octavos[0], "W73", "W75", "Estadio Houston (Houston)")}
              {renderMatch(octavos[1], "W74", "W77", "Estadio Filadelfia (Filadelfia)")}
              {renderMatch(octavos[4], "W83", "W84", "Estadio Dallas (Dallas)")}
              {renderMatch(octavos[5], "W81", "W82", "Estadio de Seattle (Seattle)")}
            </div>
            
            {/* Cuartos Izquierda (Boston, LA) */}
            <div className="flex flex-col justify-around gap-2 py-8">
              <h3 className="text-[10px] font-bold text-center text-muted-foreground uppercase mb-2">Cuartos</h3>
              {renderMatch(cuartos[0], "W89", "W90", "Estadio Boston (Bostón)")}
              {renderMatch(cuartos[1], "W93", "W94", "Estadio Los Ángeles (Los Ángeles)")}
            </div>

            {/* Semis Izquierda (Dallas) */}
            <div className="flex flex-col justify-around gap-2 py-24">
              <h3 className="text-[10px] font-bold text-center text-muted-foreground uppercase mb-2">Semifinal</h3>
              {renderMatch(semis[0], "W97", "W98", "Estadio Dallas (Dallas)")}
            </div>
          </div>

          {/* CENTRO: Final y Tercer Puesto */}
          <div className="flex flex-col justify-center items-center gap-12 px-2 sm:px-6 shrink-0">
            <div className="flex flex-col items-center gap-2">
              <h3 className="text-xs font-black text-center text-primary uppercase">Final</h3>
              <div className="scale-105 sm:scale-110 shadow-lg shadow-primary/20 rounded-lg">
                {renderMatch(final[0], "W101", "W102", "Estadio Nueva York/Nueva Jersey")}
              </div>
            </div>
            {tercer.length > 0 && (
              <div className="flex flex-col items-center gap-2 mt-4 opacity-90">
                <h3 className="text-[9px] font-bold text-center text-muted-foreground uppercase">Tercer Puesto</h3>
                {renderMatch(tercer[0], "RU101", "RU102", "Estadio Miami (Miami)")}
              </div>
            )}
          </div>

          {/* ALA DERECHA */}
          <div className="flex gap-2 sm:gap-4">
            {/* Semis Derecha (Atlanta) */}
            <div className="flex flex-col justify-around gap-2 py-24">
              <h3 className="text-[10px] font-bold text-center text-muted-foreground uppercase mb-2">Semifinal</h3>
              {renderMatch(semis[1], "W99", "W100", "Estadio Atlanta (Atlanta)")}
            </div>

            {/* Cuartos Derecha (Miami, Kansas City) */}
            <div className="flex flex-col justify-around gap-2 py-8">
              <h3 className="text-[10px] font-bold text-center text-muted-foreground uppercase mb-2">Cuartos</h3>
              {renderMatch(cuartos[2], "W91", "W92", "Estadio Miami (Miami)")}
              {renderMatch(cuartos[3], "W95", "W96", "Estadio Kansas City (Ciudad de Kansas)")}
            </div>

            {/* Octavos Derecha (NY/NJ, CDMX, Atlanta, Vancouver) */}
            <div className="flex flex-col justify-around gap-2">
              <h3 className="text-[10px] font-bold text-center text-muted-foreground uppercase mb-2">Octavos</h3>
              {renderMatch(octavos[2], "W76", "W78", "Estadio NY/NJ (Nueva York)")}
              {renderMatch(octavos[3], "W79", "W80", "Estadio CDMX (Ciudad de México)")}
              {renderMatch(octavos[6], "W86", "W88", "Estadio Atlanta (Atlanta)")}
              {renderMatch(octavos[7], "W85", "W87", "Estadio BC Place (Vancouver)")}
            </div>
          </div>

        </div>
      </div>
      
      {isAdmin && (
        <div className="mt-8 p-4 rounded-xl border border-primary/20 bg-primary/5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-primary">Administración de Llaves</h3>
            <button 
              disabled={isSubmitting} 
              onClick={handleInitKnockouts} 
              className="bg-primary/20 text-primary font-bold px-3 py-1.5 rounded text-xs hover:bg-primary/30 transition-colors"
            >
              🔄 Regenerar Fechas Oficiales
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {bracket.map(m => {
              const currentSel = bracketSelections[m.id] || { home: m.homeTeam?.name || "TBD", away: m.awayTeam?.name || "TBD" } // Uses shortName/name fallback but actually we want IDs. Wait, the bracket KnockoutMatch homeTeam object has name/shortName/logo but not ID. 
              // Wait, the API maps `homeTeam: { name, shortName, logo }` it doesn't have ID!
              // I will use shortName for now or just map by name.
              
              return (
                <div key={m.id} className="p-3 bg-card border border-border rounded-lg flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                   <div className="flex flex-col">
                      <span className="text-xs font-bold text-primary uppercase">{m.phase}</span>
                      <span suppressHydrationWarning className="text-xs text-muted-foreground">{mounted ? new Date(m.date).toLocaleDateString() : "..."}</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <select 
                        className="h-8 rounded border border-input px-2 text-xs w-32"
                        value={currentSel.home}
                        onChange={e => setBracketSelections({ ...bracketSelections, [m.id]: { ...currentSel, home: e.target.value }})}
                      >
                        <option value="TBD">TBD</option>
                        {adminTeams.map(t => <option key={t.id} value={t.id}>{t.shortName}</option>)}
                      </select>
                      <span className="text-xs font-bold">vs</span>
                      <select 
                        className="h-8 rounded border border-input px-2 text-xs w-32"
                        value={currentSel.away}
                        onChange={e => setBracketSelections({ ...bracketSelections, [m.id]: { ...currentSel, away: e.target.value }})}
                      >
                        <option value="TBD">TBD</option>
                        {adminTeams.map(t => <option key={t.id} value={t.id}>{t.shortName}</option>)}
                      </select>
                      <button disabled={isSubmitting} onClick={() => handleSaveBracketTeams(m.id)} className="ml-2 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 rounded text-xs font-bold">
                        Guardar
                      </button>
                   </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

