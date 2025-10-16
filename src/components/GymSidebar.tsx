
"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Dumbbell, 
  MessageSquare, 
  Users, 
  Calendar, 
  Settings, 
  Bot,
  Menu,
  LogOut,
  Fingerprint,
  CreditCard,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { useAuth } from '@/app/providers';

type SidebarItem = {
  icon: React.ElementType;
  label: string;
  href: string;
};

const sidebarItems: SidebarItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: User, label: 'Perfil', href: '/perfil' },
  { icon: Fingerprint, label: 'Asistencia', href: '/asistencia' },
  { icon: Users, label: 'Clientes', href: '/clientes' },
  { icon: CreditCard, label: 'Membresías', href: '/membresias' },
  { icon: Dumbbell, label: 'Ejercicios', href: '/ejercicios' },
  { icon: MessageSquare, label: 'WhatsApp', href: '/whatsapp' },
  { icon: Calendar, label: 'Calendario', href: '/calendario' },
  { icon: Bot, label: 'ChatBot', href: '/chatbot' },
  { icon: Settings, label: 'Configuración', href: '/configuracion' },
];

export function GymSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  
  const handleLogout = () => {
    logout();
    router.push('/login');
  };
  
  return (
    <Sidebar className="border-r" data-testid="sidebar">
      <SidebarHeader className="flex h-16 items-center px-4 border-b">
        <Link href="/" className="flex items-center gap-2">
          <Dumbbell className="h-6 w-6 text-fitgym-white" />
          <span className="font-bold text-lg text-fitgym-white">FitGym</span>
        </Link>
        <div className="ml-auto flex items-center gap-1 md:hidden">
          <SidebarTrigger>
            <Menu className="h-6 w-6" />
          </SidebarTrigger>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <div className="flex flex-col gap-1">
          {sidebarItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-2",
                  pathname === item.href && "bg-accent text-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </SidebarContent>
      <SidebarFooter className="p-2 border-t">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-2 text-red-500 hover:text-red-700"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          <span>Cerrar Sesión</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
