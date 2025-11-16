import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRutinaTemplateSchema } from '@/lib/validations/rutina-schemas';

export const runtime = 'nodejs';

// GET - Obtener todas las plantillas de rutinas
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q');

        const where = q
            ? {
                OR: [
                    { nombre: { contains: q, mode: 'insensitive' as const } },
                    { descripcion: { contains: q, mode: 'insensitive' as const } },
                ],
            }
            : {};

        const templates = await prisma.rutina_templates.findMany({
            where,
            orderBy: {
                created_at: 'desc',
            },
        });

        return NextResponse.json({ templates });
    } catch (error) {
        console.error('Error al obtener plantillas de rutinas:', error);
        return NextResponse.json(
            { error: 'Error al obtener las plantillas de rutinas' },
            { status: 500 }
        );
    }
}

// POST - Crear nueva plantilla de rutina
export async function POST(request: Request) {
    try {
        const body = await request.json();

        const parsed = createRutinaTemplateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Datos inválidos', details: parsed.error.flatten() },
                { status: 400 }
            );
        }
        const data = parsed.data;

        const template = await prisma.rutina_templates.create({
            data: {
                id: crypto.randomUUID(),
                nombre: data.nombre,
                descripcion: data.descripcion ?? null,
                creado_por: data.creado_por ?? null,
                updated_at: new Date(),
            },
        });

        return NextResponse.json(template, { status: 201 });
    } catch (error) {
        console.error('Error al crear plantilla de rutina:', error);
        return NextResponse.json(
            { error: 'Error al crear la plantilla de rutina' },
            { status: 500 }
        );
    }
}
