import { z } from "zod";

export const createAsistenciaSchema = z.object({
    cliente_id: z.string().uuid(),
    evento_id: z.string().uuid().nullable().optional(),
    estado: z.enum(["presente", "ausente", "tardanza"]).optional().default("presente"),
    notas: z.string().nullable().optional(),
    hora_entrada: z.string().datetime().optional(),
    hora_salida: z.string().datetime().nullable().optional(),
});

export const updateAsistenciaSchema = z.object({
    estado: z.enum(["presente", "ausente", "tardanza"]).optional(),
    notas: z.string().nullable().optional(),
    hora_salida: z.string().datetime().nullable().optional(),
});

export type CreateAsistenciaInput = z.infer<typeof createAsistenciaSchema>;
export type UpdateAsistenciaInput = z.infer<typeof updateAsistenciaSchema>;
