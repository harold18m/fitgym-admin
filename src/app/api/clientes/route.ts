// API Route: /api/clientes/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { EstadoCliente } from '@prisma/client';

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
        console.error('Error al obtener clientes:', error);
        return NextResponse.json(
            { error: 'Error al obtener clientes' },
            { status: 500 }
        );
    }
}

// POST - Crear nuevo cliente
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Construir data para create usando relación anidada para membresía
        const createData: any = {
            nombre: body.nombre,
            email: body.email,
            telefono: body.telefono,
            dni: body.dni || null,
            fecha_nacimiento: body.fecha_nacimiento ? new Date(body.fecha_nacimiento) : null,
            fecha_inicio: body.fecha_inicio ? new Date(body.fecha_inicio) : null,
            fecha_fin: body.fecha_fin ? new Date(body.fecha_fin) : null,
            estado: (body.estado as EstadoCliente) || 'activa',
        };

        if (body.membresia_id) {
            // Conectar relación si se envía un id de membresía
            createData.membresias = { connect: { id: body.membresia_id } };
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
        console.error('Error al crear cliente:', error);
        return NextResponse.json(
            { error: 'Error al crear cliente' },
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
