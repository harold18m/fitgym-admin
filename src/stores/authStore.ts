import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    session: Session | null;
    login: (user: User, session: Session) => void;
    logout: () => void;
    updateUser: (userData: Partial<User>) => void;
    setSession: (session: Session | null) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            isAuthenticated: false,
            user: null,
            session: null,
            login: (user, session) =>
                set({
                    isAuthenticated: true,
                    user,
                    session,
                }),
            logout: () =>
                set({
                    isAuthenticated: false,
                    user: null,
                    session: null,
                }),
            updateUser: (userData) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...userData } : null,
                })),
            setSession: (session) =>
                set({
                    session,
                    user: session?.user ?? null,
                    isAuthenticated: !!session,
                }),
        }),
        {
            name: "fitgym-auth",
        }
    )
);
