import { z } from "zod";

export const createRutinaTemplateSchema = z.object({
    nombre: z.string().min(2).max(255),
    descripcion: z.string().nullable().optional(),
    creado_por: z.string().max(255).nullable().optional(),
});

export const updateRutinaTemplateSchema = createRutinaTemplateSchema.partial();

export type CreateRutinaTemplateInput = z.infer<typeof createRutinaTemplateSchema>;
export type UpdateRutinaTemplateInput = z.infer<typeof updateRutinaTemplateSchema>;
