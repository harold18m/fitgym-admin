'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { verificarAdminExiste, crearPrimerAdmin } from '@/lib/auth-admin';
import { z } from 'zod';

// Schemas de validación
const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const signupSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
});

type AuthResult = {
    success: boolean;
    error?: string;
    message?: string;
};

/**
 * Server Action: Iniciar sesión
 * Nota: En caso exitoso, hace redirect() y nunca retorna
 */
export async function login(formData: FormData): Promise<AuthResult | never> {
    try {
        const rawData = {
            email: formData.get('email') as string,
            password: formData.get('password') as string,
        };

        const validatedData = loginSchema.parse(rawData);
        const supabase = await createServerSupabaseClient();

        const { data, error } = await supabase.auth.signInWithPassword({
            email: validatedData.email,
            password: validatedData.password,
        });

        if (error) {
            return {
                success: false,
                error: error.message,
            };
        }

        // Verificar que el usuario es admin
        const role = data.user?.user_metadata?.rol || data.user?.app_metadata?.rol;
        if (role !== 'admin') {
            await supabase.auth.signOut();
            return {
                success: false,
                error: 'Solo usuarios administradores pueden acceder al sistema',
            };
        }

        revalidatePath('/', 'layout');
        redirect('/');
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: error.errors[0].message,
            };
        }

        // Si es un redirect, dejarlo pasar
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error;
        }

        return {
            success: false,
            error: 'Error al iniciar sesión',
        };
    }
}

/**
 * Server Action: Cerrar sesión
 */
export async function logout(): Promise<AuthResult> {
    try {
        const supabase = await createServerSupabaseClient();

        const { error } = await supabase.auth.signOut();

        if (error) {
            return {
                success: false,
                error: error.message,
            };
        }

        revalidatePath('/', 'layout');
        redirect('/login');
    } catch (error) {
        // Si es un redirect, dejarlo pasar
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error;
        }

        return {
            success: false,
            error: 'Error al cerrar sesión',
        };
    }
}

/**
 * Server Function: Verificar si existe al menos un administrador
 */
export async function checkAdminExists(): Promise<boolean> {
    try {
        return await verificarAdminExiste();
    } catch (error) {
        console.error('Error verificando admin:', error);
        return false;
    }
}

/**
 * Server Action: Registrar nuevo administrador
 * Solo disponible si no hay administradores en el sistema
 */
export async function signup(formData: FormData): Promise<AuthResult> {
    try {
        const rawData = {
            email: formData.get('email') as string,
            password: formData.get('password') as string,
            nombre: formData.get('nombre') as string,
        };

        const validatedData = signupSchema.parse(rawData);

        // Verificar que no haya administradores (solo permitir si es el primer admin)
        const hasAdmin = await checkAdminExists();

        if (hasAdmin) {
            return {
                success: false,
                error: 'Ya existe un administrador en el sistema',
            };
        }

        // Crear el admin usando la función directa (sin HTTP fetch)
        const resultado = await crearPrimerAdmin({
            email: validatedData.email,
            password: validatedData.password,
            nombre: validatedData.nombre,
        });

        if (!resultado.success) {
            return {
                success: false,
                error: resultado.error || 'Error al crear administrador',
            };
        }

        // Redirigir al login después de crear el admin exitosamente
        revalidatePath('/', 'layout');
        redirect('/login');
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: error.errors[0].message,
            };
        }

        // Si es un redirect, dejarlo pasar
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error;
        }

        return {
            success: false,
            error: 'Error al crear administrador',
        };
    }
}
