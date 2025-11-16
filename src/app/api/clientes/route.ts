// API Route: /api/clientes/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { EstadoCliente } from '@prisma/client';
import { createClienteSchema } from '@/lib/validations/cliente-schemas';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Obtener todos los clientes
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const clientes = await prisma.clientes.findMany({
            include: {
                membresias: {
                    select: {
                        nombre: true,
                        tipo: true,
                        modalidad: true,
                    },
                },
            },
            orderBy: {
                created_at: 'desc',
            },
        });

        return NextResponse.json(clientes);
    } catch (error) {
        logger.error('Error al obtener clientes', { error });
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return NextResponse.json(
            { error: 'Error al obtener clientes', message },
            { status: 500 }
        );
    }
}

// POST - Crear nuevo cliente
export async function POST(request: Request) {
    try {
        const body = await request.json();

        const parsed = createClienteSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Datos inválidos', details: parsed.error.flatten() },
                { status: 400 }
            );
        }
        const data = parsed.data;

        // Construir data para create usando relación anidada para membresía
        const createData: any = {
            nombre: data.nombre,
            email: data.email,
            telefono: data.telefono,
            dni: data.dni ?? null,
            fecha_nacimiento: data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : null,
            fecha_inicio: data.fecha_inicio ? new Date(data.fecha_inicio) : null,
            fecha_fin: data.fecha_fin ? new Date(data.fecha_fin) : null,
            estado: (data.estado as EstadoCliente) || 'activa',
        };

        if (data.membresia_id) {
            // Conectar relación si se envía un id de membresía
            createData.membresias = { connect: { id: data.membresia_id } };
        }

        const cliente = await prisma.clientes.create({
            data: createData,
            include: {
                membresias: {
                    select: {
                        nombre: true,
                        tipo: true,
                        modalidad: true,
                    },
                },
            },
        });

        return NextResponse.json(cliente, { status: 201 });
    } catch (error) {
        logger.error('Error al crear cliente', { error });
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return NextResponse.json(
            { error: 'Error al crear cliente', message },
            { status: 500 }
        );
    }
}

// OPTIONS - Soporte para preflight CORS (evita 405 en peticiones no-simples)
export async function OPTIONS() {
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return new NextResponse(null, { status: 204, headers });
}
