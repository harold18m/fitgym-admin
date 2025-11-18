import { z } from "zod";

export const createMembresiaSchema = z.object({
    nombre: z.string().min(2).max(255),
    descripcion: z.string().nullable().optional(),
    tipo: z.enum(["mensual", "trimestral", "anual"]),
    modalidad: z.enum(["diario", "interdiario", "libre"]),
    // Coercer para admitir strings de inputs y convertir a number
    precio: z.coerce.number().positive(),
    duracion: z.coerce.number().int().positive(),
    caracteristicas: z.array(z.string()).optional().default([]),
    activa: z.boolean().optional().default(true),
});

export const updateMembresiaSchema = createMembresiaSchema.partial();

export type CreateMembresiaInput = z.infer<typeof createMembresiaSchema>;
export type UpdateMembresiaInput = z.infer<typeof updateMembresiaSchema>;
