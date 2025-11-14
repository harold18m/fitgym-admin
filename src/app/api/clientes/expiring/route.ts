import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Obtener clientes con membresías próximas a vencer
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const daysParam = searchParams.get('days');
        const daysAhead = daysParam ? parseInt(daysParam) : 7;

        // Calcular fecha límite
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + daysAhead);

        // Obtener clientes con membresías que vencen en los próximos N días (evitar N+1)
        const clientes = await prisma.clientes.findMany({
            where: {
                AND: [
                    {
                        fecha_fin: {
                            gte: today,
                            lte: futureDate,
                        },
                    },
                    {
                        membresia_id: {
                            not: null,
                        },
                    },
                ],
            },
            include: {
                membresias: {
                    select: { nombre: true },
                },
            },
            orderBy: {
                fecha_fin: 'asc',
            },
        });

        const expiringMemberships = clientes.map((cliente) => {
            const fechaFin = cliente.fecha_fin ? new Date(cliente.fecha_fin) : null;
            const daysRemaining = fechaFin
                ? Math.ceil((fechaFin.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                : 0;

            return {
                id: cliente.id,
                nombre: cliente.nombre,
                email: cliente.email,
                telefono: cliente.telefono,
                fecha_fin: cliente.fecha_fin?.toISOString() || '',
                days_remaining: daysRemaining,
                nombre_membresia: cliente.membresias?.nombre || 'Sin membresía',
            };
        });

        return NextResponse.json(expiringMemberships);
    } catch (error) {
        console.error('Error al obtener membresías próximas a vencer:', error);
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return NextResponse.json(
            { error: 'Error al obtener las membresías próximas a vencer', message },
            { status: 500 }
        );
    }
}
