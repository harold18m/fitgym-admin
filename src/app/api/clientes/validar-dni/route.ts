import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'

type Body = {
  dni?: string
  excludeId?: string | number | null
}

export async function POST(req: Request) {
  try {
    // Validación de entorno para evitar fallos que devuelvan HTML
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
      return NextResponse.json(
        { ok: false, error: 'Configura NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local' },
        { status: 500 }
      )
    }

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

    let query = supabaseAdmin
      .from('clientes')
      .select('id')
      .eq('dni', dni)
      .limit(1)

    if (excludeId !== null && excludeId !== undefined) {
      query = query.neq('id', String(excludeId))
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    const exists = !!(data && data.length > 0)
    return NextResponse.json({ ok: true, exists })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'Error inesperado' }, { status: 500 })
  }
}