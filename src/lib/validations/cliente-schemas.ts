import { z } from "zod";

// Acepta yyyy-MM-dd o ISO datetime
const flexibleDateString = z.string().refine(
    (val) => /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(val),
    { message: "Formato de fecha inválido, se espera yyyy-MM-dd o ISO datetime" }
);

export const createClienteSchema = z.object({
    nombre: z.string().min(2).max(255),
    email: z.string().email(),
    telefono: z.string().min(7).max(20),
    dni: z.string().min(6).max(20).nullable().optional(),
    fecha_nacimiento: flexibleDateString.optional(),
    membresia_id: z.string().uuid().nullable().optional(),
    nombre_membresia: z.string().nullable().optional(),
    tipo_membresia: z.string().nullable().optional(),
    fecha_inicio: flexibleDateString.nullable().optional(),
    fecha_fin: flexibleDateString.nullable().optional(),
    estado: z.enum(["activa", "vencida", "suspendida"]).optional(),
    avatar_url: z.string().url().nullable().optional(),
});

export const updateClienteSchema = createClienteSchema.partial();

export type CreateClienteInput = z.infer<typeof createClienteSchema>;
export type UpdateClienteInput = z.infer<typeof updateClienteSchema>;
