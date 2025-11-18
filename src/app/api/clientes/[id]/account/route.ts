import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/clientes/[id]/account -> { exists: boolean }
export async function GET(
    _req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const cliente = await prisma.clientes.findUnique({
            where: { id: params.id, deleted_at: null },
            select: { email: true }
        });

        if (!cliente) {
            return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
        }
        if (!cliente.email) {
            return NextResponse.json({ exists: false });
        }

        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        const exists = Array.isArray(users) && users.some(u => (u as any).email === cliente.email);
        return NextResponse.json({ exists });
    } catch (err) {
        console.error('Error comprobando cuenta de cliente:', err);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

// POST /api/clientes/[id]/account -> crea cuenta con password
// body: { password?: string }
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json().catch(() => ({}));
        const rawPassword: string | undefined = body?.password;

        const cliente = await prisma.clientes.findUnique({
            where: { id: params.id, deleted_at: null },
            select: { id: true, nombre: true, email: true, dni: true, avatar_url: true }
        });

        if (!cliente) {
            return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
        }
        if (!cliente.email) {
            return NextResponse.json({ error: 'El cliente no tiene email válido' }, { status: 400 });
        }

        // Chequear si ya existe
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) {
            return NextResponse.json({ error: listError.message }, { status: 500 });
        }
        const alreadyExists = Array.isArray(users) && users.some(u => (u as any).email === cliente.email);
        if (alreadyExists) {
            return NextResponse.json({ error: 'La cuenta ya existe' }, { status: 409 });
        }

        // Password por defecto = DNI, debe tener mínimo 6
        const password = (rawPassword && String(rawPassword).trim()) || (cliente.dni ? String(cliente.dni) : '123456');
        if (!password || password.length < 6) {
            return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
        }

        const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: cliente.email,
            email_confirm: true,
            password,
            user_metadata: {
                nombre: cliente.nombre,
                cliente_id: cliente.id,
            },
        });

        if (createError) {
            return NextResponse.json({ error: `No se pudo crear la cuenta: ${createError.message}` }, { status: 500 });
        }

        const userId = created.user?.id;
        if (!userId) {
            return NextResponse.json({ error: 'Usuario creado sin ID' }, { status: 500 });
        }

        // Crear/actualizar perfil
        const { error: perfilError } = await supabaseAdmin
            .from('perfiles')
            .upsert({
                user_id: userId,
                email: cliente.email,
                nombre_completo: cliente.nombre,
                avatar_url: cliente.avatar_url ?? null,
            });
        if (perfilError) {
            return NextResponse.json({ error: `Perfil no pudo crearse: ${perfilError.message}` }, { status: 500 });
        }

        return NextResponse.json({ ok: true, userId });
    } catch (err) {
        console.error('Error creando cuenta de cliente:', err);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
