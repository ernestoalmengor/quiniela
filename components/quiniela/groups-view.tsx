import { Group } from "@/lib/types"
import { Edit2 } from "lucide-react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { adminUpdateTeam } from "@/lib/admin-actions"

interface GroupsViewProps {
  groups: Group[]
  isAdmin?: boolean
}

export function GroupsView({ groups, isAdmin }: GroupsViewProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [editingTeam, setEditingTeam] = useState<any>(null)
  const [tShortName, setTShortName] = useState("")
  const [tName, setTName] = useState("")
  const [tGroupId, setTGroupId] = useState("")
  const [tLogo, setTLogo] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)


  const handleEditClick = (team: any, groupId: string) => {
     setEditingTeam(team)
     setTShortName(team.shortName)
     setTName(team.name)
     setTGroupId(groupId.replace("Grupo ", ""))
     setTLogo(team.logo || "")
  }

  const handleSaveTeam = async () => {
    setIsSubmitting(true)
    try {
      // Find the team id, wait, the stats.team object doesn't have ID!
      // In lib/api.ts, the mapped team inside GroupsView does not include team.id.
      // I need to update lib/api.ts to include team.id in the TeamStats.
      // Assuming we'll fix it in api.ts next:
      await adminUpdateTeam(editingTeam.id, tShortName, tName, tGroupId, tLogo)
      setEditingTeam(null)
      startTransition(() => router.refresh())
    } catch(e) {
      alert("Error guardando equipo")
    }
    setIsSubmitting(false)
  }

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
                        <img src={stats.team.logo} alt={stats.team.shortName} className="w-5 h-5 object-contain" />
                      ) : (
                         <div className="w-5 h-5 bg-muted rounded-full"/>
                      )}
                      <span className="font-semibold">{stats.team.shortName}</span>
                      {isAdmin && (
                        <button onClick={() => handleEditClick(stats.team, group.name)} className="ml-2 h-6 w-6 inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors">
                          <Edit2 className="w-3 h-3 text-muted-foreground" />
                        </button>
                      )}
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

      {editingTeam && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-card border border-border shadow-lg rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Editar Equipo</h3>
              <div className="flex flex-col gap-3">
                 <div>
                    <label className="text-xs font-semibold">Código Corto (3 Letras)</label>
                    <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={tShortName} onChange={e => setTShortName(e.target.value)} />
                 </div>
                 <div>
                    <label className="text-xs font-semibold">Nombre Completo</label>
                    <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={tName} onChange={e => setTName(e.target.value)} />
                 </div>
                 <div>
                    <label className="text-xs font-semibold">Grupo</label>
                    <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={tGroupId} onChange={e => setTGroupId(e.target.value)} />
                 </div>
                 <div>
                    <label className="text-xs font-semibold">URL Logo</label>
                    <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={tLogo} onChange={e => setTLogo(e.target.value)} />
                 </div>
                 <div className="flex gap-2 mt-4">
                    <button disabled={isSubmitting} onClick={handleSaveTeam} className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 flex-1 rounded-md font-bold text-sm transition-colors">
                      Guardar Cambios
                    </button>
                    <button onClick={() => setEditingTeam(null)} className="border border-input bg-background hover:bg-accent h-10 px-4 rounded-md font-bold text-sm transition-colors">
                      Cancelar
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  )
}
