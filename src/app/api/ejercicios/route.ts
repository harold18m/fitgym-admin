import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

async function ensureTables() {
  // Crear tabla ejercicios si no existe
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.ejercicios (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      nombre varchar(255) NOT NULL,
      categoria varchar(50),
      dificultad varchar(50),
      musculos text[],
      descripcion text,
      imagen_url text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    )
  `)
}

export async function GET() {
  try {
    await ensureTables()
    const rows = await prisma.$queryRawUnsafe<any[]>(
      'SELECT id, nombre, categoria, dificultad, musculos, descripcion, imagen_url, created_at, updated_at FROM public.ejercicios ORDER BY updated_at DESC NULLS LAST, created_at DESC'
    )
    return NextResponse.json({ ejercicios: rows })
  } catch (err) {
    console.error('GET /api/ejercicios error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await ensureTables()
    const body = await req.json()
    const { nombre, categoria, dificultad, musculos, descripcion, imagen_url } = body
    if (!nombre) return NextResponse.json({ error: 'nombre es requerido' }, { status: 400 })

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO public.ejercicios (nombre, categoria, dificultad, musculos, descripcion, imagen_url, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, now())
       RETURNING id, nombre, categoria, dificultad, musculos, descripcion, imagen_url, created_at, updated_at`,
      nombre,
      categoria ?? null,
      dificultad ?? null,
      Array.isArray(musculos) ? musculos : (typeof musculos === 'string' ? (musculos as string).split(',').map(s => s.trim()) : null),
      descripcion ?? null,
      imagen_url ?? null,
    )

    return NextResponse.json(rows[0], { status: 201 })
  } catch (err) {
    console.error('POST /api/ejercicios error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}