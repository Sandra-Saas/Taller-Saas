const { PrismaClient } = require('@prisma/client')
const { hashPassword } = require('../lib/passwords.js')

const prisma = new PrismaClient()

async function createSuperAdmin() {
  try {
    // Verificar si ya existe
    const existing = await prisma.superAdmin.findUnique({
      where: { email: 'jas985889@gmail.com' }
    })

    if (existing) {
      console.log('❌ El super admin con este email ya existe.')
      process.exit(1)
    }

    // Crear el super admin
    const hashedPassword = hashPassword('Dolar2026')
    
    const superAdmin = await prisma.superAdmin.create({
      data: {
        firstName: 'Sandra',
        lastName: 'Ñambi',
        email: 'jas985889@gmail.com',
        password: hashedPassword,
        status: 'active'
      }
    })

    console.log('✅ Super admin creado exitosamente:')
    console.log(`   Email: ${superAdmin.email}`)
    console.log(`   Nombre: ${superAdmin.firstName} ${superAdmin.lastName}`)
    console.log(`   Estado: ${superAdmin.status}`)
    console.log(`\n🔐 Puedes acceder en http://localhost:3000/login con:`)
    console.log(`   Email: jas985889@gmail.com`)
    console.log(`   Contraseña: Dolar2026`)
    
  } catch (error) {
    console.error('❌ Error al crear super admin:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createSuperAdmin()
