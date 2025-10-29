import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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

        // Verificar que NO exista ningún admin antes de crear uno
        const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();

        if (listError) {
            console.error('Error listando usuarios:', listError);
            return NextResponse.json(
                { error: 'Error verificando usuarios existentes' },
                { status: 500 }
            );
        }

        // Verificar si ya existe un admin
        const existeAdmin = users.users.some(user => {
            const rol = user.user_metadata?.rol || user.app_metadata?.rol;
            return rol === 'admin';
        });

        if (existeAdmin) {
            return NextResponse.json(
                { error: 'Ya existe un usuario administrador en el sistema' },
                { status: 403 }
            );
        }

        // Crear el usuario con rol admin
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirmar el email
            user_metadata: {
                nombre: nombre || 'Administrador',
                rol: 'admin'
            },
            app_metadata: {
                rol: 'admin'
            }
        });

        if (createError) {
            console.error('Error creando usuario admin:', createError);
            return NextResponse.json(
                { error: createError.message || 'Error al crear usuario administrador' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Usuario administrador creado exitosamente',
            user: {
                id: newUser.user.id,
                email: newUser.user.email
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
