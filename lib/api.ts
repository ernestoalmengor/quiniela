import { QuinielaData } from "./types"
import fallbackData from "@/data/quiniela.json"

// La URL de tu script de Google se configura en el archivo .env.local
const API_URL = process.env.NEXT_PUBLIC_SHEETS_API_URL

export async function fetchQuinielaData(userId: string = "1"): Promise<QuinielaData> {
  if (!API_URL) {
    console.warn("NEXT_PUBLIC_SHEETS_API_URL no configurada. Usando datos locales de prueba.")
    return fallbackData as QuinielaData
  }

  try {
    const res = await fetch(`${API_URL}?userId=${userId}`, {
      cache: "no-store", // Para que siempre traiga datos frescos
    })
    
    if (!res.ok) throw new Error("Error al obtener datos de Google Sheets")
    
    return await res.json()
  } catch (err) {
    console.error("Error cargando Google Sheets:", err)
    return fallbackData as QuinielaData
  }
}

export async function savePredictionApi(userId: string, matchId: string, home: number, away: number) {
  if (!API_URL) {
    console.log("Mock POST (solo probando):", { userId, matchId, home, away })
    return { success: true }
  }

  try {
    await fetch(`${API_URL}?action=savePrediction`, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain",
      },
      body: JSON.stringify({
        userId,
        matchId,
        home,
        away
      })
    })
  } catch (err) {
    console.error("Failed to save prediction", err)
  }
}

export async function updateAvatarApi(userId: string, avatarUrl: string) {
  if (!API_URL) {
    console.log("Mock POST avatar:", { userId, avatarUrl })
    return { success: true }
  }

  try {
    await fetch(`${API_URL}?action=updateUser`, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain",
      },
      body: JSON.stringify({
        userId,
        avatar: avatarUrl
      })
    })
  } catch (err) {
    console.error("Failed to update avatar", err)
  }
}
