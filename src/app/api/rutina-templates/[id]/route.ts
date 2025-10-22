import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

async function ensureTables() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.rutina_templates (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      nombre varchar(255) NOT NULL,
      descripcion text,
      created_by varchar(255),
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    )
  `)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.rutina_template_ejercicios (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      template_id uuid NOT NULL,
      ejercicio_id uuid,
      nombre varchar(255),
      series int,
      repeticiones int,
      peso_sugerido numeric(10,2),
      dia varchar(20),
      notas text,
      orden int,
      created_at timestamptz DEFAULT now(),
      CONSTRAINT fk_template FOREIGN KEY (template_id) REFERENCES public.rutina_templates(id) ON DELETE CASCADE
    )
  `)
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await ensureTables()
    const tRows = await prisma.$queryRawUnsafe<any[]>(
      'SELECT id, nombre, descripcion, created_at, updated_at FROM public.rutina_templates WHERE id = $1 LIMIT 1',
      params.id,
    )
    const template = tRows[0]
    if (!template) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    const eRows = await prisma.$queryRawUnsafe<any[]>(
      'SELECT id, template_id, ejercicio_id, nombre, series, repeticiones, peso_sugerido, dia, notas, orden FROM public.rutina_template_ejercicios WHERE template_id = $1 ORDER BY orden ASC NULLS LAST, id ASC',
      params.id,
    )

    return NextResponse.json({ ...template, ejercicios: eRows })
  } catch (err) {
    console.error('GET /api/rutina-templates/[id] error', err)
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
    const { nombre, descripcion } = body

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE public.rutina_templates SET
         nombre = COALESCE($1, nombre),
         descripcion = COALESCE($2, descripcion),
         updated_at = now()
       WHERE id = $3
       RETURNING id, nombre, descripcion, created_at, updated_at`,
      nombre ?? null,
      descripcion ?? null,
      params.id,
    )

    const updated = rows[0]
    if (!updated) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('PUT /api/rutina-templates/[id] error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await ensureTables()
    await prisma.$executeRawUnsafe('DELETE FROM public.rutina_template_ejercicios WHERE template_id = $1', params.id)
    const rows = await prisma.$queryRawUnsafe<any[]>(
      'DELETE FROM public.rutina_templates WHERE id = $1 RETURNING id',
      params.id,
    )
    if (!rows[0]) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/rutina-templates/[id] error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}