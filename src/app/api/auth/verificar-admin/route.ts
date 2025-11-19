import { NextResponse } from 'next/server';
import { verificarAdminExiste } from '@/lib/auth-admin';

export async function GET() {
    try {
        const existeAdmin = await verificarAdminExiste();
        return NextResponse.json({ existeAdmin });
    } catch (error) {
        console.error('Error en verificación de admin:', error);
        return NextResponse.json({ existeAdmin: false }, { status: 500 });
    }
}
