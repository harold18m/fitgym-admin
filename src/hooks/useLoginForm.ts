import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { loginFormSchema, type LoginFormValues } from "@/lib/validations/auth-schemas";
import { isAdminUser, AUTH_MESSAGES } from "@/lib/auth-utils";

/**
 * Hook para manejar el formulario de login
 */
export function useLoginForm() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    const { login } = useAuth();

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginFormSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: LoginFormValues) {
        setIsLoading(true);
        try {
            // Intentar login con Supabase Auth
            const { data, error } = await supabase.auth.signInWithPassword({
                email: values.email,
                password: values.password,
            });

            if (error) throw error;

            // Verificar que el usuario tenga rol admin
            if (!isAdminUser(data.user)) {
                // Si no es admin, cerrar sesión inmediatamente
                await supabase.auth.signOut();
                throw new Error(AUTH_MESSAGES.LOGIN.ADMIN_ONLY);
            }

            // Si es admin, actualizar el estado de autenticación
            if (data.user && data.session) {
                login(data.user, data.session);
            }

            toast({
                title: AUTH_MESSAGES.LOGIN.SUCCESS_TITLE,
                description: AUTH_MESSAGES.LOGIN.SUCCESS_DESCRIPTION,
            });

            router.push("/");
        } catch (error: any) {
            console.error("Error en login:", error);
            toast({
                variant: "destructive",
                title: AUTH_MESSAGES.LOGIN.ERROR_TITLE,
                description: error?.message || AUTH_MESSAGES.LOGIN.ERROR_DESCRIPTION,
            });
        } finally {
            setIsLoading(false);
        }
    }

    return {
        form,
        isLoading,
        onSubmit,
    };
}
