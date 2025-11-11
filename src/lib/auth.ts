import { NextRequest } from 'next/server';
import { isAdminUser } from './auth-utils';
import type { User } from '@supabase/supabase-js';

/**
 * Extrae el token de acceso de Supabase de las cookies o headers de la request
 * Soporta múltiples formatos de cookies y el header Authorization
 */
export function getSupabaseToken(request: NextRequest): string | undefined {
    // Primero intentar obtener del header Authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        if (process.env.NODE_ENV === 'development') {
            console.log('✅ [Auth] Token encontrado en Authorization header');
        }
        return token;
    }

    const allCookies = request.cookies.getAll();

    // Log para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [Auth] Cookies disponibles:', allCookies.map(c => c.name));
    }

    // Buscar cookies que Supabase usa (formato: sb-{project-ref}-auth-token)
    const supabaseAuthCookie = allCookies.find(cookie =>
        cookie.name.match(/^sb-[a-z]+-auth-token$/)
    );

    if (supabaseAuthCookie?.value) {
        try {
            // Parsear el objeto JSON que contiene el access_token
            const parsed = JSON.parse(supabaseAuthCookie.value);
            const token = parsed.access_token || parsed[0]?.access_token;

            if (token) {
                if (process.env.NODE_ENV === 'development') {
                    console.log('✅ [Auth] Token encontrado en cookie:', supabaseAuthCookie.name);
                }
                return token;
            }
        } catch (error) {
            console.error('❌ [Auth] Error parseando cookie de Supabase:', error);
        }
    }

    // Intentar nombres alternativos
    const possibleCookieNames = [
        'sb-access-token',
        'supabase-auth-token',
        'sb-auth-token',
    ];

    for (const cookieName of possibleCookieNames) {
        const token = request.cookies.get(cookieName)?.value;
        if (token) {
            console.log('✅ [Auth] Token encontrado en:', cookieName);
            return token;
        }
    }

    console.warn('⚠️ [Auth] No se encontró token de autenticación');
    return undefined;
}

/**
 * Valida si un token de Supabase es válido haciendo una llamada a la API
 */
export async function validateSupabaseToken(token: string): Promise<{
    valid: boolean;
    user?: any;
    error?: string;
}> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        return {
            valid: false,
            error: 'Configuración de Supabase faltante',
        };
    }

    try {
        const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': supabaseAnonKey,
            },
        });

        if (!response.ok) {
            return {
                valid: false,
                error: 'Token inválido o expirado',
            };
        }

        const user = await response.json();
        return {
            valid: true,
            user,
        };
    } catch (error) {
        return {
            valid: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
        };
    }
}

/**
 * Verifica si un usuario tiene rol de administrador
 * @deprecated Usa isAdminUser de auth-utils.ts para consistencia
 */
export function isAdmin(user: any): boolean {
    return isAdminUser(user as User);
}
