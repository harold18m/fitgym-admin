import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { authenticatedGet, authenticatedPost } from '@/lib/fetch-utils';

export interface AsistenciaConCliente {
    id: string;
    evento_id: string | null;
    cliente_id: string;
    fecha_asistencia: Date | string;
    estado: string;
    notas: string | null;
    created_at: Date | string;
    clientes: {
        id: string;
        nombre: string;
        dni: string | null;
        avatar_url: string | null;
        nombre_membresia: string | null;
        tipo_membresia: string | null;
        fecha_fin: Date | string | null;
        estado: string;
    };
}

export interface RegistrarAsistenciaData {
    cliente_id: string;
    evento_id?: string | null;
    estado?: string;
    notas?: string | null;
}

export function useAsistencias() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const fetchAsistencias = async (params?: {
        limit?: number;
        cliente_id?: string;
        fecha_desde?: string;
        fecha_hasta?: string;
    }): Promise<AsistenciaConCliente[]> => {
        try {
            const queryParams = new URLSearchParams();

            if (params?.limit) queryParams.append('limit', params.limit.toString());
            if (params?.cliente_id) queryParams.append('cliente_id', params.cliente_id);
            if (params?.fecha_desde) queryParams.append('fecha_desde', params.fecha_desde);
            if (params?.fecha_hasta) queryParams.append('fecha_hasta', params.fecha_hasta);

            const url = `/api/asistencias${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            return await authenticatedGet<AsistenciaConCliente[]>(url);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Error al cargar asistencias',
            });
            throw error;
        }
    };

    const registrarAsistencia = async (
        data: RegistrarAsistenciaData
    ): Promise<AsistenciaConCliente> => {
        setIsLoading(true);
        try {
            const result = await authenticatedPost<AsistenciaConCliente>('/api/asistencias', data);

            toast({
                title: 'Asistencia registrada',
                description: `${result.clientes.nombre} ha registrado su asistencia exitosamente`,
            });

            return result;
        } catch (error: any) {
            // Manejo específico para diferentes tipos de errores
            let title = 'Error al registrar asistencia';
            let description = error.message;

            if (error.message.includes('ya registró su asistencia hoy')) {
                title = 'Asistencia ya registrada';
                // Usar información adicional del error si está disponible
                if ((error as any).details) {
                    description = `Este cliente ya registró su asistencia hoy. ${(error as any).details}`;
                } else {
                    description = 'Este cliente ya registró su asistencia el día de hoy.';
                }
            } else if (error.message.includes('membresía del cliente no está activa')) {
                title = 'Membresía inactiva';
                description = 'La membresía de este cliente no está activa.';
            } else if (error.message.includes('Cliente no encontrado')) {
                title = 'Cliente no encontrado';
                description = 'No se encontró un cliente con los datos proporcionados.';
            }

            toast({
                variant: 'destructive',
                title,
                description,
            });
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        fetchAsistencias,
        registrarAsistencia,
        isLoading,
    };
}
