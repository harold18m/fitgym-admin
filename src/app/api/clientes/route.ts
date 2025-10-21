import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim()

    const clientes = await prisma.clientes.findMany({
      where: q
        ? {
            OR: [
              { nombre: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { telefono: { contains: q, mode: 'insensitive' } },
              { dni: { contains: q, mode: 'insensitive' } },
            ],
          }
        : undefined,
      take: 50,
      orderBy: { created_at: 'desc' },
      include: { membresia: true },
    })

    return NextResponse.json(clientes)
  } catch (err) {
    console.error('GET /api/clientes error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      nombre,
      email,
      telefono,
      dni,
      fecha_nacimiento,
      avatar_url,
      membresia_id,
    } = body

    if (!nombre || !email || !telefono || !fecha_nacimiento) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    // Preparar datos base del cliente
    const data: any = {
      nombre,
      email,
      telefono,
      dni,
      fecha_nacimiento: new Date(fecha_nacimiento),
      avatar_url: avatar_url ?? null,
    }

    // Si se proporciona membresía, completar metadatos y fechas
    if (membresia_id) {
      const m = await prisma.membresias.findUnique({ where: { id: membresia_id } })
      if (!m) return NextResponse.json({ error: 'Membresía no encontrada' }, { status: 404 })

      // Calcular fecha de fin sumando meses de duración desde hoy
      const hoy = new Date()
      const fecha_fin = new Date(hoy)
      fecha_fin.setMonth(fecha_fin.getMonth() + (m.duracion || 1))

      data.membresia_id = membresia_id
      data.nombre_membresia = m.nombre
      data.tipo_membresia = m.tipo
      data.fecha_fin = fecha_fin
      data.estado = 'activa'
    }

    const cliente = await prisma.clientes.create({
      data,
      include: { membresia: true },
    })

    return NextResponse.json(cliente, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/clientes error', err)
    if (err?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email o DNI ya existe' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}