import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tresDiasDespues = new Date(today);
        tresDiasDespues.setDate(today.getDate() + 3);
        tresDiasDespues.setHours(23, 59, 59, 999);

        // Clientes activos (fecha_fin > hoy + 3 días O sin fecha_fin)
        const activos = await prisma.clientes.findMany({
            where: {
                OR: [
                    {
                        fecha_fin: {
                            gt: tresDiasDespues,
                        },
                    },
                    {
                        fecha_fin: null,
                    },
                ],
                estado: {
                    not: 'suspendida',
                },
            },
            select: {
                id: true,
                nombre: true,
                avatar_url: true,
                fecha_fin: true,
                nombre_membresia: true,
            },
            orderBy: {
                fecha_fin: 'asc',
            },
            take: 10,
        });

        // Clientes por vencer (fecha_fin entre hoy y hoy + 3 días)
        const porVencer = await prisma.clientes.findMany({
            where: {
                fecha_fin: {
                    gte: today,
                    lte: tresDiasDespues,
                },
                estado: {
                    not: 'suspendida',
                },
            },
            select: {
                id: true,
                nombre: true,
                avatar_url: true,
                fecha_fin: true,
                nombre_membresia: true,
            },
            orderBy: {
                fecha_fin: 'asc',
            },
            take: 10,
        });

        // Clientes vencidos (fecha_fin < hoy)
        const vencidos = await prisma.clientes.findMany({
            where: {
                fecha_fin: {
                    lt: today,
                },
            },
            select: {
                id: true,
                nombre: true,
                avatar_url: true,
                fecha_fin: true,
                nombre_membresia: true,
            },
            orderBy: {
                fecha_fin: 'desc',
            },
            take: 10,
        });

        return NextResponse.json({
            activos,
            porVencer,
            vencidos,
        });
    } catch (error: any) {
        console.error('Error obteniendo estado de pagos:', error);
        return NextResponse.json(
            { error: 'Error al obtener estado de pagos', details: error.message },
            { status: 500 }
        );
    }
}
