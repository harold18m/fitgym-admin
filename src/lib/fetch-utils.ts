import { supabase } from './supabase';

/**
 * Wrapper de fetch que incluye automáticamente el token de autenticación
 * en los headers para peticiones API protegidas
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    // Obtener el token actual de la sesión
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
        throw new Error('No hay sesión activa');
    }

    // Agregar el token al header Authorization
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${session.access_token}`);
    headers.set('Content-Type', 'application/json');

    return fetch(url, {
        ...options,
        headers,
    });
}

/**
 * Helper para hacer peticiones GET autenticadas con manejo de errores
 */
export async function authenticatedGet<T>(url: string): Promise<T> {
    const response = await authenticatedFetch(url, { method: 'GET' });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(error.error || error.message || `HTTP ${response.status}`);
    }

    return response.json();
}

/**
 * Helper para hacer peticiones POST autenticadas con manejo de errores
 */
export async function authenticatedPost<T>(url: string, data: any): Promise<T> {
    const response = await authenticatedFetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(error.error || error.message || `HTTP ${response.status}`);
    }

    return response.json();
}
