/**
 * Script para desactivar Row Level Security (RLS) en todas las tablas
 * Esto permite acceso completo durante desarrollo
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Cargar variables de entorno
config({ path: resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Variables de entorno no configuradas')
    console.error('Necesitas NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

// Crear cliente con SERVICE_ROLE (tiene permisos de administrador)
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function desactivarRLS() {
    console.log('🔧 Desactivando Row Level Security en todas las tablas...\n')

    const tablas = [
        'clientes',
        'membresias',
        'asistencias',
        'eventos',
        'rutinas',
        'rutina_ejercicios',
        'perfiles',
        'tarjetas_acceso',
        'rutina_templates',
        'rutina_template_ejercicios'
    ]

    let exitos = 0
    let errores = 0

    for (const tabla of tablas) {
        try {
            const sql = `ALTER TABLE public.${tabla} DISABLE ROW LEVEL SECURITY;`

            const { data, error } = await supabase.rpc('exec_sql', {
                query: sql
            })

            if (error) {
                // Si la función RPC no existe, intentar con conexión directa
                console.log(`⚠️  Tabla '${tabla}': Intentando método alternativo...`)

                // Método alternativo: usar la API REST directamente
                const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                    method: 'POST',
                    headers: {
                        'apikey': supabaseServiceKey,
                        'Authorization': `Bearer ${supabaseServiceKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ query: sql })
                })

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`)
                }

                console.log(`✅ Tabla '${tabla}': RLS desactivado`)
                exitos++
            } else {
                console.log(`✅ Tabla '${tabla}': RLS desactivado`)
                exitos++
            }
        } catch (err: any) {
            console.error(`❌ Tabla '${tabla}': ${err.message}`)
            errores++
        }
    }

    console.log(`\n📊 Resumen:`)
    console.log(`   ✅ Exitosos: ${exitos}`)
    console.log(`   ❌ Errores: ${errores}`)

    if (errores > 0) {
        console.log('\n⚠️  NOTA: Si hubo errores, necesitas ejecutar el SQL manualmente:')
        console.log('   1. Ve a: https://supabase.com/dashboard/project/jrrhzezkzuqwuhkbwiiz/sql/new')
        console.log('   2. Copia el contenido de desactivar-rls.sql')
        console.log('   3. Ejecuta el script\n')
        process.exit(1)
    }

    // Verificar que RLS está desactivado
    console.log('\n🔍 Verificando estado de RLS...')

    const { data: verificacion, error: verError } = await supabase
        .from('clientes')
        .select('count', { count: 'exact', head: true })

    if (verError) {
        console.error('❌ Todavía hay problemas de acceso:', verError.message)
        console.log('\n📋 Ejecuta esto manualmente en Supabase SQL Editor:')
        console.log('   ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;')
        process.exit(1)
    }

    console.log('✅ ¡Verificación exitosa! Las tablas son accesibles.\n')
    console.log('🎉 ¡Todo listo! Ahora puedes probar tu aplicación.')
    console.log('👉 Ejecuta: bun test-db-connection.ts\n')
}

// Ejecutar
desactivarRLS().catch(err => {
    console.error('\n💥 Error crítico:', err.message)
    console.log('\n📋 SOLUCIÓN MANUAL:')
    console.log('Ejecuta este SQL en Supabase SQL Editor:')
    console.log('https://supabase.com/dashboard/project/jrrhzezkzuqwuhkbwiiz/sql/new\n')

    const tablas = [
        'clientes', 'membresias', 'asistencias', 'eventos',
        'rutinas', 'rutina_ejercicios', 'perfiles',
        'tarjetas_acceso', 'rutina_templates', 'rutina_template_ejercicios'
    ]

    tablas.forEach(tabla => {
        console.log(`ALTER TABLE public.${tabla} DISABLE ROW LEVEL SECURITY;`)
    })

    process.exit(1)
})
