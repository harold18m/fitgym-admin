import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';

export async function GET() {
    try {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        // Contar total de clientes
        const totalClientes = await prisma.clientes.count();

        // Contar asistencias de hoy
        const asistenciasHoy = await prisma.asistencias.count({
            where: {
                fecha_asistencia: {
                    gte: start,
                    lt: end,
                },
            },
        });

        // Contar clases de hoy
        const clasesHoy = await prisma.eventos.count({
            where: {
                tipo: 'clase',
                fecha: new Date(todayStr),
            },
        });

        // Calcular ingresos de hoy (eventos no cancelados)
        const eventosHoy = await prisma.eventos.findMany({
            where: {
                fecha: new Date(todayStr),
                estado: {
                    not: 'cancelado',
                },
            },
            select: {
                precio: true,
            },
        });

        const ingresosHoy = eventosHoy.reduce((sum, evento) => {
            return sum + (evento.precio ? Number(evento.precio) : 0);
        }, 0);

        return NextResponse.json({
            totalClientes,
            asistenciasHoy,
            clasesHoy,
            ingresosHoy,
        });
    } catch (error: any) {
        console.error('Error obteniendo estadísticas del dashboard:', error);
        return NextResponse.json(
            { error: 'Error al obtener estadísticas', details: error.message },
            { status: 500 }
        );
    }
}
