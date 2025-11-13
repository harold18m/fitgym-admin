import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // Obtener el cliente
        const cliente = await prisma.clientes.findUnique({
            where: { id },
            include: {
                membresias: true,
            },
        });

        if (!cliente) {
            return NextResponse.json(
                { error: 'Cliente no encontrado' },
                { status: 404 }
            );
        }

        if (!cliente.membresia_id || !cliente.membresias) {
            return NextResponse.json(
                { error: 'El cliente no tiene una membresía asignada' },
                { status: 400 }
            );
        }

        // Calcular nueva fecha de fin
        const membresia = cliente.membresias;
        const duracionDias = membresia.duracion || 30; // Por defecto 30 días

        let nuevaFechaInicio: Date;
        let nuevaFechaFin: Date;

        // Si la membresía está vencida, comenzar desde hoy
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        if (!cliente.fecha_fin || new Date(cliente.fecha_fin) < hoy) {
            nuevaFechaInicio = hoy;
        } else {
            // Si está activa, extender desde la fecha_fin actual
            nuevaFechaInicio = new Date(cliente.fecha_fin);
            nuevaFechaInicio.setDate(nuevaFechaInicio.getDate() + 1);
        }

        nuevaFechaFin = new Date(nuevaFechaInicio);
        nuevaFechaFin.setDate(nuevaFechaFin.getDate() + duracionDias - 1);

        // Actualizar cliente
        const clienteActualizado = await prisma.clientes.update({
            where: { id },
            data: {
                fecha_inicio: nuevaFechaInicio,
                fecha_fin: nuevaFechaFin,
                estado: 'activa',
                nombre_membresia: membresia.nombre || null,
                tipo_membresia: membresia.tipo || null,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Pago registrado y membresía extendida',
            cliente: clienteActualizado,
        });
    } catch (error: any) {
        console.error('Error registrando pago:', error);
        return NextResponse.json(
            { error: 'Error al registrar pago', details: error.message },
            { status: 500 }
        );
    }
}
