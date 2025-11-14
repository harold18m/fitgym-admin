import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { authenticatedGet, authenticatedFetch } from '@/lib/fetch-utils';

export interface Cliente {
    id: string;
    nombre: string;
    dni: string | null;
    email: string;
    telefono: string;
    fecha_nacimiento: Date | string;
    membresia_id: string | null;
    nombre_membresia: string | null;
    tipo_membresia: string | null;
    fecha_inicio: Date | string | null;
    fecha_fin: Date | string | null;
    estado: string;
    avatar_url: string | null;
}

// Query Keys
export const clientesKeys = {
    all: ['clientes'] as const,
    lists: () => [...clientesKeys.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...clientesKeys.lists(), filters] as const,
    detail: (id: string) => [...clientesKeys.all, 'detail', id] as const,
    byDni: (dni: string) => [...clientesKeys.all, 'dni', dni] as const,
    expiring: (days: number) => [...clientesKeys.all, 'expiring', days] as const,
};

// Fetch clientes
async function fetchClientes(): Promise<Cliente[]> {
    return authenticatedGet<Cliente[]>('/api/clientes');
}

// Fetch cliente por ID
async function fetchClienteById(id: string): Promise<Cliente> {
    return authenticatedGet<Cliente>(`/api/clientes/${id}`);
}

// Validar DNI
async function validarDni(dni: string): Promise<{ existe: boolean; cliente: Cliente | null }> {
    return authenticatedGet<{ existe: boolean; cliente: Cliente | null }>(`/api/clientes/validar-dni?dni=${dni}`);
}

// Fetch clientes por vencer
async function fetchClientesExpiring(days: number = 7): Promise<Cliente[]> {
    return authenticatedGet<Cliente[]>(`/api/clientes/expiring?days=${days}`);
}

// Hook: useClientes
export function useClientesQuery() {
    return useQuery<Cliente[], Error>({
        queryKey: clientesKeys.lists(),
        queryFn: fetchClientes,
        // Mantener en cache 15 minutos y refrescar en background cada 15 minutos
        staleTime: 15 * 60 * 1000, // 15 minutos
        // cacheTime (opcional) intentionally omitted to avoid TypeScript overload issues
        refetchInterval: 15 * 60 * 1000, // refetch automático cada 15 minutos
        // Evitar re-fetch automático al volver al foco (al cambiar de pestaña)
        refetchOnWindowFocus: false,
        // Evitar re-fetch al montar si los datos están frescos
        refetchOnMount: false,
    });
}

// Hook: useCliente (por ID)
export function useClienteQuery(id: string) {
    return useQuery({
        queryKey: clientesKeys.detail(id),
        queryFn: () => fetchClienteById(id),
        enabled: !!id,
        staleTime: 2 * 60 * 1000, // 2 minutos
    });
}

// Hook: useValidarDni
export function useValidarDniQuery(dni: string, enabled: boolean = false) {
    return useQuery({
        queryKey: clientesKeys.byDni(dni),
        queryFn: () => validarDni(dni),
        enabled: enabled && !!dni && dni.length > 0,
        staleTime: 30 * 1000, // 30 segundos
    });
}

// Hook: useClientesExpiring
export function useClientesExpiringQuery(days: number = 7) {
    return useQuery({
        queryKey: clientesKeys.expiring(days),
        queryFn: () => fetchClientesExpiring(days),
        staleTime: 2 * 60 * 1000, // 2 minutos
    });
}
