import 'server-only';
import { cache } from 'react';
import { prisma } from '@/lib/prisma';

/**
 * Obtener todas las membresías
 */
export const getMembresias = cache(async () => {
    return await prisma.membresias.findMany({
        orderBy: [
            { activa: 'desc' },
            { tipo: 'asc' },
            { nombre: 'asc' }
        ]
    });
});

/**
 * Obtener membresías activas
 */
export const getMembresiasActivas = cache(async () => {
    return await prisma.membresias.findMany({
        where: { activa: true },
        orderBy: [
            { tipo: 'asc' },
            { nombre: 'asc' }
        ]
    });
});

/**
 * Obtener membresías por tipo
 */
export const getMembresiasPorTipo = cache(async (tipo: 'mensual' | 'trimestral') => {
    return await prisma.membresias.findMany({
        where: { tipo },
        orderBy: { nombre: 'asc' }
    });
});

/**
 * Obtener una membresía por ID
 */
export const getMembresiaById = cache(async (id: string) => {
    return await prisma.membresias.findUnique({
        where: { id }
    });
});

/**
 * Preload pattern para optimizar navegación
 */
export const preloadMembresias = () => {
    void getMembresias();
};

export const preloadMembresiasActivas = () => {
    void getMembresiasActivas();
};
