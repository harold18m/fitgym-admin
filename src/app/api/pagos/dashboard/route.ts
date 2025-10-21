import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const today = new Date()
    const threeDaysAhead = new Date()
    threeDaysAhead.setDate(threeDaysAhead.getDate() + 3)

    const [activos, porVencer, vencidos] = await Promise.all([
      prisma.clientes.findMany({
        where: {
          estado: 'activa',
          OR: [
            { fecha_fin: { gte: today } },
            { fecha_fin: null },
          ],
        },
        select: { id: true, nombre: true, avatar_url: true, fecha_fin: true, nombre_membresia: true },
        orderBy: { nombre: 'asc' },
        take: 50,
      }),
      prisma.clientes.findMany({
        where: {
          estado: 'activa',
          fecha_fin: { gte: today, lte: threeDaysAhead },
        },
        select: { id: true, nombre: true, avatar_url: true, fecha_fin: true, nombre_membresia: true },
        orderBy: { fecha_fin: 'asc' },
        take: 50,
      }),
      prisma.clientes.findMany({
        where: {
          OR: [
            { estado: 'vencida' },
            { fecha_fin: { lt: today } },
          ],
        },
        select: { id: true, nombre: true, avatar_url: true, fecha_fin: true, nombre_membresia: true },
        orderBy: { nombre: 'asc' },
        take: 50,
      }),
    ])

    return NextResponse.json({ activos, porVencer, vencidos })
  } catch (err) {
    console.error('GET /api/pagos/dashboard error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}