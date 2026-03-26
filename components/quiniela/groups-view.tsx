import { Group } from "@/lib/types"

interface GroupsViewProps {
  groups: Group[]
}

export function GroupsView({ groups }: GroupsViewProps) {
  if (!groups || groups.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">No hay grupos disponibles.</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold px-2 text-foreground">Fase de Grupos</h2>
      {groups.map((group) => (
        <div key={group.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="bg-primary/10 px-4 py-2 font-bold text-sm text-primary">
            {group.name}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-foreground">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Equipo</th>
                  <th className="px-2 py-2 text-center font-medium">Pts</th>
                  <th className="px-2 py-2 text-center font-medium">J</th>
                  <th className="px-2 py-2 text-center font-medium">G</th>
                  <th className="px-2 py-2 text-center font-medium">E</th>
                  <th className="px-2 py-2 text-center font-medium">P</th>
                  <th className="px-2 py-2 text-center font-medium">GF</th>
                  <th className="px-2 py-2 text-center font-medium">GC</th>
                  <th className="px-2 py-2 text-center font-medium">DIF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {group.teams.map((stats, idx) => (
                  <tr key={stats.team.shortName} className="hover:bg-muted/30">
                    <td className="px-4 py-2 flex items-center gap-2">
                      <span className="text-muted-foreground text-xs w-3">{idx + 1}</span>
                      {stats.team.logo ? (
                        <img src={stats.team.logo} alt={stats.team.shortName} className="w-5 h-5 object-contain" crossOrigin="anonymous"/>
                      ) : (
                         <div className="w-5 h-5 bg-muted rounded-full"/>
                      )}
                      <span className="font-semibold">{stats.team.shortName}</span>
                    </td>
                    <td className="px-2 py-2 text-center font-bold text-primary">{stats.points}</td>
                    <td className="px-2 py-2 text-center">{stats.played}</td>
                    <td className="px-2 py-2 text-center">{stats.won}</td>
                    <td className="px-2 py-2 text-center">{stats.drawn}</td>
                    <td className="px-2 py-2 text-center">{stats.lost}</td>
                    <td className="px-2 py-2 text-center">{stats.goalsFor}</td>
                    <td className="px-2 py-2 text-center">{stats.goalsAgainst}</td>
                    <td className="px-2 py-2 text-center">{stats.goalDifference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
