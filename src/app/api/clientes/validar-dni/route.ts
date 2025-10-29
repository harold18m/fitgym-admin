import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

type Body = {
  dni?: string
  excludeId?: string | number | null
}

export async function POST(req: Request) {
  try {
    let body: Body = {}
    try {
      body = (await req.json()) as Body
    } catch {
      return NextResponse.json({ ok: false, error: 'Body inválido: se esperaba JSON' }, { status: 400 })
    }

    const dni = (body.dni || '').toString().trim()
    const excludeId = body.excludeId ?? null

    if (!dni) {
      return NextResponse.json({ ok: false, error: 'DNI requerido' }, { status: 400 })
    }

    // Buscar cliente con el mismo DNI, excluyendo el ID si se proporciona
    const where: any = { dni }
    if (excludeId !== null && excludeId !== undefined) {
      where.id = { not: String(excludeId) }
    }

    const existingCliente = await prisma.clientes.findFirst({
      where,
      select: { id: true }
    })

    const exists = !!existingCliente

    return NextResponse.json({ ok: true, exists })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'Error inesperado' }, { status: 500 })
  }
}