import 'server-only';
import { cache } from 'react';
import { prisma } from '@/lib/prisma';

/**
 * Obtener estadísticas del dashboard
 */
export const getDashboardStats = cache(async () => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const [
        totalClientes,
        asistenciasHoy,
        clientesActivos,
        aforoActual
    ] = await Promise.all([
        // Total de clientes
        prisma.clientes.count(),

        // Asistencias de hoy
        prisma.asistencias.count({
            where: {
                hora_entrada: {
                    gte: hoy
                }
            }
        }),

        // Clientes con membresía activa
        prisma.clientes.count({
            where: {
                estado: 'activa',
                fecha_fin: {
                    gte: new Date()
                }
            }
        }),

        // Aforo actual (personas en el gimnasio)
        prisma.asistencias.count({
            where: {
                hora_salida: null
            }
        })
    ]);

    return {
        totalClientes,
        asistenciasHoy,
        clientesActivos,
        aforoActual,
        clasesHoy: 0, // Si no tienes sistema de clases aún
        ingresosHoy: 0 // Si no tienes pagos del día implementados
    };
});

/**
 * Obtener asistencias semanales para el gráfico
 */
export const getAsistenciasSemanales = cache(async () => {
    const hoy = new Date();
    const hace7Dias = new Date(hoy);
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    hace7Dias.setHours(0, 0, 0, 0);

    const asistencias = await prisma.asistencias.findMany({
        where: {
            hora_entrada: {
                gte: hace7Dias
            }
        },
        select: {
            hora_entrada: true
        }
    });

    // Agrupar por día
    const porDia: Record<string, number> = {};
    asistencias.forEach(a => {
        const fecha = new Date(a.hora_entrada);
        const dia = fecha.toLocaleDateString('es-ES', { weekday: 'short' });
        porDia[dia] = (porDia[dia] || 0) + 1;
    });

    return porDia;
});

/**
 * Obtener clientes con membresías próximas a vencer
 */
export const getClientesProximosVencer = cache(async () => {
    const hoy = new Date();
    const en7Dias = new Date(hoy);
    en7Dias.setDate(en7Dias.getDate() + 7);

    return await prisma.clientes.findMany({
        where: {
            estado: 'activa',
            fecha_fin: {
                gte: hoy,
                lte: en7Dias
            }
        },
        select: {
            id: true,
            nombre: true,
            fecha_fin: true,
            avatar_url: true
        },
        orderBy: {
            fecha_fin: 'asc'
        },
        take: 5
    });
});

/**
 * Preload patterns
 */
export const preloadDashboardStats = () => {
    void getDashboardStats();
};

export const preloadAsistenciasSemanales = () => {
    void getAsistenciasSemanales();
};

export const preloadClientesProximosVencer = () => {
    void getClientesProximosVencer();
};
