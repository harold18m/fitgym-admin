import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

async function ensureTables() {
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

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await ensureTables()
    const rows = await prisma.$queryRawUnsafe<any[]>(
      'SELECT id, nombre, categoria, dificultad, musculos, descripcion, imagen_url, created_at, updated_at FROM public.ejercicios WHERE id = $1 LIMIT 1',
      params.id,
    )
    const ejercicio = rows[0]
    if (!ejercicio) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json(ejercicio)
  } catch (err) {
    console.error('GET /api/ejercicios/[id] error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await ensureTables()
    const body = await req.json()
    const { nombre, categoria, dificultad, musculos, descripcion, imagen_url } = body

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE public.ejercicios SET
         nombre = COALESCE($1, nombre),
         categoria = COALESCE($2, categoria),
         dificultad = COALESCE($3, dificultad),
         musculos = COALESCE($4, musculos),
         descripcion = COALESCE($5, descripcion),
         imagen_url = COALESCE($6, imagen_url),
         updated_at = now()
       WHERE id = $7
       RETURNING id, nombre, categoria, dificultad, musculos, descripcion, imagen_url, created_at, updated_at`,
      nombre ?? null,
      categoria ?? null,
      dificultad ?? null,
      Array.isArray(musculos) ? musculos : (typeof musculos === 'string' ? (musculos as string).split(',').map(s => s.trim()) : null),
      descripcion ?? null,
      imagen_url ?? null,
      params.id,
    )

    const updated = rows[0]
    if (!updated) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('PUT /api/ejercicios/[id] error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await ensureTables()
    const rows = await prisma.$queryRawUnsafe<any[]>(
      'DELETE FROM public.ejercicios WHERE id = $1 RETURNING id',
      params.id,
    )
    if (!rows[0]) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/ejercicios/[id] error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}