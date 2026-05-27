import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import AdminDashboardClient from "@/components/quiniela/admin-dashboard-client"

export default async function AdminPage() {
  const session = await auth()
  
  // Protección estricta: Solo Admins
  if ((session?.user as any)?.role !== "ADMIN") {
     redirect("/")
  }
  
  // Extraemos toda la data maestra del torneo para pasárselo al Cliente
  const jornadas = await prisma.jornada.findMany({ orderBy: { id: 'asc' } })
  const teams = await prisma.team.findMany({ orderBy: { name: 'asc' } })
  const matches = await prisma.tournamentMatch.findMany({
    orderBy: { date: 'asc' },
    include: { homeTeam: true, awayTeam: true, jornada: true }
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header falso para regresar */}
      <header className="border-b bg-card">
        <div className="container mx-auto max-w-6xl py-4 flex items-center justify-between">
          <h1 className="text-xl font-black text-primary">👑 Quiniela OS - Panel de Deidad</h1>
          <a href="/" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
            ← Regresar a la Quiniela
          </a>
        </div>
      </header>
      
      <main className="container mx-auto py-10 max-w-6xl">
        <AdminDashboardClient jornadas={jornadas} teams={teams} matches={matches} />
      </main>
    </div>
  )
}
