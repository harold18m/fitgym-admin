import { z } from "zod";

export const createMembresiaSchema = z.object({
    nombre: z.string().min(2).max(255),
    descripcion: z.string().nullable().optional(),
    tipo: z.enum(["mensual", "trimestral", "anual"]),
    modalidad: z.enum(["diario", "interdiario", "libre"]),
    precio: z.number().positive(),
    duracion: z.number().int().positive(),
    caracteristicas: z.array(z.string()).optional().default([]),
    activa: z.boolean().optional().default(true),
});

export const updateMembresiaSchema = createMembresiaSchema.partial();

export type CreateMembresiaInput = z.infer<typeof createMembresiaSchema>;
export type UpdateMembresiaInput = z.infer<typeof updateMembresiaSchema>;
