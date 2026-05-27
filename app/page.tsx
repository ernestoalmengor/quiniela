import { QuinielaApp } from "@/components/quiniela/quiniela-app"
import { fetchQuinielaData } from "@/lib/api"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function Page() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  const data = await fetchQuinielaData(session.user.id!)
  return <QuinielaApp data={data} />
}
