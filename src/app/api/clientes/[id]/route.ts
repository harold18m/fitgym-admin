// API Route: /api/clientes/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { EstadoCliente } from '@prisma/client';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GET - Obtener un cliente por ID
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const cliente = await prisma.clientes.findUnique({
            where: {
                id: params.id,
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
        if (body.membresia_id !== undefined) {
            if (body.membresia_id) {
                // Conectar la membresía al cliente
                updateData.membresias = { connect: { id: body.membresia_id } };
            } else {
                // Desconectar la membresía (establecer a null)
                updateData.membresias = { disconnect: true };
            }
        }
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

        // Verificar que el cliente existe
        const cliente = await prisma.clientes.findUnique({
            where: {
                id: clienteId,
            },
        });

        if (!cliente) {
            return NextResponse.json(
                { error: 'Cliente no encontrado' },
                { status: 404 }
            );
        }

        try {
            await prisma.$transaction([
                prisma.asistencias.deleteMany({ where: { cliente_id: clienteId } }),
                prisma.rutinas.deleteMany({ where: { cliente_id: clienteId } }),
                prisma.tarjetas_acceso.deleteMany({ where: { cliente_id: clienteId } }),
                prisma.eventos.deleteMany({ where: { cliente_id: clienteId } }),
                prisma.clientes.delete({ where: { id: clienteId } }),
            ]);

            // Después de eliminar en la BD, intentar eliminar el usuario en Supabase Auth
            if (cliente.email) {
                try {
                    const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
                    const userToDelete = authData?.users?.find(u => u.email === cliente.email);
                    if (userToDelete) {
                        await supabaseAdmin.auth.admin.deleteUser(userToDelete.id);
                        console.log(`Usuario en Auth eliminado: ${userToDelete.id}`);
                    }
                } catch (authError: any) {
                    console.warn(`No se pudo eliminar usuario en Auth para ${cliente.email}:`, authError.message);
                }
            }

            return NextResponse.json({
                success: true,
                message: 'Cliente eliminado permanentemente',
                cliente: {
                    id: clienteId,
                    nombre: cliente.nombre,
                }
            });
        } catch (txError: any) {
            console.error('Error en transacción de eliminación:', txError);
            return NextResponse.json(
                { error: 'Error al eliminar cliente y sus dependencias', details: txError.message },
                { status: 500 }
            );
        }
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

// OPTIONS - Soporte para preflight CORS (evita 405 en peticiones no-simples)
export async function OPTIONS(
    request: Request,
    { params }: { params: { id?: string } }
) {
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return new NextResponse(null, { status: 204, headers });
}
