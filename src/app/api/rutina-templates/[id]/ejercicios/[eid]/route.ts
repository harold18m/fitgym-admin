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

export async function PUT(
  req: Request,
  { params }: { params: { id: string; eid: string } }
) {
  try {
    await ensureTables()
    const body = await req.json()
    const { ejercicio_id, nombre, series, repeticiones, peso_sugerido, dia, notas, orden } = body

    let nombreFinal = nombre ?? null
    if (ejercicio_id && !nombreFinal) {
      const eRows = await prisma.$queryRawUnsafe<any[]>(
        'SELECT nombre FROM public.ejercicios WHERE id = $1 LIMIT 1', ejercicio_id
      )
      nombreFinal = eRows[0]?.nombre ?? null
    }

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE public.rutina_template_ejercicios SET
         ejercicio_id = COALESCE($1, ejercicio_id),
         nombre = COALESCE($2, nombre),
         series = COALESCE($3, series),
         repeticiones = COALESCE($4, repeticiones),
         peso_sugerido = COALESCE($5, peso_sugerido),
         dia = COALESCE($6, dia),
         notas = COALESCE($7, notas),
         orden = COALESCE($8, orden)
       WHERE id = $9 AND template_id = $10
       RETURNING id, template_id, ejercicio_id, nombre, series, repeticiones, peso_sugerido, dia, notas, orden`,
      ejercicio_id ?? null,
      nombreFinal,
      series ?? null,
      repeticiones ?? null,
      peso_sugerido ?? null,
      dia ?? null,
      notas ?? null,
      orden ?? null,
      params.eid,
      params.id,
    )

    const updated = rows[0]
    if (!updated) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('PUT /api/rutina-templates/[id]/ejercicios/[eid] error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; eid: string } }
) {
  try {
    await ensureTables()
    const rows = await prisma.$queryRawUnsafe<any[]>(
      'DELETE FROM public.rutina_template_ejercicios WHERE id = $1 AND template_id = $2 RETURNING id',
      params.eid,
      params.id,
    )
    if (!rows[0]) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/rutina-templates/[id]/ejercicios/[eid] error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}