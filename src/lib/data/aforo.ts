import 'server-only';
import { cache } from 'react';
import { prisma } from '@/lib/prisma';

/**
 * Obtener asistencias pendientes (sin hora de salida)
 */
export const getAsistenciasPendientes = cache(async () => {
    const asistencias = await prisma.asistencias.findMany({
        where: {
            hora_salida: null
        },
        include: {
            clientes: {
                select: {
                    id: true,
                    nombre: true,
                    dni: true,
                    avatar_url: true,
                    estado: true
                }
            }
        },
        orderBy: {
            hora_entrada: 'asc'
        }
    });

    // Calcular tiempo transcurrido
    return asistencias.map(asistencia => {
        const tiempoTranscurrido = Math.floor(
            (Date.now() - new Date(asistencia.hora_entrada).getTime()) / (1000 * 60)
        );
        return {
            ...asistencia,
            tiempoTranscurrido
        };
    });
});

/**
 * Obtener aforo actual (cuenta de asistencias activas)
 */
export const getAforoActual = cache(async () => {
    return await prisma.asistencias.count({
        where: {
            hora_salida: null
        }
    });
});

/**
 * Preload pattern
 */
export const preloadAsistenciasPendientes = () => {
    void getAsistenciasPendientes();
};

export const preloadAforoActual = () => {
    void getAforoActual();
};
