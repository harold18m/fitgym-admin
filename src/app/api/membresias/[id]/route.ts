import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// GET - Obtener una membresía por ID
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const membresia = await prisma.membresias.findUnique({
            where: { id: params.id },
        });

        if (!membresia) {
            return NextResponse.json(
                { error: 'Membresía no encontrada' },
                { status: 404 }
            );
        }

        return NextResponse.json(membresia);
    } catch (error) {
        console.error('Error al obtener membresía:', error);
        return NextResponse.json(
            { error: 'Error al obtener la membresía' },
            { status: 500 }
        );
    }
}

// PUT - Actualizar una membresía
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();

        const membresia = await prisma.membresias.update({
            where: { id: params.id },
            data: {
                ...(body.nombre !== undefined && { nombre: body.nombre }),
                ...(body.descripcion !== undefined && { descripcion: body.descripcion }),
                ...(body.tipo !== undefined && { tipo: body.tipo }),
                ...(body.modalidad !== undefined && { modalidad: body.modalidad }),
                ...(body.precio !== undefined && { precio: body.precio }),
                ...(body.duracion !== undefined && { duracion: body.duracion }),
                ...(body.caracteristicas !== undefined && { caracteristicas: body.caracteristicas }),
                ...(body.activa !== undefined && { activa: body.activa }),
            },
        });

        return NextResponse.json(membresia);
    } catch (error: any) {
        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Membresía no encontrada' },
                { status: 404 }
            );
        }
        console.error('Error al actualizar membresía:', error);
        return NextResponse.json(
            { error: 'Error al actualizar la membresía' },
            { status: 500 }
        );
    }
}

// DELETE - Eliminar una membresía
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.membresias.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Membresía no encontrada' },
                { status: 404 }
            );
        }
        console.error('Error al eliminar membresía:', error);
        return NextResponse.json(
            { error: 'Error al eliminar la membresía' },
            { status: 500 }
        );
    }
}
