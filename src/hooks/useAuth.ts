import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";

/**
 * Hook personalizado para manejar la autenticación
 * Wrapper sobre useAuthStore para mantener compatibilidad con código existente
 */
export function useAuth() {
    const { isAuthenticated, user, session } = useAuthStore();
    const login = useAuthStore((state) => state.login);
    const logout = useAuthStore((state) => state.logout);

    // Función de logout mejorada que llama a Supabase
    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            logout();
        } catch (error) {
            console.error("Error en logout:", error);
            // Aún así limpiamos el estado local
            logout();
        }
    };

    return {
        isAuthenticated,
        user,
        session,
        login,
        logout: handleLogout,
    };
}
