import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateMembresiaSchema } from '@/lib/validations/membresia-schemas';

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

        const parsed = updateMembresiaSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Datos inválidos', details: parsed.error.flatten() },
                { status: 400 }
            );
        }
        const data = parsed.data;

        const membresia = await prisma.membresias.update({
            where: { id: params.id },
            data: {
                ...(data.nombre !== undefined && { nombre: data.nombre }),
                ...(data.descripcion !== undefined && { descripcion: data.descripcion }),
                ...(data.tipo !== undefined && { tipo: data.tipo }),
                ...(data.modalidad !== undefined && { modalidad: data.modalidad }),
                ...(data.precio !== undefined && { precio: data.precio }),
                ...(data.duracion !== undefined && { duracion: data.duracion }),
                ...(data.caracteristicas !== undefined && { caracteristicas: data.caracteristicas }),
                ...(data.activa !== undefined && { activa: data.activa }),
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
            { error: 'Error al actualizar la membresía', message: error?.message },
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
