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

// Agregar ejercicio a plantilla
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await ensureTables()
    const body = await req.json()
    const { ejercicio_id, nombre, series, repeticiones, peso_sugerido, dia, notas, orden } = body
    if (!ejercicio_id && !nombre) {
      return NextResponse.json({ error: 'ejercicio_id o nombre requerido' }, { status: 400 })
    }

    // Si hay ejercicio_id, intentar coger nombre del catálogo como fallback
    let nombreFinal = nombre ?? null
    if (ejercicio_id && !nombreFinal) {
      const eRows = await prisma.$queryRawUnsafe<any[]>(
        'SELECT nombre FROM public.ejercicios WHERE id = $1 LIMIT 1', ejercicio_id
      )
      nombreFinal = eRows[0]?.nombre ?? null
    }

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO public.rutina_template_ejercicios (template_id, ejercicio_id, nombre, series, repeticiones, peso_sugerido, dia, notas, orden)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, template_id, ejercicio_id, nombre, series, repeticiones, peso_sugerido, dia, notas, orden`,
      params.id,
      ejercicio_id ?? null,
      nombreFinal,
      series ?? null,
      repeticiones ?? null,
      peso_sugerido ?? null,
      dia ?? null,
      notas ?? null,
      orden ?? null,
    )

    return NextResponse.json(rows[0], { status: 201 })
  } catch (err) {
    console.error('POST /api/rutina-templates/[id]/ejercicios error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}