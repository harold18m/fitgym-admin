// API Route: /api/clientes/[id]/password/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import prisma from '@/lib/prisma';

/**
 * PUT - Actualizar contraseña de un usuario cliente
 * Body: { newPassword: string }
 */
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { newPassword } = body;

        if (!newPassword || newPassword.trim().length < 6) {
            return NextResponse.json(
                { error: 'La contraseña debe tener al menos 6 caracteres' },
                { status: 400 }
            );
        }

        // Obtener el cliente para verificar que existe
        const cliente = await prisma.clientes.findUnique({
            where: {
                id: params.id,
                deleted_at: null
            },
            select: { id: true, email: true, dni: true }
        });

        if (!cliente) {
            return NextResponse.json(
                { error: 'Cliente no encontrado' },
                { status: 404 }
            );
        }

        if (!cliente.email) {
            return NextResponse.json(
                { error: 'El cliente no tiene email registrado' },
                { status: 400 }
            );
        }

        // Buscar el usuario en Supabase Auth por EMAIL
        // (Los IDs de Prisma no coinciden con los de Supabase Auth)
        const { data: { users }, error: searchError } = await supabaseAdmin.auth.admin.listUsers();

        if (searchError || !users || users.length === 0) {
            console.warn(`Usuario no encontrado en Supabase Auth para email: ${cliente.email}`);
            return NextResponse.json(
                {
                    error: 'Este cliente no tiene una cuenta de acceso creada. Debe crear una nueva cuenta primero.',
                    code: 'USER_NOT_IN_AUTH'
                },
                { status: 400 }
            );
        }

        // Buscar el usuario por email
        const supabaseUser = (users as any[]).find((u: any) => u.email === cliente.email);

        if (!supabaseUser) {
            console.warn(`Usuario no encontrado en Supabase Auth para email: ${cliente.email}`);
            return NextResponse.json(
                {
                    error: 'Este cliente no tiene una cuenta de acceso creada. Debe crear una nueva cuenta primero.',
                    code: 'USER_NOT_IN_AUTH'
                },
                { status: 400 }
            );
        }

        // Actualizar contraseña en Supabase Auth usando el ID del usuario de Supabase
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
            supabaseUser.id,
            { password: newPassword }
        );

        if (error) {
            console.error('Error actualizando contraseña en Supabase:', error);
            return NextResponse.json(
                { error: `Error al actualizar contraseña: ${error.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Contraseña actualizada correctamente',
            email: cliente.email
        });

    } catch (error) {
        console.error('Error al actualizar contraseña:', error);
        return NextResponse.json(
            { error: 'Error al actualizar contraseña' },
            { status: 500 }
        );
    }
}
