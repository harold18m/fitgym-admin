import 'server-only';
import { cache } from 'react';
import { prisma } from '@/lib/prisma';

/**
 * Obtener asistencias recientes con información del cliente
 */
export const getAsistenciasRecientes = cache(async (limit: number = 100) => {
    return await prisma.asistencias.findMany({
        take: limit,
        include: {
            clientes: {
                select: {
                    id: true,
                    nombre: true,
                    dni: true,
                    email: true,
                    avatar_url: true,
                    estado: true
                }
            }
        },
        orderBy: {
            hora_entrada: 'desc'
        }
    });
});

/**
 * Obtener asistencias del día actual
 */
export const getAsistenciasHoy = cache(async () => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return await prisma.asistencias.findMany({
        where: {
            hora_entrada: {
                gte: hoy
            }
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
            hora_entrada: 'desc'
        }
    });
});

/**
 * Obtener estadísticas de asistencias
 */
export const getEstadisticasAsistencias = cache(async () => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const [totalHoy, promedioSemanal, aforoActual] = await Promise.all([
        // Total de asistencias hoy
        prisma.asistencias.count({
            where: {
                hora_entrada: {
                    gte: hoy
                }
            }
        }),

        // Promedio de última semana
        prisma.asistencias.count({
            where: {
                hora_entrada: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
            }
        }).then(total => Math.round(total / 7)),

        // Aforo actual (personas sin salida)
        prisma.asistencias.count({
            where: {
                hora_salida: null
            }
        })
    ]);

    return {
        totalHoy,
        promedioSemanal,
        aforoActual
    };
});

/**
 * Preload patterns
 */
export const preloadAsistenciasRecientes = () => {
    void getAsistenciasRecientes();
};

export const preloadAsistenciasHoy = () => {
    void getAsistenciasHoy();
};

export const preloadEstadisticasAsistencias = () => {
    void getEstadisticasAsistencias();
};
