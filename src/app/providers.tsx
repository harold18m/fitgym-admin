"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  session: null,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const login = () => {
    try {
      localStorage.setItem("fitgym-auth", "true");
    } catch (e) {
      console.error("Error escribiendo fitgym-auth en localStorage", e);
    }
    setIsAuthenticated(true);
  };

  const logout = () => {
    try {
      localStorage.removeItem("fitgym-auth");
    } catch (e) {
      console.error("Error eliminando fitgym-auth de localStorage", e);
    }
    supabase.auth
      .signOut()
      .catch(() => {})
      .finally(() => {
        setIsAuthenticated(false);
        setSession(null);
        setUser(null);
      });
  };

  useEffect(() => {
    // Obtener sesión inicial
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
        setIsAuthenticated(!!data.session);
      } catch (e) {
        // Si falla, caer a localStorage para modo desarrollo
        console.warn("Fallo obteniendo la sesión de Supabase; usando localStorage como fallback", e);
        try {
          const token = localStorage.getItem("fitgym-auth");
          setIsAuthenticated(token === "true");
        } catch (lsErr) {
          console.error("Error leyendo fitgym-auth de localStorage", lsErr);
        }
      }
    })();

    // Suscribirse a cambios de auth
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsAuthenticated(!!newSession);
      try {
        if (newSession) {
          localStorage.setItem("fitgym-auth", "true");
        } else {
          localStorage.removeItem("fitgym-auth");
        }
      } catch (e) {
        console.error("Error actualizando la bandera fitgym-auth en localStorage", e);
      }
    });

    return () => {
      try {
        subscription?.subscription?.unsubscribe();
      } catch (e) {
        console.warn("Error anulando la suscripción de cambios de auth", e);
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, session, login, logout }}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {children}
        </TooltipProvider>
      </QueryClientProvider>
    </AuthContext.Provider>
  );
}