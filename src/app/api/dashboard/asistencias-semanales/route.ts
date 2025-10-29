import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const now = new Date();
        const monday = new Date(now);
        const day = monday.getDay(); // 0=Dom, 1=Lun, ... 6=Sáb
        const diffToMonday = (day + 6) % 7; // convierte getDay a índice Lunes=0
        monday.setDate(monday.getDate() - diffToMonday);
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        const asistencias = await prisma.asistencias.findMany({
            where: {
                fecha_asistencia: {
                    gte: monday,
                    lte: sunday,
                },
            },
            select: {
                id: true,
                fecha_asistencia: true,
            },
        });

        // Contar asistencias por día de la semana
        const counts = Array(7).fill(0);
        for (const asistencia of asistencias) {
            const d = new Date(asistencia.fecha_asistencia);
            const idx = (d.getDay() + 6) % 7; // Lunes=0 ... Domingo=6
            counts[idx] += 1;
        }

        const labels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
        const data = labels.map((name, i) => ({
            name,
            asistencias: counts[i]
        }));

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error obteniendo asistencias semanales:', error);
        return NextResponse.json(
            { error: 'Error al obtener asistencias semanales', details: error.message },
            { status: 500 }
        );
    }
}
