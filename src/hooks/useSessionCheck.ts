import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { isAdminUser } from "@/lib/auth-utils";

/**
 * Hook para verificar si ya existe una sesión activa al cargar la página
 * Redirige automáticamente si el usuario ya está autenticado como admin
 */
export function useSessionCheck() {
    const { login } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data } = await supabase.auth.getSession();

                if (data.session?.user) {
                    // Verificar que sea admin antes de redirigir
                    if (isAdminUser(data.session.user)) {
                        login(data.session.user, data.session);
                        router.replace("/");
                    } else {
                        // Si no es admin, cerrar la sesión
                        await supabase.auth.signOut();
                    }
                }
            } catch (error) {
                console.error("Error verificando sesión de Supabase", error);
            }
        };

        checkSession();
    }, [login, router]);
}
