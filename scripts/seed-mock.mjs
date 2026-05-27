import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log("-----------------------------------------")
  console.log("Iniciando inyección de datos de prueba...")
  console.log("-----------------------------------------")

  // 1. Limpiar datos de prueba antiguos (Opcional, pero recomendado para debug)
  // No limpiaremos usuarios para no borrar al Admin accidentalmente, 
  // pero sí limpiaremos Partidos, Equipos y Jornadas.
  await prisma.prediction.deleteMany({})
  await prisma.tournamentMatch.deleteMany({})
  await prisma.jornada.deleteMany({})
  await prisma.team.deleteMany({})
  await prisma.groupMember.deleteMany({})
  await prisma.group.deleteMany({})
  
  // 2. Crear Configuración (Grupo Global default)
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
  if (!admin) {
    throw new Error("Admin no existe. Debes correr seed-admin.mjs primero.")
  }

  const globalGroup = await prisma.group.create({
    data: {
      name: "Clasificación Global",
      inviteCode: "GLOBAL-2026",
      adminId: admin.id
    }
  })

  // 3. Crear Jornadas
  const f1 = new Date(); f1.setHours(f1.getHours() + 24); // Mañana
  const f2 = new Date(); f2.setHours(f2.getHours() + 48);
  const f3 = new Date(); f3.setHours(f3.getHours() + 72);

  await prisma.jornada.createMany({
    data: [
      { id: 1, name: "Jornada 1", status: "live", deadline: f1 },
      { id: 2, name: "Jornada 2", status: "upcoming", deadline: f2 },
      { id: 3, name: "Jornada 3", status: "upcoming", deadline: f3 },
    ]
  })

  // 4. Crear Equipos (Mundial 2026 hosts + algunos)
  const equiposData = [
    { name: "México", shortName: "MEX", groupId: "A", logo: "🇲🇽" },
    { name: "Estados Unidos", shortName: "USA", groupId: "B", logo: "🇺🇸" },
    { name: "Canadá", shortName: "CAN", groupId: "A", logo: "🇨🇦" },
    { name: "Argentina", shortName: "ARG", groupId: "C", logo: "🇦🇷" },
    { name: "Brasil", shortName: "BRA", groupId: "D", logo: "🇧🇷" },
    { name: "Francia", shortName: "FRA", groupId: "D", logo: "🇫🇷" },
    { name: "España", shortName: "ESP", groupId: "E", logo: "🇪🇸" },
    { name: "Alemania", shortName: "GER", groupId: "E", logo: "🇩🇪" }
  ]

  for (const eq of equiposData) {
    await prisma.team.create({ data: eq })
  }

  const equipos = await prisma.team.findMany()
  const getTeam = (sn) => equipos.find(e => e.shortName === sn).id

  // 5. Crear Partidos Reales
  const match1 = await prisma.tournamentMatch.create({
    data: {
      jornadaId: 1,
      phase: "Grupos",
      homeTeamId: getTeam("MEX"),
      awayTeamId: getTeam("USA"),
      date: new Date(new Date().getTime() + 1000 * 60 * 60), // En 1 hora
      status: "upcoming"
    }
  })

  const match2 = await prisma.tournamentMatch.create({
    data: {
      jornadaId: 1,
      phase: "Grupos",
      homeTeamId: getTeam("ARG"),
      awayTeamId: getTeam("BRA"),
      date: new Date(new Date().getTime() - 1000 * 60 * 60 * 2), // Hace 2 horas
      status: "finished",
      homeScore: 2,
      awayScore: 1
    }
  })

  const match3 = await prisma.tournamentMatch.create({
    data: {
      jornadaId: 2,
      phase: "Grupos",
      homeTeamId: getTeam("FRA"),
      awayTeamId: getTeam("ESP"),
      date: new Date(new Date().getTime() + 1000 * 60 * 60 * 48),
      status: "upcoming"
    }
  })

  // 6. Crear Usuarios Ficticios (Participantes)
  const usersToCreate = [
    { fn: "Lionel", ln: "Messi", u: "lmessi", c: "lmessi@quiniela.com" },
    { fn: "Kylian", ln: "Mbappe", u: "kmbappe", c: "kmbappe@quiniela.com" },
    { fn: "Cristiano", ln: "Ronaldo", u: "cronaldo", c: "cronaldo@quiniela.com" }
  ]

  const pass = await bcrypt.hash("123456", 10)

  for (const obj of usersToCreate) {
    const u = await prisma.user.create({
      data: {
        firstName: obj.fn, lastName: obj.ln, username: obj.u, email: obj.c, password: pass
      }
    })
    
    // Inscribirlos al grupo Global
    await prisma.groupMember.create({
      data: { userId: u.id, groupId: globalGroup.id, points: Math.floor(Math.random() * 10) }
    })

    // Crearles predicciones falsas (para el partido ARG vs BRA que ya terminó)
    await prisma.prediction.create({
      data: {
        userId: u.id,
        matchId: match2.id,
        homeScore: Math.floor(Math.random() * 3),
        awayScore: Math.floor(Math.random() * 3)
      }
    })
  }

  // Inscribir también al Admin al grupo global
  await prisma.groupMember.create({
    data: { userId: admin.id, groupId: globalGroup.id, points: 5 } // 5 pts ficticios
  })

  console.log("✅ Se inyectaron exitosamente Partidos, Equipos y Usuarios.")
  console.log("Ahora inicia 'npm run dev' y haz login para ver The Leaderboard poblado!")
}

main()
  .catch(e => {
    console.error("Hubo un error inyectando los datos falsos:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
