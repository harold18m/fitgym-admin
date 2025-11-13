// API Route: /api/clientes/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { EstadoCliente } from '@prisma/client';

// GET - Obtener todos los clientes
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q');

        const where = q
            ? {
                AND: [
                    { deleted_at: null }, // Excluir clientes eliminados lógicamente
                    {
                        OR: [
                            { nombre: { contains: q, mode: 'insensitive' as const } },
                            { email: { contains: q, mode: 'insensitive' as const } },
                            { dni: { contains: q, mode: 'insensitive' as const } },
                        ],
                    },
                ],
            }
            : { deleted_at: null }; // Excluir clientes eliminados lógicamente

        const clientes = await prisma.clientes.findMany({
            where,
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

        const cliente = await prisma.clientes.create({
            data: {
                nombre: body.nombre,
                email: body.email,
                telefono: body.telefono,
                dni: body.dni || null,
                fecha_nacimiento: new Date(body.fecha_nacimiento),
                membresia_id: body.membresia_id || null,
                nombre_membresia: body.nombre_membresia || null,
                tipo_membresia: body.tipo_membresia || null,
                fecha_inicio: body.fecha_inicio ? new Date(body.fecha_inicio) : null,
                fecha_fin: body.fecha_fin ? new Date(body.fecha_fin) : null,
                estado: (body.estado as EstadoCliente) || 'activa',
            },
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
