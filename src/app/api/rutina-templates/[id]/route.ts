import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateRutinaTemplateSchema } from '@/lib/validations/rutina-schemas';

export const runtime = 'nodejs';

// GET - Obtener una plantilla con sus ejercicios
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        const ejercicios = await prisma.rutina_template_ejercicios.findMany({
            where: {
                template_id: id,
            },
            orderBy: [
                { orden: 'asc' },
                { created_at: 'asc' },
            ],
        });

        return NextResponse.json({ ejercicios });
    } catch (error) {
        console.error('Error al obtener ejercicios de plantilla:', error);
        return NextResponse.json(
            { error: 'Error al obtener los ejercicios de la plantilla' },
            { status: 500 }
        );
    }
}

// PUT - Actualizar plantilla
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { id } = params;

        const parsed = updateRutinaTemplateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Datos inválidos', details: parsed.error.flatten() },
                { status: 400 }
            );
        }
        const data = parsed.data;

        const template = await prisma.rutina_templates.update({
            where: { id },
            data: {
                ...(data.nombre !== undefined && { nombre: data.nombre }),
                ...(data.descripcion !== undefined && { descripcion: data.descripcion ?? null }),
                updated_at: new Date(),
            },
        });

        return NextResponse.json(template);
    } catch (error) {
        console.error('Error al actualizar plantilla:', error);
        return NextResponse.json(
            { error: 'Error al actualizar la plantilla' },
            { status: 500 }
        );
    }
}

// DELETE - Eliminar plantilla
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // Eliminar ejercicios de la plantilla primero (cascade debería hacerlo automáticamente)
        await prisma.rutina_templates.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error al eliminar plantilla:', error);
        return NextResponse.json(
            { error: 'Error al eliminar la plantilla' },
            { status: 500 }
        );
    }
}
