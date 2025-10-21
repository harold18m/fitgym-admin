import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cliente = await prisma.clientes.findUnique({
      where: { id: params.id },
      include: { membresia: true },
    })
    if (!cliente) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json(cliente)
  } catch (err) {
    console.error('GET /api/clientes/[id] error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const data: any = {}
    const fields = [
      'nombre',
      'email',
      'telefono',
      'dni',
      'fecha_nacimiento',
      'membresia_id',
      'nombre_membresia',
      'tipo_membresia',
      // 'fecha_inicio', // eliminado: no existe en el modelo Prisma
      'fecha_fin',
      'estado',
      'avatar_url',
    ]
    for (const f of fields) {
      if (body[f] !== undefined) {
        if (f.includes('fecha')) data[f] = body[f] ? new Date(body[f]) : null
        else data[f] = body[f]
      }
    }

    const updated = await prisma.clientes.update({
      where: { id: params.id },
      data,
      include: { membresia: true },
    })
    return NextResponse.json(updated)
  } catch (err: any) {
    console.error('PUT /api/clientes/[id] error', err)
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'Email o DNI en uso' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.clientes.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('DELETE /api/clientes/[id] error', err)
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}