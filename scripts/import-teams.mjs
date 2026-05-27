import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log("-----------------------------------------")
  console.log("Iniciando importación oficial de Equipos del CSV...")
  console.log("-----------------------------------------")

  // 1. Leer el archivo CSV
  const csvPath = path.join(process.cwd(), 'Quiniela - Mundial 2026 - Equipos.csv')
  const fileContent = fs.readFileSync(csvPath, 'utf-8')
  
  // Dividir por líneas y descartar la cabecera
  const lineas = fileContent.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  const datos = lineas.slice(1) // Ignorar la fila 1: id,nombre,grupo,iso_bandera

  // 2. Limpiar partidos y equipos actuales por las relaciones (FKs)
  await prisma.prediction.deleteMany({})
  await prisma.tournamentMatch.deleteMany({})
  await prisma.team.deleteMany({})

  console.log("Datos de prueba de partidos antiguos eliminados para dar paso al torneo oficial.")

  // 3. Procesar las filas del CSV y cargarlas en la base de datos
  let equiposInsertados = 0

  for (const fila of datos) {
    const columnas = fila.split(',')
    if (columnas.length !== 4) continue

    const shortName = columnas[0].trim() // Ej: MEX
    const name = columnas[1].trim() // Ej: México
    const groupId = columnas[2].trim() // Ej: A
    const iso_bandera = columnas[3].trim() // Ej: mx

    // Construir la URL real de la bandera estilo Next.js Quiniela
    const logoUrl = iso_bandera === 'un' || !iso_bandera 
        ? "https://flagcdn.com/un.svg" 
        : `https://flagcdn.com/${iso_bandera}.svg`

    await prisma.team.create({
      data: {
        shortName: shortName,
        name: name,
        groupId: groupId,
        logo: logoUrl
      }
    })
    
    equiposInsertados++
  }

  console.log(`✅ ¡Importación Exitosa! Se insertaron ${equiposInsertados} equipos oficiales de la Copa del Mundo en Supabase (PostgreSQL).`)
}

main()
  .catch(e => {
    console.error("Hubo un error importando:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
