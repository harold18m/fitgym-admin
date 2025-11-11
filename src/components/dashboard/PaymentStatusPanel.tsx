import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { authenticatedGet, authenticatedPost } from "@/lib/fetch-utils";

interface ClienteItem {
  id: string;
  nombre: string;
  avatar_url: string | null;
  fecha_fin: string | null;
  nombre_membresia: string | null;
}

interface DashboardPagosResponse {
  activos: ClienteItem[];
  porVencer: ClienteItem[];
  vencidos: ClienteItem[];
}

export function PaymentStatusPanel() {
  const [data, setData] = useState<DashboardPagosResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await authenticatedGet<DashboardPagosResponse>("/api/pagos/dashboard");
      setData(json);
    } catch (e: any) {
      setError(e?.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const registrarPago = async (clienteId: string) => {
    try {
      await authenticatedPost(`/api/clientes/${clienteId}/pago`, {});
      await fetchData();
    } catch (e) {
      console.error(e);
      alert("Error registrando pago");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const Section = ({
    title,
    description,
    icon,
    colorClass,
    items,
  }: {
    title: string;
    description: string;
    icon: JSX.Element;
    colorClass: string;
    items: ClienteItem[];
  }) => (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span className={colorClass}>{icon}</span>
          <span>{title}</span>
          {data && (
            <Badge variant="secondary" className="ml-2">{items.length}</Badge>
          )}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin resultados</p>
        ) : (
          <div className="space-y-3">
            {items.slice(0, 6).map((c) => {
              const initials = c.nombre.split(" ").map((n) => n[0]).join("");
              const fecha = c.fecha_fin ? new Date(c.fecha_fin).toLocaleDateString() : "—";
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between space-x-3 p-3 rounded-lg border"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">{c.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.nombre_membresia || "Sin membresía"} · Fin: {fecha}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      title="Registrar pago y extender"
                      onClick={() => registrarPago(c.id)}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
      <Section
        title="Activos"
        description="Clientes con pago vigente"
        icon={<CheckCircle className="h-5 w-5" />}
        colorClass="text-gym-green"
        items={data?.activos || []}
      />
      <Section
        title="Por Vencer (≤3 días)"
        description="Clientes cuyas membresías vencen pronto"
        icon={<AlertTriangle className="h-5 w-5" />}
        colorClass="text-orange-500"
        items={data?.porVencer || []}
      />
      <Section
        title="Vencidos"
        description="Clientes con membresía vencida"
        icon={<XCircle className="h-5 w-5" />}
        colorClass="text-red-500"
        items={data?.vencidos || []}
      />
    </div>
  );
}