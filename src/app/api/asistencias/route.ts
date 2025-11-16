import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAsistenciaSchema } from '@/lib/validations/asistencia-schemas';

// GET /api/asistencias - Obtener todas las asistencias
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = searchParams.get('limit');
        const clienteId = searchParams.get('cliente_id');
        const fechaDesde = searchParams.get('fecha_desde');
        const fechaHasta = searchParams.get('fecha_hasta');

        const where: any = {};

        if (clienteId) {
            where.cliente_id = clienteId;
        }

        if (fechaDesde || fechaHasta) {
            where.fecha_asistencia = {};
            if (fechaDesde) {
                where.fecha_asistencia.gte = new Date(fechaDesde);
            }
            if (fechaHasta) {
                where.fecha_asistencia.lte = new Date(fechaHasta);
            }
        }

        const asistencias = await prisma.asistencias.findMany({
            where,
            orderBy: {
                fecha_asistencia: 'desc'
            },
            take: limit ? parseInt(limit) : undefined,
            include: {
                clientes: {
                    select: {
                        id: true,
                        nombre: true,
                        dni: true,
                        avatar_url: true,
                        fecha_fin: true,
                        estado: true,
                    }
                }
            }
        });

        return NextResponse.json(asistencias);
    } catch (error: any) {
        console.error('Error obteniendo asistencias:', error);
        return NextResponse.json(
            { error: 'Error al obtener asistencias', details: error.message },
            { status: 500 }
        );
    }
}

// POST /api/asistencias - Registrar nueva asistencia
export async function POST(request: Request) {
    try {
        const body = await request.json();

        const parsed = createAsistenciaSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Datos inválidos', details: parsed.error.flatten() },
                { status: 400 }
            );
        }
        const { cliente_id, evento_id, estado, notas } = parsed.data;

        // Verificar que el cliente existe
        const cliente = await prisma.clientes.findUnique({
            where: { id: cliente_id }
        });

        if (!cliente) {
            return NextResponse.json(
                { error: 'Cliente no encontrado' },
                { status: 404 }
            );
        }

        // Verificar si el cliente tiene membresía activa
        if (cliente.estado === 'vencida' || cliente.estado === 'suspendida') {
            return NextResponse.json(
                { error: 'La membresía del cliente no está activa' },
                { status: 400 }
            );
        }

        // Verificar si ya registró asistencia hoy
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const asistenciaHoy = await prisma.asistencias.findFirst({
            where: {
                cliente_id,
                fecha_asistencia: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });

        if (asistenciaHoy) {
            const horaAsistencia = new Date(asistenciaHoy.fecha_asistencia)
                .toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                });

            return NextResponse.json(
                {
                    error: 'El cliente ya registró su asistencia hoy',
                    details: `Asistencia registrada a las ${horaAsistencia}`,
                    asistencia_existente: {
                        id: asistenciaHoy.id,
                        fecha_asistencia: asistenciaHoy.fecha_asistencia,
                        hora: horaAsistencia
                    }
                },
                { status: 400 }
            );
        }

        // Generar ID UUID
        const { randomUUID } = await import('crypto');
        const id = randomUUID();

        const ahora = new Date();

        // Crear la asistencia con hora_entrada
        const asistencia = await prisma.asistencias.create({
            data: {
                id,
                cliente_id,
                evento_id: evento_id || null,
                estado: estado || 'presente',
                notas: notas || null,
                hora_entrada: ahora,
            },
            include: {
                clientes: {
                    select: {
                        id: true,
                        nombre: true,
                        dni: true,
                        avatar_url: true,
                        fecha_fin: true,
                        estado: true,
                    }
                }
            }
        });

        // Incrementar contador de asistencias del cliente
        await prisma.clientes.update({
            where: { id: cliente_id },
            data: {
                asistencias_count: {
                    increment: 1
                }
            }
        });

        return NextResponse.json(asistencia, { status: 201 });
    } catch (error: any) {
        console.error('Error registrando asistencia:', error);
        return NextResponse.json(
            { error: 'Error al registrar asistencia', details: error.message },
            { status: 500 }
        );
    }
}
