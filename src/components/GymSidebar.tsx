
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
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/app/providers';
import { Logo } from '@/components/Logo';

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
  const { state } = useSidebar();
  
  const handleLogout = () => {
    logout();
    router.push('/login');
  };
  
  return (
    <Sidebar className="border-r" collapsible="icon" data-testid="sidebar">
      <SidebarHeader className="flex h-16 items-center px-4 border-b">
        <Link href="/" className="flex items-center gap-2">
          <Logo withText={state !== 'collapsed'} size={24} textClassName="text-fitgym-white" />
        </Link>
        <div className="ml-auto flex items-center gap-1 md:hidden">
          <SidebarTrigger>
            <Menu className="h-6 w-6" />
          </SidebarTrigger>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel>Menú</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <Link href={item.href} className="flex items-center gap-2">
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2 border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Cerrar Sesión"
            >
              <LogOut className="h-5 w-5 text-red-500" />
              <span className="text-red-500">Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
