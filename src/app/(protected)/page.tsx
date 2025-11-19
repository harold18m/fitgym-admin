import {
  Activity,
  Users,
  Calendar,
  TrendingUp
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { PaymentStatusPanel } from "@/components/dashboard/PaymentStatusPanel";
import { getDashboardStats } from "@/lib/data/dashboard";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default async function Dashboard() {
  const stats = await getDashboardStats();

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
          description={`${stats.clientesActivos} con membresía activa`}
          iconColor="text-gym-blue"
        />
        <StatCard
          title="Asistencias Hoy"
          value={String(stats.asistenciasHoy)}
          icon={Activity}
          description={`${stats.aforoActual} personas en el gimnasio`}
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
          value={`S/ ${stats.ingresosHoy.toLocaleString("es-PE")}`}
          icon={TrendingUp}
          description="Ingresos estimados del día"
          iconColor="text-green-500"
        />
      </div>

      <div className="w-full">
        <Suspense fallback={
          <Card className="p-6">
            <Skeleton className="h-[300px] w-full" />
          </Card>
        }>
          <ActivityChart />
        </Suspense>
      </div>

      <div className="lg:col-span-3">
        <Suspense fallback={
          <Card className="p-6">
            <Skeleton className="h-[200px] w-full" />
          </Card>
        }>
          <PaymentStatusPanel />
        </Suspense>
      </div>
    </div>
  );
}