import { NextResponse } from 'next/server';
import { crearPrimerAdmin } from '@/lib/auth-admin';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password, nombre } = body;

        // Validar datos
        if (!email || !password || password.length < 6) {
            return NextResponse.json(
                { error: 'Email y contraseña (mínimo 6 caracteres) son requeridos' },
                { status: 400 }
            );
        }

        const resultado = await crearPrimerAdmin({
            email,
            password,
            nombre: nombre || 'Administrador',
        });

        if (!resultado.success) {
            return NextResponse.json(
                { error: resultado.error },
                { status: resultado.error?.includes('Ya existe') ? 403 : 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Usuario administrador creado exitosamente',
            user: {
                id: resultado.userId
            }
        });

    } catch (error: any) {
        console.error('Error en registro de admin:', error);
        return NextResponse.json(
            { error: error?.message || 'Error al crear usuario administrador' },
            { status: 500 }
        );
    }
}
