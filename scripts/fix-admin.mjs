import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const res = await prisma.user.updateMany({
    where: { username: 'admin' },
    data: { password: hashedPassword }
  })
  console.log('Admin password actualizardo: ', res.count)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
