import { format, parse } from "date-fns";

/**
 * Formato estándar para almacenar fechas (yyyy-MM-dd)
 * Compatible con SQL DATE y fácil de parsear
 */
export const DATE_STORAGE_FORMAT = "yyyy-MM-dd";

/**
 * Formato estándar para mostrar fechas (dd/MM/yyyy)
 */
export const DATE_DISPLAY_FORMAT = "dd/MM/yyyy";

/**
 * Convierte un objeto Date o string ISO a formato yyyy-MM-dd
 * @param date - Date object, string ISO, o null/undefined
 * @returns String en formato yyyy-MM-dd o empty string si inválido
 */
export function formatDateToStorage(date: Date | string | null | undefined): string {
    if (!date) return "";

    try {
        if (typeof date === "string") {
            // Si ya está en formato yyyy-MM-dd, devolverlo
            if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                return date;
            }
            // Si es ISO completo con zona horaria (2025-10-30T00:00:00.000Z)
            // Extraer solo la parte de fecha YYYY-MM-DD
            if (/^\d{4}-\d{2}-\d{2}T/.test(date)) {
                return date.split('T')[0];
            }
            // Si es ISO string, parsear y formatear
            const parsed = new Date(date);
            if (!isNaN(parsed.getTime())) {
                return format(parsed, DATE_STORAGE_FORMAT);
            }
        } else if (date instanceof Date && !isNaN(date.getTime())) {
            return format(date, DATE_STORAGE_FORMAT);
        }
    } catch (error) {
        console.warn("Error formateando fecha:", date, error);
    }

    return "";
}

/**
 * Convierte una fecha en formato yyyy-MM-dd a formato dd/MM/yyyy para mostrar
 * @param date - String en formato yyyy-MM-dd, ISO completo, o Date object
 * @returns String en formato dd/MM/yyyy o empty string si inválido
 */
export function formatDateToDisplay(date: Date | string | null | undefined): string {
    if (!date) return "";

    try {
        let dateToFormat: Date;

        if (typeof date === "string") {
            // Si es ISO completo con zona horaria (2025-10-30T00:00:00.000Z)
            // Extraer solo la parte de fecha YYYY-MM-DD
            if (/^\d{4}-\d{2}-\d{2}T/.test(date)) {
                const dateOnly = date.split('T')[0];
                dateToFormat = parse(dateOnly, DATE_STORAGE_FORMAT, new Date());
            } else {
                // Si es yyyy-MM-dd o cualquier otro formato
                dateToFormat = parse(date, DATE_STORAGE_FORMAT, new Date());
            }
        } else if (date instanceof Date) {
            // Si es un Date object directamente
            dateToFormat = date;
        } else {
            return "";
        }

        if (!isNaN(dateToFormat.getTime())) {
            return format(dateToFormat, DATE_DISPLAY_FORMAT);
        }
    } catch (error) {
        console.warn("Error formateando fecha para mostrar:", date, error);
    }

    return "";
}

/**
 * Convierte un Date object de Prisma a string yyyy-MM-dd
 * Útil cuando se reciben datos del API
 */
export function parsePrismaDate(date: Date | null | undefined): string {
    return formatDateToStorage(date);
}

/**
 * Valida si una fecha en formato yyyy-MM-dd es válida
 */
export function isValidDateString(dateString: string | null | undefined): boolean {
    if (!dateString || dateString.trim() === "") return false;

    try {
        const parsed = parse(dateString, DATE_STORAGE_FORMAT, new Date());
        return !isNaN(parsed.getTime());
    } catch {
        return false;
    }
}

/**
 * Calcula la edad en años cumplidos a partir de una fecha de nacimiento
 * Acepta Date, ISO string, o yyyy-MM-dd.
 * Retorna null si la fecha es inválida.
 */
export function calculateAge(date: Date | string | null | undefined): number | null {
    if (!date) return null;
    let birth: Date | null = null;

    try {
        if (date instanceof Date) {
            birth = date;
        } else if (typeof date === 'string') {
            if (/^\d{4}-\d{2}-\d{2}T/.test(date)) {
                // ISO completa -> tomar solo fecha
                const dateOnly = date.split('T')[0];
                birth = parse(dateOnly, DATE_STORAGE_FORMAT, new Date());
            } else if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                birth = parse(date, DATE_STORAGE_FORMAT, new Date());
            } else {
                // Intento parsear como ISO genérica
                const parsed = new Date(date);
                if (!isNaN(parsed.getTime())) birth = parsed;
            }
        }
    } catch {
        birth = null;
    }

    if (!birth || isNaN(birth.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const hasNotHadBirthdayYet =
        today.getMonth() < birth.getMonth() ||
        (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
    if (hasNotHadBirthdayYet) age -= 1;
    return age >= 0 && age < 130 ? age : null; // sanity bounds
}
