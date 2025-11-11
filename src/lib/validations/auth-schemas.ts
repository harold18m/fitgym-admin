import { z } from "zod";

/**
 * Esquema de validación para el formulario de login
 */
export const loginFormSchema = z.object({
    email: z
        .string()
        .min(1, { message: "El correo electrónico es requerido" })
        .email({ message: "Correo electrónico inválido" }),
    password: z
        .string()
        .min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

/**
 * Esquema de validación para el formulario de registro
 */
export const registroFormSchema = z
    .object({
        nombre: z
            .string()
            .min(2, { message: "El nombre debe tener al menos 2 caracteres" })
            .max(100, { message: "El nombre es demasiado largo" }),
        email: z
            .string()
            .min(1, { message: "El correo electrónico es requerido" })
            .email({ message: "Correo electrónico inválido" }),
        password: z
            .string()
            .min(6, { message: "La contraseña debe tener al menos 6 caracteres" })
            .max(100, { message: "La contraseña es demasiado larga" })
            .regex(/[A-Z]/, { message: "La contraseña debe contener al menos una mayúscula" })
            .regex(/[a-z]/, { message: "La contraseña debe contener al menos una minúscula" })
            .regex(/[0-9]/, { message: "La contraseña debe contener al menos un número" }),
        confirmarPassword: z
            .string()
            .min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
    })
    .refine((data) => data.password === data.confirmarPassword, {
        message: "Las contraseñas no coinciden",
        path: ["confirmarPassword"],
    });

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegistroFormValues = z.infer<typeof registroFormSchema>;
