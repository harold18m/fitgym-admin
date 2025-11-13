import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/asistencias/salida - Registrar salida de un cliente
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { asistencia_id, cliente_id } = body;

        if (!asistencia_id && !cliente_id) {
            return NextResponse.json(
                { error: 'Se requiere asistencia_id o cliente_id' },
                { status: 400 }
            );
        }

        const ahora = new Date();
        const inicioDia = new Date();
        inicioDia.setHours(0, 0, 0, 0);
        const finDia = new Date();
        finDia.setHours(23, 59, 59, 999);

        // Buscar la asistencia activa (sin salida registrada)
        const where: any = {
            hora_salida: null,
            fecha_asistencia: {
                gte: inicioDia,
                lte: finDia
            }
        };

        if (asistencia_id) {
            where.id = asistencia_id;
        } else if (cliente_id) {
            where.cliente_id = cliente_id;
        }

        const asistencia = await prisma.asistencias.findFirst({
            where,
            include: {
                clientes: {
                    select: {
                        nombre: true,
                    }
                }
            }
        });

        if (!asistencia) {
            return NextResponse.json(
                { error: 'No se encontró una asistencia activa para este cliente hoy' },
                { status: 404 }
            );
        }

        // Calcular duración en minutos
        const duracionMs = ahora.getTime() - asistencia.hora_entrada.getTime();
        const duracionMinutos = Math.round(duracionMs / (1000 * 60));

        // Actualizar la asistencia con hora de salida y duración
        const asistenciaActualizada = await prisma.asistencias.update({
            where: {
                id: asistencia.id
            },
            data: {
                hora_salida: ahora,
                duracion_minutos: duracionMinutos
            },
            include: {
                clientes: {
                    select: {
                        id: true,
                        nombre: true,
                        avatar_url: true,
                    }
                }
            }
        });

        // Formatear duración para mostrar
        const horas = Math.floor(duracionMinutos / 60);
        const minutos = duracionMinutos % 60;
        const duracionTexto = horas > 0
            ? `${horas}h ${minutos}min`
            : `${minutos}min`;

        return NextResponse.json({
            success: true,
            message: `Salida registrada para ${asistencia.clientes.nombre}`,
            asistencia: asistenciaActualizada,
            duracion: {
                minutos: duracionMinutos,
                texto: duracionTexto,
                horaEntrada: asistencia.hora_entrada,
                horaSalida: ahora,
            }
        });

    } catch (error: any) {
        console.error('Error registrando salida:', error);
        return NextResponse.json(
            { error: 'Error al registrar salida', details: error.message },
            { status: 500 }
        );
    }
}

// GET /api/asistencias/salida - Obtener asistencias pendientes de salida
export async function GET(request: Request) {
    // Antes de devolver las asistencias pendientes, registrar automáticamente
    // salidas para aquellos registros cuya hora de entrada excede el umbral (90 min)
    try {
        await autoRegisterSalidasAutomaticas(90);
    } catch (err) {
        console.error('Error al ejecutar auto-register de salidas:', err);
        // No abortamos la respuesta; seguimos y devolvemos las asistencias pendientes
    }
    try {
        const { searchParams } = new URL(request.url);
        const clienteId = searchParams.get('cliente_id');

        const inicioDia = new Date();
        inicioDia.setHours(0, 0, 0, 0);
        const finDia = new Date();
        finDia.setHours(23, 59, 59, 999);

        const where: any = {
            hora_salida: null,
            fecha_asistencia: {
                gte: inicioDia,
                lte: finDia
            }
        };

        if (clienteId) {
            where.cliente_id = clienteId;
        }

        const asistenciasPendientes = await prisma.asistencias.findMany({
            where,
            include: {
                clientes: {
                    select: {
                        id: true,
                        nombre: true,
                        dni: true,
                        avatar_url: true,
                        estado: true,
                    }
                }
            },
            orderBy: {
                hora_entrada: 'desc'
            }
        });

        const ahora = new Date();

        return NextResponse.json({
            asistencias: asistenciasPendientes.map(a => ({
                ...a,
                tiempoTranscurrido: Math.round((ahora.getTime() - a.hora_entrada.getTime()) / (1000 * 60)), // minutos
            }))
        });

    } catch (error: any) {
        console.error('Error obteniendo asistencias pendientes:', error);
        return NextResponse.json(
            { error: 'Error al obtener asistencias pendientes', details: error.message },
            { status: 500 }
        );
    }
}

// ----------------------
// Registro automático
// ----------------------
async function autoRegisterSalidasAutomaticas(thresholdMinutes: number = 90) {
    const ahora = new Date();
    const thresholdMs = thresholdMinutes * 60 * 1000;
    const cutoff = new Date(ahora.getTime() - thresholdMs);

    // Buscar asistencias sin hora_salida cuya hora_entrada sea anterior o igual al cutoff
    const pendientes = await prisma.asistencias.findMany({
        where: {
            hora_salida: null,
            hora_entrada: {
                lte: cutoff
            }
        }
    });

    if (!pendientes || pendientes.length === 0) return { updated: 0 };

    const updates = [] as any[];

    for (const a of pendientes) {
        try {
            // Registrar la salida exactamente thresholdMinutes después de la entrada
            const horaSalida = new Date(a.hora_entrada.getTime() + thresholdMs);
            const duracionMinutos = Math.round((horaSalida.getTime() - a.hora_entrada.getTime()) / (1000 * 60));

            const updated = await prisma.asistencias.update({
                where: { id: a.id },
                data: {
                    hora_salida: horaSalida,
                    duracion_minutos: duracionMinutos
                }
            });

            updates.push(updated);
        } catch (err) {
            console.error('No se pudo actualizar asistencia automática:', a.id, err);
        }
    }

    return { updated: updates.length, detalles: updates.map(u => u.id) };
}
