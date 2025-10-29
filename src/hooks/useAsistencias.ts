import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

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
            const response = await fetch(url);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al obtener asistencias');
            }

            return await response.json();
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
            const response = await fetch('/api/asistencias', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error al registrar asistencia');
            }

            toast({
                title: 'Asistencia registrada',
                description: `${result.clientes.nombre} ha registrado su asistencia exitosamente`,
            });

            return result;
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error al registrar asistencia',
                description: error.message,
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
