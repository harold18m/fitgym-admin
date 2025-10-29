"use client";
import {
  Activity,
  Users,
  Calendar,
  TrendingUp
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { PaymentStatusPanel } from "@/components/dashboard/PaymentStatusPanel";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalClientes: 0,
    asistenciasHoy: 0,
    clasesHoy: 0,
    ingresosHoy: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/stats');

        if (!response.ok) {
          throw new Error('Error al cargar estadísticas');
        }

        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error al cargar métricas del dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Resumen de actividad del gimnasio
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Clientes Totales"
          value={String(stats.totalClientes)}
          icon={Users}
          description="+12% desde el mes pasado"
          iconColor="text-gym-blue"
        />
        <StatCard
          title="Asistencias Hoy"
          value={String(stats.asistenciasHoy)}
          icon={Activity}
          description="Actualizado en tiempo real"
          iconColor="text-gym-green"
        />
        <StatCard
          title="Clases Hoy"
          value={String(stats.clasesHoy)}
          icon={Calendar}
          description="Clases programadas para hoy"
          iconColor="text-gym-purple"
        />
        <StatCard
          title="Ingresos"
          value={`$${stats.ingresosHoy.toLocaleString("en-US")}`}
          icon={TrendingUp}
          description="Ingresos estimados del día"
          iconColor="text-green-500"
        />
      </div>

      <div className="w-full">
        <ActivityChart />
      </div>
      <div className="lg:col-span-3">
        <PaymentStatusPanel />
      </div>
    </div>
  );
}