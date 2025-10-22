import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, RefreshCw, QrCode } from "lucide-react";

interface ClienteItem {
  id: string;
  nombre: string;
  dni: string | null;
  avatar_url: string | null;
  fecha_fin: string | null;
  estado: string | null;
  nombre_membresia: string | null;
}

export default function Acceso() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<ClienteItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const canSearch = useMemo(() => query.trim().length >= 2, [query]);

  const getStatus = (fechaFin: string | null): 'activa' | 'por_vencer' | 'vencida' => {
    if (!fechaFin) return 'activa';
    const today = new Date();
    const end = new Date(fechaFin);
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const diffDays = Math.ceil((startOfEnd.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'vencida';
    if (diffDays <= 3) return 'por_vencer';
    return 'activa';
  };

  const getStatusBadge = (fechaFin: string | null) => {
    const status = getStatus(fechaFin);
    const text = status === 'activa' ? 'ACTIVO' : status === 'por_vencer' ? 'POR VENCER' : 'VENCIDO';
    const variant = status === 'vencida' ? 'destructive' : 'secondary';
    const extraClass = status === 'por_vencer' ? 'text-orange-500' : status === 'activa' ? 'text-gym-green' : '';
    return <Badge variant={variant} className={`text-xs ${extraClass}`}>{text}</Badge>;
  };

  const buscar = async () => {
    if (!canSearch) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/clientes?search=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Error buscando clientes');
      const json = await res.json();
      // La API devuelve { clientes: [...] }
      setClientes(json.clientes || []);
    } catch (e: any) {
      setError(e?.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const registrarPago = async (id: string) => {
    try {
      const res = await fetch(`/api/clientes/${id}/pago`, { method: 'POST' });
      if (!res.ok) throw new Error('No se pudo registrar el pago');
      // Refrescar resultados
      await buscar();
    } catch (e) {
      alert('Error registrando pago');
      console.error(e);
    }
  };

  useEffect(() => {
    // Búsqueda inicial opcional: no hacer nada
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Acceso</h2>
        <p className="text-muted-foreground">Validación rápida por DNI o nombre</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Buscar Cliente</span>
          </CardTitle>
          <CardDescription>Ingresa DNI o nombre para validar acceso</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              placeholder="DNI o nombre (min 2 caracteres)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={buscar} disabled={!canSearch || loading}>
              Buscar
            </Button>
            <Button variant="outline" disabled>
              <QrCode className="h-4 w-4 mr-2" /> Escanear QR (próximamente)
            </Button>
          </div>
          {loading && (
            <p className="text-sm text-muted-foreground mt-2">Buscando...</p>
          )}
          {error && (
            <p className="text-sm text-destructive mt-2">{error}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
          <CardDescription>Coincidencias de búsqueda</CardDescription>
        </CardHeader>
        <CardContent>
          {clientes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin resultados</p>
          ) : (
            <div className="space-y-3">
              {clientes.map((c) => {
                const initials = c.nombre.split(' ').map(n => n[0]).join('');
                const fecha = c.fecha_fin ? new Date(c.fecha_fin).toLocaleDateString() : '—';
                return (
                  <div key={c.id} className="flex items-center justify-between space-x-3 p-3 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-none">{c.nombre} {c.dni ? `· DNI ${c.dni}` : ''}</p>
                        <p className="text-xs text-muted-foreground">{c.nombre_membresia || 'Sin membresía'} · Fin: {fecha}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(c.fecha_fin)}
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
    </div>
  );
}