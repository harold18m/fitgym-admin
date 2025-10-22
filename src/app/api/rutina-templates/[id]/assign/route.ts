import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { cliente_id, fecha_inicio, fecha_fin } = body
    if (!cliente_id) return NextResponse.json({ error: 'cliente_id es requerido' }, { status: 400 })

    // Obtener plantilla
    const tRows = await prisma.$queryRawUnsafe<any[]>(
      'SELECT id, nombre, descripcion FROM public.rutina_templates WHERE id = $1 LIMIT 1',
      params.id,
    )
    const template = tRows[0]
    if (!template) return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 })

    // Crear rutina para el cliente
    const rutinaRows = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO public.rutinas (cliente_id, nombre, descripcion, estado, fecha_inicio, fecha_fin)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, cliente_id, nombre, descripcion, estado, fecha_inicio, fecha_fin, created_at, updated_at`,
      cliente_id,
      template.nombre,
      template.descripcion ?? null,
      'activa',
      fecha_inicio ? new Date(fecha_inicio) : new Date(),
      fecha_fin ? new Date(fecha_fin) : null,
    )
    const rutina = rutinaRows[0]

    // Obtener ejercicios de plantilla
    const eRows = await prisma.$queryRawUnsafe<any[]>(
      'SELECT id, ejercicio_id, nombre, series, repeticiones, peso_sugerido, dia, notas, orden FROM public.rutina_template_ejercicios WHERE template_id = $1 ORDER BY orden ASC NULLS LAST, id ASC',
      params.id,
    )

    // Insertarlos en rutina_ejercicios
    for (const e of eRows) {
      // Si no hay nombre, intentar resolver desde catálogo
      let nombreFinal = e.nombre ?? null
      if (!nombreFinal && e.ejercicio_id) {
        const cat = await prisma.$queryRawUnsafe<any[]>(
          'SELECT nombre FROM public.ejercicios WHERE id = $1 LIMIT 1', e.ejercicio_id
        )
        nombreFinal = cat[0]?.nombre ?? null
      }

      await prisma.$executeRawUnsafe(
        `INSERT INTO public.rutina_ejercicios (rutina_id, nombre, series, repeticiones, dia, notas, orden)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        rutina.id,
        nombreFinal,
        e.series ?? null,
        e.repeticiones ?? null,
        e.dia ?? null,
        e.notas ?? null,
        e.orden ?? null,
      )
    }

    // Devolver rutina creada con ejercicios
    const rutinaEjercicios = await prisma.$queryRawUnsafe<any[]>(
      'SELECT id, rutina_id, nombre, series, repeticiones, dia, notas, orden FROM public.rutina_ejercicios WHERE rutina_id = $1 ORDER BY orden ASC NULLS LAST, id ASC',
      rutina.id,
    )

    return NextResponse.json({ ...rutina, ejercicios: rutinaEjercicios }, { status: 201 })
  } catch (err) {
    console.error('POST /api/rutina-templates/[id]/assign error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}