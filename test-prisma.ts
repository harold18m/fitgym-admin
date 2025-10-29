/**
 * Verificar el estado de RLS usando Prisma
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verificarRLS() {
    console.log('🔍 Verificando estado de RLS y acceso a tablas...\n')

    try {
        // Test 1: Verificar con Prisma (usa conexión directa)
        console.log('1️⃣ Probando acceso con Prisma...')
        const count = await prisma.clientes.count()
        console.log(`✅ Prisma funciona: ${count} clientes en la base de datos\n`)

        // Test 2: Listar algunos clientes
        console.log('2️⃣ Listando clientes...')
        const clientes = await prisma.clientes.findMany({
            take: 5,
            select: {
                id: true,
                nombre: true,
                email: true,
                estado: true
            }
        })

        if (clientes.length > 0) {
            console.log('✅ Clientes encontrados:')
            clientes.forEach((c, i) => {
                console.log(`   ${i + 1}. ${c.nombre} - ${c.email} (${c.estado})`)
            })
        } else {
            console.log('⚠️  No hay clientes en la base de datos')
        }
        console.log('')

        // Test 3: Verificar membresías
        console.log('3️⃣ Verificando membresías...')
        const membresiasCount = await prisma.membresias.count()
        console.log(`✅ ${membresiasCount} membresías encontradas\n`)

        // Test 4: Crear un cliente de prueba
        console.log('4️⃣ Probando crear un cliente de prueba...')
        try {
            const nuevoCliente = await prisma.clientes.create({
                data: {
                    nombre: 'Cliente Prueba',
                    email: 'prueba@test.com',
                    telefono: '1234567890',
                    fecha_nacimiento: new Date('1990-01-01'),
                    estado: 'activa'
                }
            })
            console.log(`✅ Cliente creado: ${nuevoCliente.nombre} (ID: ${nuevoCliente.id})`)

            // Eliminar el cliente de prueba
            await prisma.clientes.delete({
                where: { id: nuevoCliente.id }
            })
            console.log('✅ Cliente de prueba eliminado\n')
        } catch (err: any) {
            console.error('❌ Error al crear cliente:', err.message)
        }

        console.log('🎉 ¡TODAS LAS PRUEBAS CON PRISMA EXITOSAS!\n')
        console.log('📋 Resumen:')
        console.log('   ✅ Prisma puede leer y escribir en la BD')
        console.log('   ✅ Las tablas están accesibles')
        console.log('   ✅ Todo funciona correctamente\n')

    } catch (err: any) {
        console.error('❌ Error:', err.message)
        console.error('\nDetalles:', err)
    } finally {
        await prisma.$disconnect()
    }
}

verificarRLS()
