import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createMembresiaSchema } from '@/lib/validations/membresia-schemas';

export const runtime = 'nodejs';

// GET - Obtener todas las membresías
export async function GET() {
    try {
        // Obtener todas las membresías
        const membresias = await prisma.membresias.findMany({
            orderBy: {
                created_at: 'desc',
            },
        });

        // Calcular cantidad de clientes activos por membresía (estado != 'suspendida' y con membresia asignada)
        const counts = await prisma.clientes.groupBy({
            by: ['membresia_id'],
            _count: {
                id: true,
            },
            where: {
                membresia_id: { not: null },
                estado: { not: 'suspendida' },
            },
        });

        const mapCounts: Record<string, number> = {};
        counts.forEach(c => {
            if (c.membresia_id) mapCounts[c.membresia_id] = c._count.id;
        });

        // Aplanar el campo `clientes_activos` usando el conteo calculado (fallback 0)
        const membresiasWithCounts = membresias.map(m => ({
            ...m,
            clientes_activos: mapCounts[m.id] ?? 0,
        }));

        return NextResponse.json(membresiasWithCounts);
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

        const parsed = createMembresiaSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Datos inválidos', details: parsed.error.flatten() },
                { status: 400 }
            );
        }
        const data = parsed.data;

        const membresia = await prisma.membresias.create({
            data: {
                nombre: data.nombre,
                descripcion: data.descripcion ?? null,
                tipo: data.tipo,
                modalidad: data.modalidad,
                precio: data.precio,
                duracion: data.duracion,
                caracteristicas: data.caracteristicas,
                activa: data.activa,
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
