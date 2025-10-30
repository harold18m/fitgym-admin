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
            where: { 
                id: params.id,
                deleted_at: null // Solo clientes no eliminados
            },
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

        // Construir objeto de actualización solo con campos presentes
        const updateData: any = {};

        if (body.nombre !== undefined) updateData.nombre = body.nombre;
        if (body.email !== undefined) updateData.email = body.email;
        if (body.telefono !== undefined) updateData.telefono = body.telefono;
        if (body.dni !== undefined) updateData.dni = body.dni || null;
        if (body.avatar_url !== undefined) updateData.avatar_url = body.avatar_url;
        if (body.fecha_nacimiento !== undefined) {
            updateData.fecha_nacimiento = body.fecha_nacimiento ? new Date(body.fecha_nacimiento) : null;
        }
        if (body.membresia_id !== undefined) updateData.membresia_id = body.membresia_id || null;
        if (body.nombre_membresia !== undefined) updateData.nombre_membresia = body.nombre_membresia || null;
        if (body.tipo_membresia !== undefined) updateData.tipo_membresia = body.tipo_membresia || null;
        if (body.fecha_inicio !== undefined) {
            updateData.fecha_inicio = body.fecha_inicio ? new Date(body.fecha_inicio) : null;
        }
        if (body.fecha_fin !== undefined) {
            updateData.fecha_fin = body.fecha_fin ? new Date(body.fecha_fin) : null;
        }
        if (body.estado !== undefined) updateData.estado = body.estado as EstadoCliente;

        const cliente = await prisma.clientes.update({
            where: { 
                id: params.id,
                deleted_at: null // Solo actualizar clientes no eliminados
            },
            data: updateData,
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

// DELETE - Eliminación lógica de un cliente (soft delete)
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const clienteId = params.id;

        // Verificar que el cliente existe y no está ya eliminado
        const cliente = await prisma.clientes.findUnique({
            where: { 
                id: clienteId,
                deleted_at: null // Solo clientes no eliminados
            },
        });

        if (!cliente) {
            return NextResponse.json(
                { error: 'Cliente no encontrado o ya eliminado' },
                { status: 404 }
            );
        }

        // Realizar eliminación lógica
        const clienteEliminado = await prisma.clientes.update({
            where: { id: clienteId },
            data: { 
                deleted_at: new Date(),
                // Opcional: cambiar estado a inactivo
                estado: 'suspendida'
            },
        });

        return NextResponse.json({ 
            success: true,
            message: 'Cliente eliminado correctamente',
            cliente: {
                id: clienteEliminado.id,
                nombre: clienteEliminado.nombre,
                deleted_at: clienteEliminado.deleted_at
            }
        });
    } catch (error: any) {
        console.error('Error al eliminar cliente:', error);
        
        // Manejar errores específicos de Prisma
        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Cliente no encontrado' },
                { status: 404 }
            );
        }
        
        return NextResponse.json(
            { 
                error: 'Error al eliminar cliente',
                details: error.message 
            },
            { status: 500 }
        );
    }
}
