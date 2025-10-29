import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

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

        // Obtener clientes con membresías que vencen en los próximos N días
        const clientes = await prisma.clientes.findMany({
            where: {
                AND: [
                    {
                        fecha_fin: {
                            gte: today, // Mayor o igual a hoy (no vencida)
                            lte: futureDate, // Menor o igual a la fecha futura
                        },
                    },
                    {
                        membresia_id: {
                            not: null,
                        },
                    },
                ],
            },
            orderBy: {
                fecha_fin: 'asc',
            },
        });

        // Formatear los datos para incluir días restantes y nombre de membresía
        const expiringMemberships = await Promise.all(
            clientes.map(async (cliente) => {
                const fechaFin = cliente.fecha_fin ? new Date(cliente.fecha_fin) : null;
                const daysRemaining = fechaFin
                    ? Math.ceil((fechaFin.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                    : 0;

                // Obtener nombre de membresía
                let nombreMembresia = 'Sin membresía';
                if (cliente.membresia_id) {
                    const membresia = await prisma.membresias.findUnique({
                        where: { id: cliente.membresia_id },
                        select: { nombre: true },
                    });
                    nombreMembresia = membresia?.nombre || 'Sin membresía';
                }

                return {
                    id: cliente.id,
                    nombre: cliente.nombre,
                    email: cliente.email,
                    telefono: cliente.telefono,
                    fecha_fin: cliente.fecha_fin?.toISOString() || '',
                    days_remaining: daysRemaining,
                    nombre_membresia: nombreMembresia,
                };
            })
        );

        return NextResponse.json(expiringMemberships);
    } catch (error) {
        console.error('Error al obtener membresías próximas a vencer:', error);
        return NextResponse.json(
            { error: 'Error al obtener las membresías próximas a vencer' },
            { status: 500 }
        );
    }
}
