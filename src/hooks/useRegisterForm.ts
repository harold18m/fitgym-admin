import { useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { registroFormSchema, type RegistroFormValues } from "@/lib/validations/auth-schemas";
import { AUTH_MESSAGES } from "@/lib/auth-utils";

interface UseRegisterFormProps {
    onSuccess?: (email: string) => void;
}

/**
 * Hook para manejar el formulario de registro del primer admin
 */
export function useRegisterForm({ onSuccess }: UseRegisterFormProps = {}) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<RegistroFormValues>({
        resolver: zodResolver(registroFormSchema),
        defaultValues: {
            nombre: "",
            email: "",
            password: "",
            confirmarPassword: "",
        },
    });

    async function onSubmit(values: RegistroFormValues) {
        setIsLoading(true);
        try {
            const response = await fetch("/api/auth/registrar-primer-admin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: values.email,
                    password: values.password,
                    nombre: values.nombre,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Error al crear el administrador");
            }

            toast({
                title: AUTH_MESSAGES.REGISTER.SUCCESS_TITLE,
                description: AUTH_MESSAGES.REGISTER.SUCCESS_DESCRIPTION,
            });

            // Resetear el formulario
            form.reset();

            // Llamar callback de éxito si existe
            onSuccess?.(values.email);
        } catch (error: any) {
            console.error("Error en registro:", error);
            toast({
                variant: "destructive",
                title: AUTH_MESSAGES.REGISTER.ERROR_TITLE,
                description: error?.message || AUTH_MESSAGES.REGISTER.ERROR_DESCRIPTION,
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
