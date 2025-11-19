import 'server-only';
import { cache } from 'react';
import { prisma } from '@/lib/prisma';

/**
 * Obtener todas las membresías (serializado para Client Components)
 */
export const getMembresias = cache(async () => {
    const membresias = await prisma.membresias.findMany({
        orderBy: [
            { activa: 'desc' },
            { tipo: 'asc' },
            { nombre: 'asc' }
        ]
    });

    // Serializar Decimal a number para evitar warning en Client Components
    return membresias.map(m => ({
        ...m,
        precio: m.precio.toNumber(),
        duracion: m.duracion || undefined
    }));
});

/**
 * Obtener membresías activas (serializado para Client Components)
 */
export const getMembresiasActivas = cache(async () => {
    const membresias = await prisma.membresias.findMany({
        where: { activa: true },
        orderBy: [
            { tipo: 'asc' },
            { nombre: 'asc' }
        ]
    });

    return membresias.map(m => ({
        ...m,
        precio: m.precio.toNumber(),
        duracion: m.duracion || undefined
    }));
});

/**
 * Obtener membresías por tipo (serializado para Client Components)
 */
export const getMembresiasPorTipo = cache(async (tipo: 'mensual' | 'trimestral') => {
    const membresias = await prisma.membresias.findMany({
        where: { tipo },
        orderBy: { nombre: 'asc' }
    });

    return membresias.map(m => ({
        ...m,
        precio: m.precio.toNumber(),
        duracion: m.duracion || undefined
    }));
});

/**
 * Obtener una membresía por ID (serializado para Client Components)
 */
export const getMembresiaById = cache(async (id: string) => {
    const membresia = await prisma.membresias.findUnique({
        where: { id }
    });

    if (!membresia) return null;

    return {
        ...membresia,
        precio: membresia.precio.toNumber(),
        duracion: membresia.duracion || undefined
    };
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
