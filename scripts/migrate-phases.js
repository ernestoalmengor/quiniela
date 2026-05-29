const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log("Iniciando migración y sembrado de Fases...")

  // 1. Crear las fases si no existen
  const phasesData = [
    { name: "Fase de grupos" },
    { name: "Dieciseisavos" },
    { name: "Octavos" },
    { name: "Cuartos" },
    { name: "Semifinal" },
    { name: "Final" }
  ]

  const phases = {}
  for (const p of phasesData) {
    const record = await prisma.phase.upsert({
      where: { name: p.name },
      update: {},
      create: { name: p.name }
    })
    phases[p.name] = record.id
    console.log(`Fase '${p.name}' garantizada con ID: ${record.id}`)
  }

  // 2. Buscar todas las jornadas
  const jornadas = await prisma.jornada.findMany()
  console.log(`Encontradas ${jornadas.length} jornadas en la base de datos.`)

  for (const j of jornadas) {
    let phaseName = "Fase de grupos" // por defecto

    const nameLower = j.name.toLowerCase()
    if (nameLower.includes("dieciseis") || nameLower.includes("16") || nameLower.includes("ida") || nameLower.includes("vuelta")) {
      // Si la jornada tiene relación con dieciseisavos o ida/vuelta
      if (nameLower.includes("ida") || nameLower.includes("vuelta")) {
        phaseName = "Dieciseisavos"
      }
    }
    if (nameLower.includes("octavo")) {
      phaseName = "Octavos"
    } else if (nameLower.includes("cuarto")) {
      phaseName = "Cuartos"
    } else if (nameLower.includes("semi")) {
      phaseName = "Semifinal"
    } else if (nameLower.includes("final") && !nameLower.includes("semi")) {
      phaseName = "Final"
    }

    const phaseId = phases[phaseName]
    await prisma.jornada.update({
      where: { id: j.id },
      data: { phaseId }
    })
    console.log(`Jornada '${j.name}' vinculada a la fase '${phaseName}'`)
  }

  console.log("¡Migración de fases completada con éxito!")
}

main()
  .catch(err => {
    console.error("Error durante la migración:", err)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
