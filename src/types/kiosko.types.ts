import type { Database } from "@/lib/supabase";

export type Cliente = Database["public"]["Tables"]["clientes"]["Row"];

export type ClienteConMembresia = Cliente & {
    nombre_membresia?: string | null;
    tipo_membresia?: string | null;
    membresias?: {
        nombre: string;
        modalidad: string;
    } | null;
}; export type OverlayKind = "granted" | "denied";

export type DeniedReason = "unknown" | "expired" | "suspended";

export interface OverlayState {
    visible: boolean;
    kind: OverlayKind | null;
    deniedReason: DeniedReason | null;
    cliente: ClienteConMembresia | null;
    codigoQR: string;
    hora: string;
}

export interface AccessValidationResult {
    allowed: boolean;
    reason?: DeniedReason;
    isDailyPass?: boolean;
}

export type SerialPortState = "desconectada" | "conectada" | "abriendo" | "error";
