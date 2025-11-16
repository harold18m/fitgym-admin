import { z } from "zod";

export const createClienteSchema = z.object({
    nombre: z.string().min(2).max(255),
    email: z.string().email(),
    telefono: z.string().min(7).max(20),
    dni: z.string().min(6).max(20).nullable().optional(),
    fecha_nacimiento: z.string().datetime().optional(),
    membresia_id: z.string().uuid().nullable().optional(),
    nombre_membresia: z.string().nullable().optional(),
    tipo_membresia: z.string().nullable().optional(),
    fecha_inicio: z.string().datetime().nullable().optional(),
    fecha_fin: z.string().datetime().nullable().optional(),
    estado: z.enum(["activa", "vencida", "suspendida"]).optional(),
    avatar_url: z.string().url().nullable().optional(),
});

export const updateClienteSchema = createClienteSchema.partial();

export type CreateClienteInput = z.infer<typeof createClienteSchema>;
export type UpdateClienteInput = z.infer<typeof updateClienteSchema>;
