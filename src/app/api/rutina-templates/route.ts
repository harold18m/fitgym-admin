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

export async function GET(req: Request) {
  try {
    await ensureTables()
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')

    let query = 'SELECT id, nombre, descripcion, created_at, updated_at FROM public.rutina_templates'
    const params: any[] = []
    if (q) {
      query += ' WHERE nombre ILIKE $1'
      params.push(`%${q}%`)
    }
    query += ' ORDER BY updated_at DESC NULLS LAST, created_at DESC'

    const templates = await prisma.$queryRawUnsafe<any[]>(query, ...params)
    return NextResponse.json({ templates })
  } catch (err) {
    console.error('GET /api/rutina-templates error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await ensureTables()
    const body = await req.json()
    const { nombre, descripcion } = body
    if (!nombre) return NextResponse.json({ error: 'nombre es requerido' }, { status: 400 })

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO public.rutina_templates (nombre, descripcion, updated_at)
       VALUES ($1, $2, now())
       RETURNING id, nombre, descripcion, created_at, updated_at`,
      nombre,
      descripcion ?? null,
    )

    return NextResponse.json(rows[0], { status: 201 })
  } catch (err) {
    console.error('POST /api/rutina-templates error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}