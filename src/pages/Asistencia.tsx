
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  QrCode, 
  UserCheck, 
  Clock, 
  Calendar, 
  CheckCircle, 
  XCircle,
  Camera,
  CameraOff
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase";


const estadoStyle = {
  activa: "bg-green-500",
  vencida: "bg-red-500",
  pendiente: "bg-yellow-500",
};

// Estado de membresía (verde/rojo) como en Acceso
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

export default function Asistencia() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dniInput, setDniInput] = useState("");
  const [clientes, setClientes] = useState<Database["public"]["Tables"]["clientes"]["Row"][]>([]);
  const [asistencias, setAsistencias] = useState<Database["public"]["Tables"]["asistencias"]["Row"][]>([]);
  const [modoAsistencia, setModoAsistencia] = useState<"qr" | "dni">("dni");
  const [qrManual, setQrManual] = useState("");
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const { toast } = useToast();

  // Escáner QR (carga dinámica en cliente)
  const QrScanner = dynamic(
    () => import("@yudiel/react-qr-scanner").then((mod) => mod.Scanner),
    { ssr: false }
  );

  useEffect(() => {
    loadClientes();
    loadAsistencias();
  }, []);

  const loadClientes = async () => {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({
        variant: "destructive",
        title: "Error cargando clientes",
        description: error.message,
      });
      return;
    }

    const clientesBase = (data || []) as Database["public"]["Tables"]["clientes"]["Row"][];

    // Si no hay nombre_membresia/tipo_membresia, intentar enriquecer usando la relación membresia_id
    const membresiaIds = Array.from(
      new Set(
        clientesBase
          .map((c) => c.membresia_id)
          .filter((id): id is string => Boolean(id))
      )
    );

    if (membresiaIds.length > 0) {
      const { data: membresiasData, error: membresiasError } = await supabase
        .from("membresias")
        .select("id, nombre, tipo")
        .in("id", membresiaIds);

      if (!membresiasError && membresiasData) {
        const mapaMembresias = new Map(membresiasData.map((m) => [m.id, m]));
        const enriquecidos: Database["public"]["Tables"]["clientes"]["Row"][] = clientesBase.map((c) => {
          const m = c.membresia_id ? mapaMembresias.get(c.membresia_id) : undefined;
          return {
            ...c,
            nombre_membresia: c.nombre_membresia ?? (m ? m.nombre : null),
            tipo_membresia: c.tipo_membresia ?? (m ? m.tipo : null),
          } as Database["public"]["Tables"]["clientes"]["Row"];
        });
        setClientes(enriquecidos);
        return;
      }
    }

    setClientes(clientesBase);
  };

  const loadAsistencias = async () => {
    const { data, error } = await supabase
      .from("asistencias")
      .select("*")
      .order("fecha_asistencia", { ascending: false })
      .limit(100);
    if (error) {
      toast({
        variant: "destructive",
        title: "Error cargando asistencias",
        description: error.message,
      });
      return;
    }
    setAsistencias((data || []) as Database["public"]["Tables"]["asistencias"]["Row"][]);
  };

  const registrarAsistencia = async (cliente: Database["public"]["Tables"]["clientes"]["Row"], tipo: "qr" | "dni") => {
    if (cliente.estado === "vencida" || cliente.estado === "suspendida") {
      toast({
        variant: "destructive",
        title: "Error de registro",
        description: "La membresía de este cliente no está activa.",
      });
      return;
    }

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: yaHoy, error: errorCheck } = await supabase
      .from("asistencias")
      .select("id")
      .eq("cliente_id", cliente.id)
      .gte("fecha_asistencia", startOfDay.toISOString())
      .lte("fecha_asistencia", endOfDay.toISOString());

    if (errorCheck) {
      toast({
        variant: "destructive",
        title: "Error de verificación",
        description: errorCheck.message,
      });
      return;
    }

    if (yaHoy && yaHoy.length > 0) {
      toast({
        variant: "destructive",
        title: "Registro duplicado",
        description: `${cliente.nombre} ya registró su asistencia hoy.`,
      });
      return;
    }

    const { data: inserted, error: errorInsert } = await supabase
      .from("asistencias")
      .insert({
        cliente_id: cliente.id,
        estado: "presente",
        notas: tipo,
      })
      .select("*")
      .single();

    if (errorInsert) {
      toast({
        variant: "destructive",
        title: "Error registrando asistencia",
        description: errorInsert.message,
      });
      return;
    }

    setAsistencias((prev) => (inserted ? [inserted as Database["public"]["Tables"]["asistencias"]["Row"], ...prev] : prev));

    const hora = new Date(inserted?.fecha_asistencia || Date.now())
      .toTimeString()
      .split(" ")[0];
    toast({
      title: "Asistencia registrada",
      description: `${cliente.nombre} ha registrado su asistencia a las ${hora}.`,
    });

    setDniInput("");
  };

  const registrarPorDNI = async () => {
    if (!dniInput) {
      toast({
        variant: "destructive",
        title: "Error de registro",
        description: "Por favor, ingresa un DNI válido.",
      });
      return;
    }

    const { data: cliente, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("dni", dniInput)
      .maybeSingle();

    if (error) {
      toast({
        variant: "destructive",
        title: "Error buscando cliente",
        description: error.message,
      });
      return;
    }

    if (!cliente) {
      toast({
        variant: "destructive",
        title: "Cliente no encontrado",
        description: "No existe un cliente con el DNI ingresado.",
      });
      return;
    }

    await registrarAsistencia(cliente as Database["public"]["Tables"]["clientes"]["Row"], "dni");
  };
  
  const registrarPorQRTexto = async (texto: string) => {
    const contenido = texto.trim();
    if (!contenido) {
      toast({
        variant: "destructive",
        title: "QR vacío",
        description: "El contenido del QR no es válido.",
      });
      return;
    }

    let cliente: Database["public"]["Tables"]["clientes"]["Row"] | null = null;

    if (contenido.startsWith("CLIENT:")) {
      const id = contenido.slice("CLIENT:".length);
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) {
        toast({ variant: "destructive", title: "Error buscando cliente", description: error.message });
        return;
      }
      cliente = (data || null) as any;
    } else {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("dni", contenido)
        .maybeSingle();
      if (error) {
        toast({ variant: "destructive", title: "Error buscando cliente", description: error.message });
        return;
      }
      cliente = (data || null) as any;
    }

    if (!cliente) {
      toast({ variant: "destructive", title: "Cliente no encontrado", description: "El QR no coincide con ningún cliente." });
      return;
    }

    await registrarAsistencia(cliente, "qr");
  };

  // Obtener clientes de las asistencias (unir asistencias con clientes)
  const clientesConAsistencia = asistencias
    .filter((asistencia) => {
      const cliente = clientes.find((c) => c.id === asistencia.cliente_id);
      const nombreMatch = cliente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
      const dniMatch = (cliente?.dni || "").includes(searchTerm);
      const fechaMatch = new Date(asistencia.fecha_asistencia)
        .toLocaleDateString()
        .includes(searchTerm);
      return Boolean(nombreMatch || dniMatch || fechaMatch);
    })
    .map((asistencia) => {
      const cliente = clientes.find((c) => c.id === asistencia.cliente_id);
      const fecha = new Date(asistencia.fecha_asistencia);
      const hora = fecha.toTimeString().split(" ")[0];
      const tipo = asistencia.notas === "qr" ? "qr" : "dni";
      return {
        asistencia: {
          id: asistencia.id,
          fecha: asistencia.fecha_asistencia,
          hora,
          tipo,
        },
        cliente,
      };
    });
    
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold">Control de Asistencia</h2>
        <p className="text-muted-foreground">
          Registro de entradas al gimnasio mediante código QR o DNI
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Registro de Asistencia</CardTitle>
            <CardDescription>
              Selecciona el método de verificación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Button
                variant={modoAsistencia === "dni" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setModoAsistencia("dni")}
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Por DNI
              </Button>
              <Button
                variant={modoAsistencia === "qr" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setModoAsistencia("qr")}
              >
                <QrCode className="mr-2 h-4 w-4" />
                Por QR
              </Button>
            </div>

            {modoAsistencia === "dni" ? (
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Ingresa el número de DNI"
                    value={dniInput}
                    onChange={(e) => setDniInput(e.target.value)}
                  />
                  <Button onClick={registrarPorDNI}>Verificar</Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Ingresa el DNI del cliente y presiona Verificar para registrar su asistencia.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant={cameraEnabled ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setCameraEnabled((v) => !v)}
                  >
                    {cameraEnabled ? (
                      <>
                        <CameraOff className="mr-2 h-4 w-4" />
                        Desactivar cámara
                      </>
                    ) : (
                      <>
                        <Camera className="mr-2 h-4 w-4" />
                        Activar cámara
                      </>
                    )}
                  </Button>
                </div>
                {cameraEnabled && (
                  <div className="rounded-md border overflow-hidden">
                    <QrScanner
                      constraints={{ facingMode: "environment" }}
                      scanDelay={500}
                      onScan={(detected) => {
                        const text = detected?.[0]?.rawValue || "";
                        if (text) {
                          registrarPorQRTexto(text);
                        }
                      }}
                      onError={() => {
                        /* Silencio errores menores de cámara */
                      }}
                      styles={{ container: { width: "100%", aspectRatio: "16/9" } }}
                    />
                  </div>
                )}
                <div className="flex space-x-2">
                  <Input
                    placeholder="Pega el contenido del QR o DNI"
                    value={qrManual}
                    onChange={(e) => setQrManual(e.target.value)}
                  />
                  <Button onClick={() => registrarPorQRTexto(qrManual)}>Verificar</Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Escanea el código QR del cliente con la cámara o pega su contenido manualmente.
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimas Asistencias</CardTitle>
            <CardDescription className="flex items-center justify-between">
              <span>Registro de hoy: {new Date().toLocaleDateString()}</span>
              <Badge variant="outline" className="ml-2">
                <Clock className="mr-1 h-3 w-3" />
                <span>
                  {asistencias.filter(
                    (a) => new Date(a.fecha_asistencia).toDateString() === new Date().toDateString()
                  ).length}{" "}
                  hoy
                </span>
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, DNI o fecha..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="h-[300px] overflow-auto">
              {clientesConAsistencia.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Membresía</TableHead>
                      <TableHead>Vence</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Método</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientesConAsistencia.map(({ asistencia, cliente }) => (
                      <TableRow key={asistencia.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Avatar>
                              <AvatarImage src={cliente?.avatar_url || undefined} />
                              <AvatarFallback>
                                {cliente?.nombre
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{cliente?.nombre}</p>
                              <p className="text-xs text-muted-foreground">
                                DNI: {cliente?.dni}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(asistencia.fecha).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{asistencia.hora}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{cliente?.nombre_membresia ?? "Sin membresía"}</p>
                            <p className="text-xs text-muted-foreground">{cliente?.tipo_membresia ?? ""}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {cliente?.fecha_fin ? new Date(cliente.fecha_fin).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(cliente?.fecha_fin ?? null)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="flex items-center space-x-1"
                          >
                            {asistencia.tipo === "qr" ? (
                              <QrCode className="h-3 w-3 mr-1" />
                            ) : (
                              <UserCheck className="h-3 w-3 mr-1" />
                            )}
                            {asistencia.tipo === "qr" ? "QR" : "DNI"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
                  <p>No hay registros de asistencia que coincidan con la búsqueda.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
