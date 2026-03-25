import { QuinielaApp } from "@/components/quiniela/quiniela-app"
import quinielaData from "@/data/quiniela.json"
import type { QuinielaData } from "@/lib/types"

export default function Page() {
  return <QuinielaApp data={quinielaData as QuinielaData} />
}
