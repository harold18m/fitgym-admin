"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminVerification } from "@/hooks/useAdminVerification";
import { useSessionCheck } from "@/hooks/useSessionCheck";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { LoadingSpinner } from "@/components/auth/LoadingSpinner";
import { AUTH_MESSAGES } from "@/lib/auth-utils";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const { existeAdmin, verificandoAdmin } = useAdminVerification();
  const [adminCreated, setAdminCreated] = useState(false);

  // Verificar sesión activa y redirigir si ya está autenticado
  useSessionCheck();

  // Handler para cuando se crea exitosamente el primer admin
  const handleRegisterSuccess = () => {
    setAdminCreated(true);
  };

  // Determinar qué mostrar basado en el estado
  const shouldShowLoginForm = existeAdmin || adminCreated;

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <Logo />
          <CardTitle className="text-2xl text-center">
            {verificandoAdmin
              ? AUTH_MESSAGES.VERIFICATION.LOADING
              : shouldShowLoginForm
                ? AUTH_MESSAGES.VERIFICATION.LOGIN_TITLE
                : AUTH_MESSAGES.VERIFICATION.REGISTER_TITLE}
          </CardTitle>
          <CardDescription className="text-center">
            {verificandoAdmin
              ? AUTH_MESSAGES.VERIFICATION.LOADING_DESCRIPTION
              : shouldShowLoginForm
                ? AUTH_MESSAGES.VERIFICATION.LOGIN_DESCRIPTION
                : AUTH_MESSAGES.VERIFICATION.REGISTER_DESCRIPTION}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {verificandoAdmin ? (
            <LoadingSpinner />
          ) : shouldShowLoginForm ? (
            <LoginForm />
          ) : (
            <RegisterForm onSuccess={handleRegisterSuccess} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}