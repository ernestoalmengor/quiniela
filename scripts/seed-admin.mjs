import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminExists = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
  if (adminExists) {
    console.log('El Administrador ya existe en la base de datos.')
    return
  }

  const hashedPassword = await bcrypt.hash('admin123', 10)

  await prisma.user.create({
    data: {
      firstName: 'Kevin',
      lastName: 'Admin',
      username: 'admin',
      email: 'admin@quiniela.com',
      password: hashedPassword,
      role: 'ADMIN'
    }
  })

  console.log('✅ Súper Administrador creado exitosamente con usuario "admin" y contraseña "admin123"')
}

main()
  .catch(e => {
    console.error('Error inyectando admin:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
