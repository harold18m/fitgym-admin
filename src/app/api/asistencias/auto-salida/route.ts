import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/asistencias/auto-salida - Ejecuta el proceso de registro automático de salidas
export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const threshold = body.thresholdMinutes || 90;

        const ahora = new Date();
        const thresholdMs = threshold * 60 * 1000;
        const cutoff = new Date(ahora.getTime() - thresholdMs);

        const pendientes = await prisma.asistencias.findMany({
            where: {
                hora_salida: null,
                hora_entrada: {
                    lte: cutoff
                }
            }
        });

        const updates: any[] = [];

        for (const a of pendientes) {
            try {
                const horaSalida = new Date(a.hora_entrada.getTime() + thresholdMs);
                const duracionMinutos = Math.round((horaSalida.getTime() - a.hora_entrada.getTime()) / (1000 * 60));

                const updated = await prisma.asistencias.update({
                    where: { id: a.id },
                    data: {
                        hora_salida: horaSalida,
                        duracion_minutos: duracionMinutos
                    }
                });

                updates.push(updated);
            } catch (err) {
                console.error('Error actualizando asistencia automática:', a.id, err);
            }
        }

        return NextResponse.json({ success: true, updated: updates.length, detalles: updates.map(u => u.id) });

    } catch (error: any) {
        console.error('Error ejecutando auto-salida:', error);
        return NextResponse.json({ error: 'Error al ejecutar auto-salida', details: error.message }, { status: 500 });
    }
}
