import { KnockoutMatch } from "@/lib/types"

interface BracketViewProps {
  bracket: KnockoutMatch[]
}

export function BracketView({ bracket }: BracketViewProps) {
  if (!bracket || bracket.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">Aún no hay llaves definidas.</div>
  }

  const phases = ["Octavos", "Cuartos", "Semifinal", "Final"]
  
  return (
    <div className="flex flex-col gap-4 w-full">
      <h2 className="text-xl font-bold px-2 text-foreground">Fase Eliminatoria</h2>
      <div className="w-full overflow-x-auto pb-6 pt-2 -mx-4 px-4 sm:mx-0 sm:px-2 scrollbar-thin">
        <div className="flex gap-6 sm:gap-8 min-w-max pb-2">
          {phases.map((phase) => {
            const matchesOfPhase = bracket.filter(m => m.phase === phase)
            if (matchesOfPhase.length === 0) return null
            return (
              <div key={phase} className="flex flex-col gap-4">
                <h3 className="text-sm font-bold text-center text-muted-foreground uppercase">{phase}</h3>
                <div className="flex flex-col gap-6 justify-around flex-1">
                  {matchesOfPhase.map((match) => (
                    <div key={match.id} className="w-48 bg-card border border-border rounded-lg overflow-hidden flex flex-col shadow-sm">
                      <div className="flex justify-between items-center px-3 py-2 border-b border-border bg-secondary/20">
                        <div className="flex items-center gap-2">
                          {match.homeTeam && match.homeTeam.logo ? (
                            <img src={match.homeTeam.logo} alt="" className="w-4 h-4" crossOrigin="anonymous"/>
                          ) : <div className="w-4 h-4 bg-muted rounded-full"/>}
                          <span className="text-sm font-bold text-foreground">{match.homeTeam?.shortName ?? "TBD"}</span>
                        </div>
                        <span className="text-sm font-bold text-foreground">{match.score?.home ?? "-"}</span>
                      </div>
                      <div className="flex justify-between items-center px-3 py-2 bg-secondary/20">
                        <div className="flex items-center gap-2">
                          {match.awayTeam && match.awayTeam.logo ? (
                            <img src={match.awayTeam.logo} alt="" className="w-4 h-4" crossOrigin="anonymous"/>
                          ) : <div className="w-4 h-4 bg-muted rounded-full"/>}
                          <span className="text-sm font-bold text-foreground">{match.awayTeam?.shortName ?? "TBD"}</span>
                        </div>
                        <span className="text-sm font-bold text-foreground">{match.score?.away ?? "-"}</span>
                      </div>
                      <div className="px-3 py-1 bg-muted/50 text-[10px] text-center text-muted-foreground uppercase tracking-wider">
                        {new Date(match.date).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
