/**
 * Script de prueba para verificar la conexión con Supabase
 * y las operaciones CRUD en la tabla de clientes
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Cargar variables de entorno desde .env
config({ path: resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

console.log('🔧 Configuración:')
console.log('URL:', supabaseUrl ? '✅ Configurada' : '❌ No configurada')
console.log('ANON KEY:', supabaseAnonKey ? '✅ Configurada' : '❌ No configurada')
console.log('')

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Error: Variables de entorno no configuradas')
    console.error('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
    console.log('🔍 Iniciando pruebas de conexión a Supabase...\n')

    // Test 1: Verificar conexión básica
    console.log('1️⃣ Verificando conexión básica...')
    try {
        // Primero intentar sin autenticación (público)
        const { data, error, count, status, statusText } = await supabase
            .from('clientes')
            .select('*', { count: 'exact', head: true })

        console.log('📊 Respuesta de Supabase:')
        console.log('   Status:', status)
        console.log('   Status Text:', statusText)
        console.log('   Count:', count)
        console.log('   Error:', error)
        console.log('   Data:', data)

        if (error) {
            console.error('\n❌ Error en conexión:', error.message || 'Error desconocido')

            // Si el error es por RLS (Row Level Security)
            if (error.code === 'PGRST116' || error.message.includes('row-level security')) {
                console.error('\n⚠️  PROBLEMA DETECTADO: Row Level Security (RLS) está bloqueando el acceso')
                console.error('   Las políticas de seguridad de Supabase están impidiendo leer la tabla.')
                console.error('\n📋 SOLUCIONES:')
                console.error('   1. Desactiva RLS temporalmente para desarrollo')
                console.error('   2. O crea políticas de acceso en Supabase para la tabla clientes')
                console.error('\n👉 Ve a Supabase Dashboard → Authentication → Policies → clientes')
            }

            return false
        }
        console.log('\n✅ Conexión exitosa')
        console.log(`   Total de clientes en la base de datos: ${count || 0}\n`)
    } catch (err: any) {
        console.error('❌ Error de red o excepción:', err.message || err)
        return false
    }

    // Test 2: Listar clientes
    console.log('2️⃣ Listando clientes existentes...')
    try {
        const { data: clientes, error } = await supabase
            .from('clientes')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5)

        if (error) {
            console.error('❌ Error al listar clientes:', error.message)
            console.error('Detalles:', error)
            return false
        }

        console.log(`✅ Se encontraron ${clientes?.length || 0} clientes`)
        if (clientes && clientes.length > 0) {
            console.log('\n📋 Primeros clientes:')
            clientes.forEach((cliente, index) => {
                console.log(`   ${index + 1}. ${cliente.nombre} - ${cliente.email}`)
            })
        }
        console.log('')
    } catch (err) {
        console.error('❌ Error:', err)
        return false
    }

    // Test 3: Verificar estructura de tabla
    console.log('3️⃣ Verificando estructura de tabla clientes...')
    try {
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .limit(1)

        if (error) {
            console.error('❌ Error al verificar estructura:', error.message)
            return false
        }

        if (data && data.length > 0) {
            console.log('✅ Campos disponibles en tabla clientes:')
            const campos = Object.keys(data[0])
            campos.forEach(campo => {
                console.log(`   - ${campo}`)
            })
            console.log('')
        }
    } catch (err) {
        console.error('❌ Error:', err)
        return false
    }

    // Test 4: Verificar tabla membresías
    console.log('4️⃣ Verificando tabla membresías...')
    try {
        const { data: membresias, error } = await supabase
            .from('membresias')
            .select('*')
            .limit(5)

        if (error) {
            console.error('❌ Error al verificar membresías:', error.message)
            return false
        }

        console.log(`✅ Se encontraron ${membresias?.length || 0} membresías`)
        if (membresias && membresias.length > 0) {
            console.log('\n📋 Membresías disponibles:')
            membresias.forEach((membresia, index) => {
                console.log(`   ${index + 1}. ${membresia.nombre} - $${membresia.precio}`)
            })
        }
        console.log('')
    } catch (err) {
        console.error('❌ Error:', err)
        return false
    }

    // Test 5: Verificar otras tablas
    console.log('5️⃣ Verificando otras tablas del sistema...')
    const tablas = ['asistencias', 'eventos', 'rutinas', 'perfiles']

    for (const tabla of tablas) {
        try {
            const { count, error } = await supabase
                .from(tabla)
                .select('*', { count: 'exact', head: true })

            if (error) {
                console.log(`   ⚠️  Tabla '${tabla}': ${error.message}`)
            } else {
                console.log(`   ✅ Tabla '${tabla}': ${count || 0} registros`)
            }
        } catch (err) {
            console.log(`   ❌ Tabla '${tabla}': Error desconocido`)
        }
    }
    console.log('')

    return true
}

// Ejecutar pruebas
testConnection()
    .then(success => {
        if (success) {
            console.log('✨ Todas las pruebas completadas exitosamente\n')
            console.log('🎯 Tu configuración de base de datos está funcionando correctamente')
            console.log('👉 Puedes acceder a la sección de clientes en: http://localhost:3001/clientes\n')
            process.exit(0)
        } else {
            console.log('\n⚠️  Algunas pruebas fallaron. Revisa los errores anteriores.\n')
            process.exit(1)
        }
    })
    .catch(err => {
        console.error('\n❌ Error crítico:', err)
        process.exit(1)
    })
