import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// GET - Obtener todas las membresías
export async function GET() {
    try {
        const membresias = await prisma.membresias.findMany({
            orderBy: {
                created_at: 'desc',
            },
        });

        return NextResponse.json(membresias);
    } catch (error) {
        console.error('Error al obtener membresías:', error);
        return NextResponse.json(
            { error: 'Error al obtener las membresías' },
            { status: 500 }
        );
    }
}

// POST - Crear nueva membresía
export async function POST(request: Request) {
    try {
        const body = await request.json();

        const membresia = await prisma.membresias.create({
            data: {
                nombre: body.nombre,
                descripcion: body.descripcion,
                tipo: body.tipo,
                modalidad: body.modalidad,
                precio: body.precio,
                duracion: body.duracion,
                caracteristicas: body.caracteristicas || [],
                activa: body.activa ?? true,
            },
        });

        return NextResponse.json(membresia, { status: 201 });
    } catch (error) {
        console.error('Error al crear membresía:', error);
        return NextResponse.json(
            { error: 'Error al crear la membresía' },
            { status: 500 }
        );
    }
}
