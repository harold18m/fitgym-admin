"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Dumbbell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/app/providers";
import { supabase } from "@/lib/supabase";
import Logo from "@/components/Logo";

const formSchema = z.object({
  email: z.string().email({ message: "Correo electrónico inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      console.log("Login data:", values);
      login();
      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido a FitGym",
      });
      router.push("/");
    } catch (error) {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: "Credenciales incorrectas",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      setIsGoogleLoading(true);
      const redirectTo = `${window.location.origin}/login`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) throw error;
      // La redirección ocurre automáticamente; al volver a /login, verificamos la sesión.
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error con Google",
        description: error?.message ?? "No se pudo iniciar sesión con Google",
      });
      setIsGoogleLoading(false);
    }
  }

  useEffect(() => {
    // Si volvemos desde OAuth a /login y hay sesión, activamos auth local y redirigimos.
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          login();
          router.replace("/");
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
          <CardTitle className="text-2xl text-center">Iniciar sesión</CardTitle>
          <CardDescription className="text-center">
            Ingresa tus credenciales para acceder al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
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
                control={form.control}
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
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            aria-label="Iniciar sesión con Google"
            onClick={handleGoogleLogin}
            disabled={isLoading || isGoogleLoading}
          >
            <img src="/google.svg" alt="" aria-hidden="true" className="h-5 w-5" />
            {isGoogleLoading ? "Redirigiendo a Google..." : "Iniciar sesión con Google"}
          </Button>
          <div className="text-sm text-center text-muted-foreground">
            ¿No tienes una cuenta?{" "}
            <Link href="/registro" className="underline">
              Regístrate
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}