import { useEffect, useState } from "react";

/**
 * Hook para verificar si existe un administrador en el sistema
 */
export function useAdminVerification() {
    const [existeAdmin, setExisteAdmin] = useState<boolean | null>(null);
    const [verificandoAdmin, setVerificandoAdmin] = useState(true);

    useEffect(() => {
        async function verificarAdmin() {
            try {
                const response = await fetch("/api/auth/verificar-admin", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    cache: "no-store",
                });

                // Verificar el tipo de contenido de la respuesta
                const contentType = response.headers.get("content-type");

                if (!contentType || !contentType.includes("application/json")) {
                    console.error("La respuesta no es JSON. Content-Type:", contentType);
                    console.error("Status:", response.status);
                    const text = await response.text();
                    console.error("Respuesta recibida:", text.substring(0, 200));
                    throw new Error("El servidor no devolvió JSON. Puede ser un error de enrutamiento.");
                }

                const data = await response.json();

                if (!response.ok) {
                    console.error("Error en la respuesta:", data);
                    throw new Error(data.error || "Error al verificar administrador");
                }

                console.log("✅ Verificación de admin exitosa:", data);
                setExisteAdmin(data.existeAdmin);
            } catch (error) {
                console.error("❌ Error verificando admin:", error);
                // En caso de error, asumir que no existe admin para permitir creación
                setExisteAdmin(false);
            } finally {
                setVerificandoAdmin(false);
            }
        }

        verificarAdmin();
    }, []);

    return { existeAdmin, verificandoAdmin };
}
