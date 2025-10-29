"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/app/providers";
import { supabase } from "@/lib/supabase";
import Logo from "@/components/Logo";

const loginFormSchema = z.object({
  email: z.string().email({ message: "Correo electrónico inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

const registroFormSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  email: z.string().email({ message: "Correo electrónico inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
  confirmarPassword: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
}).refine((data) => data.password === data.confirmarPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmarPassword"],
});

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [existeAdmin, setExisteAdmin] = useState<boolean | null>(null);
  const [verificandoAdmin, setVerificandoAdmin] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();

  const loginForm = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registroForm = useForm<z.infer<typeof registroFormSchema>>({
    resolver: zodResolver(registroFormSchema),
    defaultValues: {
      nombre: "",
      email: "",
      password: "",
      confirmarPassword: "",
    },
  });

  async function onLoginSubmit(values: z.infer<typeof loginFormSchema>) {
    setIsLoading(true);
    try {
      // Intentar login con Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) throw error;

      // Verificar que el usuario tenga rol admin en metadata
      const userMetadata = data.user?.user_metadata;
      const appMetadata = data.user?.app_metadata;

      // Buscar el rol en user_metadata o app_metadata
      const rol = userMetadata?.rol || appMetadata?.rol;

      if (rol !== 'admin') {
        // Si no es admin, cerrar sesión inmediatamente
        await supabase.auth.signOut();
        throw new Error('Solo usuarios administradores pueden acceder al sistema');
      }

      // Si es admin, proceder con el login
      login();
      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido al sistema de administración",
      });
      router.push("/");
    } catch (error: any) {
      console.error("Error en login:", error);
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: error?.message || "Credenciales incorrectas o sin permisos de administrador",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function onRegistroSubmit(values: z.infer<typeof registroFormSchema>) {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/registrar-primer-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          nombre: values.nombre,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el administrador');
      }

      toast({
        title: "Administrador creado exitosamente",
        description: "Ahora puedes iniciar sesión con tus credenciales",
      });

      // Resetear el formulario y cambiar a modo login
      registroForm.reset();
      setExisteAdmin(true);

      // Auto-llenar el email en el formulario de login
      loginForm.setValue('email', values.email);

    } catch (error: any) {
      console.error("Error en registro:", error);
      toast({
        variant: "destructive",
        title: "Error al crear administrador",
        description: error?.message || "No se pudo crear el usuario administrador",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Verificar si existe un admin al cargar la página
  useEffect(() => {
    async function verificarAdmin() {
      try {
        const response = await fetch('/api/auth/verificar-admin');
        const data = await response.json();
        setExisteAdmin(data.existeAdmin);
      } catch (error) {
        console.error('Error verificando admin:', error);
        setExisteAdmin(false);
      } finally {
        setVerificandoAdmin(false);
      }
    }

    verificarAdmin();
  }, []);

  useEffect(() => {
    // Verificar si ya hay una sesión activa al cargar la página
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          // Verificar que sea admin antes de redirigir
          const userMetadata = data.session.user?.user_metadata;
          const appMetadata = data.session.user?.app_metadata;
          const rol = userMetadata?.rol || appMetadata?.rol;

          if (rol === 'admin') {
            login();
            router.replace("/");
          } else {
            // Si no es admin, cerrar la sesión
            await supabase.auth.signOut();
          }
        }
      } catch (e) {
        console.error("Error verificando sesión de Supabase", e);
      }
    })();
  }, [login, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <Logo />
          <CardTitle className="text-2xl text-center">
            {verificandoAdmin
              ? "Cargando..."
              : existeAdmin
                ? "Iniciar sesión"
                : "Crear administrador"}
          </CardTitle>
          <CardDescription className="text-center">
            {verificandoAdmin
              ? "Verificando configuración del sistema..."
              : existeAdmin
                ? "Ingresa tus credenciales para acceder al sistema"
                : "No hay administradores. Crea el primer usuario administrador para comenzar."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {verificandoAdmin ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : existeAdmin ? (
            // Formulario de LOGIN
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electrónico</FormLabel>
                      <FormControl>
                        <Input placeholder="correo@ejemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
                </Button>
              </form>
            </Form>
          ) : (
            // Formulario de REGISTRO (solo si no existe admin)
            <Form {...registroForm}>
              <form onSubmit={registroForm.handleSubmit(onRegistroSubmit)} className="space-y-4">
                <FormField
                  control={registroForm.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Tu nombre" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registroForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electrónico</FormLabel>
                      <FormControl>
                        <Input placeholder="correo@ejemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registroForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registroForm.control}
                  name="confirmarPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Repite la contraseña" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creando administrador..." : "Crear administrador"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}