import type { User } from "@supabase/supabase-js";

/**
 * Extrae el rol del usuario desde sus metadatos
 * Busca en user_metadata y app_metadata
 */
export function getUserRole(user: User | null | undefined): string | null {
    if (!user) return null;

    const userMetadata = user.user_metadata;
    const appMetadata = user.app_metadata;

    return userMetadata?.rol || appMetadata?.rol || null;
}

/**
 * Verifica si el usuario tiene rol de administrador
 */
export function isAdminUser(user: User | null | undefined): boolean {
    return getUserRole(user) === 'admin';
}

/**
 * Mensajes de autenticación centralizados
 */
export const AUTH_MESSAGES = {
    LOGIN: {
        SUCCESS_TITLE: "Inicio de sesión exitoso",
        SUCCESS_DESCRIPTION: "Bienvenido al sistema de administración",
        ERROR_TITLE: "Error al iniciar sesión",
        ERROR_DESCRIPTION: "Credenciales incorrectas o sin permisos de administrador",
        ADMIN_ONLY: "Solo usuarios administradores pueden acceder al sistema",
    },
    REGISTER: {
        SUCCESS_TITLE: "Administrador creado exitosamente",
        SUCCESS_DESCRIPTION: "Ahora puedes iniciar sesión con tus credenciales",
        ERROR_TITLE: "Error al crear administrador",
        ERROR_DESCRIPTION: "No se pudo crear el usuario administrador",
    },
    VERIFICATION: {
        LOADING: "Cargando...",
        LOADING_DESCRIPTION: "Verificando configuración del sistema...",
        LOGIN_TITLE: "Iniciar sesión",
        LOGIN_DESCRIPTION: "Ingresa tus credenciales para acceder al sistema",
        REGISTER_TITLE: "Crear administrador",
        REGISTER_DESCRIPTION: "No hay administradores. Crea el primer usuario administrador para comenzar.",
    },
} as const;
