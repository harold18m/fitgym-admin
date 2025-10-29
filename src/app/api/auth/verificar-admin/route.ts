import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
    try {
        // Usar el cliente admin para listar usuarios y verificar si alguno tiene rol admin
        const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();

        if (error) {
            console.error('Error listando usuarios:', error);
            return NextResponse.json({ existeAdmin: false }, { status: 500 });
        }

        // Verificar si existe al menos un usuario con rol admin
        const existeAdmin = users.users.some(user => {
            const rol = user.user_metadata?.rol || user.app_metadata?.rol;
            return rol === 'admin';
        });

        return NextResponse.json({ existeAdmin });
    } catch (error) {
        console.error('Error en verificación de admin:', error);
        return NextResponse.json({ existeAdmin: false }, { status: 500 });
    }
}
