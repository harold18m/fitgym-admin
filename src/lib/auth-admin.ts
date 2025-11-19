import 'server-only';
import { supabaseAdmin } from './supabaseAdmin';

/**
 * Verificar si existe al menos un administrador en el sistema
 */
export async function verificarAdminExiste(): Promise<boolean> {
    try {
        const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();

        if (error) {
            console.error('[verificarAdminExiste] Error listando usuarios:', error);
            return false;
        }

        const existeAdmin = users.users.some(user => {
            const rol = user.user_metadata?.rol || user.app_metadata?.rol;
            return rol === 'admin';
        });

        return existeAdmin;
    } catch (error) {
        console.error('[verificarAdminExiste] Error:', error);
        return false;
    }
}

/**
 * Crear el primer administrador del sistema
 */
export async function crearPrimerAdmin(datos: {
    email: string;
    password: string;
    nombre: string;
}): Promise<{ success: boolean; error?: string; userId?: string }> {
    try {
        // Verificar que NO exista ningún admin antes de crear uno
        const existeAdmin = await verificarAdminExiste();

        if (existeAdmin) {
            return {
                success: false,
                error: 'Ya existe un usuario administrador en el sistema',
            };
        }

        // Crear el usuario con rol admin
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: datos.email,
            password: datos.password,
            email_confirm: true, // Auto-confirmar el email
            user_metadata: {
                nombre: datos.nombre,
                rol: 'admin',
            },
            app_metadata: {
                rol: 'admin',
            },
        });

        if (createError) {
            console.error('[crearPrimerAdmin] Error creando usuario:', createError);
            return {
                success: false,
                error: createError.message || 'Error al crear el administrador',
            };
        }

        return {
            success: true,
            userId: newUser.user?.id,
        };
    } catch (error) {
        console.error('[crearPrimerAdmin] Error:', error);
        return {
            success: false,
            error: 'Error inesperado al crear el administrador',
        };
    }
}
