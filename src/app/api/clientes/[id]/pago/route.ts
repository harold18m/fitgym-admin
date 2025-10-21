import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Registrar pago y extender membresía automáticamente
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}))
    const overrideMembresiaId: string | undefined = body?.membresia_id

    // Obtener cliente actual
    const cliente = await prisma.clientes.findUnique({ where: { id: params.id } })
    if (!cliente) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })

    // Determinar membresía a usar
    const membresiaId = overrideMembresiaId ?? cliente.membresia_id
    if (!membresiaId) {
      return NextResponse.json({ error: 'El cliente no tiene membresía asignada' }, { status: 400 })
    }

    const m = await prisma.membresias.findUnique({ where: { id: membresiaId } })
    if (!m) return NextResponse.json({ error: 'Membresía no encontrada' }, { status: 404 })

    const duracionMeses = m.duracion || 1

    // Calcular nueva fecha fin: desde hoy si vencida, desde fecha_fin si aún activa
    const hoy = new Date()
    const base = cliente.fecha_fin && cliente.fecha_fin > hoy ? cliente.fecha_fin : hoy
    const nuevaFin = new Date(base)
    nuevaFin.setMonth(nuevaFin.getMonth() + duracionMeses)

    const updated = await prisma.clientes.update({
      where: { id: cliente.id },
      data: {
        membresia_id: membresiaId,
        nombre_membresia: m.nombre,
        tipo_membresia: m.tipo,
        fecha_fin: nuevaFin,
        estado: 'activa',
        updated_at: new Date(),
      },
    })

    return NextResponse.json({ ok: true, cliente: updated, nueva_fin: nuevaFin.toISOString() })
  } catch (err) {
    console.error('POST /api/clientes/[id]/pago error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}