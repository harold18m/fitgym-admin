
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
  Fingerprint,
  CreditCard,
  User
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
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

const sidebarSections: { label: string; items: SidebarItem[] }[] = [
  {
    label: 'Principal',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
      { icon: User, label: 'Perfil', href: '/perfil' },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { icon: Fingerprint, label: 'Asistencia', href: '/asistencia' },
      { icon: Users, label: 'Clientes', href: '/clientes' },
      { icon: CreditCard, label: 'Membresías', href: '/membresias' },
      { icon: Dumbbell, label: 'Ejercicios', href: '/ejercicios' },
      { icon: Calendar, label: 'Calendario', href: '/calendario' },
    ],
  },
  {
    label: 'Comunicaciones',
    items: [
      { icon: MessageSquare, label: 'WhatsApp', href: '/whatsapp' },
      { icon: Bot, label: 'ChatBot', href: '/chatbot' },
      { icon: Settings, label: 'Configuración', href: '/configuracion' },
    ],
  },
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
    <Sidebar className="border-r" variant="floating" collapsible="icon" data-testid="sidebar">
      <SidebarHeader className="flex h-16 items-center px-4 border-b">
        <Link href="/" className="flex items-center gap-2">
          <Logo withText={false} size={24} textClassName="text-fitgym-white" />
        </Link>
        <div className="ml-auto flex items-center gap-1 md:hidden">
          <SidebarTrigger>
            <Menu className="h-6 w-6" />
          </SidebarTrigger>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-3 md:p-4">
        {sidebarSections.map((section, idx) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="text-xs tracking-wide uppercase text-sidebar-foreground/60">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={item.label}
                      size="lg"
                      className="rounded-lg gap-3"
                    >
                      <Link href={item.href} className="flex items-center gap-3">
                        <span className="inline-flex"><item.icon className="h-5 w-5" /></span>
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
            {idx < sidebarSections.length - 1 && (
              <SidebarSeparator />
            )}
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
