import { QuinielaApp } from "@/components/quiniela/quiniela-app"
import { fetchQuinielaData } from "@/lib/api"

export default async function Page() {
  const data = await fetchQuinielaData("1")
  return <QuinielaApp data={data} />
}
