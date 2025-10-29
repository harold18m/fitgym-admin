// API Route: /api/clientes/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { EstadoCliente } from '@prisma/client';

// GET - Obtener un cliente por ID
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const cliente = await prisma.clientes.findUnique({
            where: { id: params.id },
            include: {
                membresias: {
                    select: {
                        nombre: true,
                        tipo: true,
                        modalidad: true,
                        precio: true,
                    },
                },
            },
        });

        if (!cliente) {
            return NextResponse.json(
                { error: 'Cliente no encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json(cliente);
    } catch (error) {
        console.error('Error al obtener cliente:', error);
        return NextResponse.json(
            { error: 'Error al obtener cliente' },
            { status: 500 }
        );
    }
}

// PUT - Actualizar un cliente
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();

        const cliente = await prisma.clientes.update({
            where: { id: params.id },
            data: {
                nombre: body.nombre,
                email: body.email,
                telefono: body.telefono,
                dni: body.dni || null,
                fecha_nacimiento: body.fecha_nacimiento ? new Date(body.fecha_nacimiento) : undefined,
                membresia_id: body.membresia_id || null,
                nombre_membresia: body.nombre_membresia || null,
                tipo_membresia: body.tipo_membresia || null,
                fecha_inicio: body.fecha_inicio ? new Date(body.fecha_inicio) : null,
                fecha_fin: body.fecha_fin ? new Date(body.fecha_fin) : null,
                estado: body.estado as EstadoCliente | undefined,
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

        return NextResponse.json(cliente);
    } catch (error) {
        console.error('Error al actualizar cliente:', error);
        return NextResponse.json(
            { error: 'Error al actualizar cliente' },
            { status: 500 }
        );
    }
}

// DELETE - Eliminar un cliente
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.clientes.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        return NextResponse.json(
            { error: 'Error al eliminar cliente' },
            { status: 500 }
        );
    }
}
