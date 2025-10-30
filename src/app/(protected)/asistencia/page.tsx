"use client";

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
  Camera,
  CameraOff,
  Maximize2,
  Minimize2,
  X
} from "lucide-react";
import { useAsistencias, type AsistenciaConCliente } from "@/hooks/useAsistencias";

interface Cliente {
  id: string;
  nombre: string;
  dni: string | null;
  email: string;
  telefono: string;
  fecha_nacimiento: Date | string;
  membresia_id: string | null;
  nombre_membresia: string | null;
  tipo_membresia: string | null;
  fecha_inicio: Date | string | null;
  fecha_fin: Date | string | null;
  estado: string;
  avatar_url: string | null;
}


const estadoStyle = {
  activa: "bg-green-500",
  vencida: "bg-red-500",
  pendiente: "bg-yellow-500",
};

// Estado de membresía (verde/rojo) como en Acceso
const getStatus = (fechaFin: string | Date | null): 'activa' | 'por_vencer' | 'vencida' => {
  if (!fechaFin) return 'activa';
  const today = new Date();
  const end = typeof fechaFin === 'string' ? new Date(fechaFin) : fechaFin;
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const diffDays = Math.ceil((startOfEnd.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'vencida';
  if (diffDays <= 3) return 'por_vencer';
  return 'activa';
};

const getStatusBadge = (fechaFin: string | Date | null) => {
  const status = getStatus(fechaFin);
  const text = status === 'activa' ? 'ACTIVO' : status === 'por_vencer' ? 'POR VENCER' : 'VENCIDO';
  const variant = status === 'vencida' ? 'destructive' : 'secondary';
  const extraClass = status === 'por_vencer' ? 'text-orange-500' : status === 'activa' ? 'text-gym-green' : '';
  return <Badge variant={variant} className={`text-xs ${extraClass}`}>{text}</Badge>;
};

export default function Asistencia() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dniInput, setDniInput] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [asistencias, setAsistencias] = useState<AsistenciaConCliente[]>([]);
  const [modoAsistencia, setModoAsistencia] = useState<"qr" | "dni">("dni");
  const [qrManual, setQrManual] = useState("");
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isProcessingQR, setIsProcessingQR] = useState(false);
  const [lastScannedQR, setLastScannedQR] = useState("");
  const [lastRegisteredClient, setLastRegisteredClient] = useState<string | null>(null);
  const { toast } = useToast();
  const { fetchAsistencias, registrarAsistencia: registrarAsistenciaAPI, isLoading } = useAsistencias();

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
    try {
      const response = await fetch('/api/clientes');
      if (!response.ok) {
        throw new Error('Error al cargar clientes');
      }
      const data = await response.json();
      setClientes(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error cargando clientes",
        description: error.message,
      });
    }
  };

  const loadAsistencias = async () => {
    try {
      const data = await fetchAsistencias({ limit: 100 });
      setAsistencias(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error cargando asistencias",
        description: error.message,
      });
    }
  };

  const registrarAsistencia = async (cliente: Cliente, tipo: "qr" | "dni") => {
    if (cliente.estado === "vencida" || cliente.estado === "suspendida") {
      toast({
        variant: "destructive",
        title: "Error de registro",
        description: "La membresía de este cliente no está activa.",
      });
      return;
    }

    try {
      const asistencia = await registrarAsistenciaAPI({
        cliente_id: cliente.id,
        notas: tipo,
      });

      // Actualizar lista de asistencias
      setAsistencias((prev) => [asistencia, ...prev]);

      const hora = new Date(asistencia.fecha_asistencia)
        .toTimeString()
        .split(" ")[0];

      // Actualizar el mensaje de confirmación para el QR scanner
      if (tipo === "qr") {
        setLastRegisteredClient(`${cliente.nombre} - ${hora}`);
        // Limpiar el mensaje después de 5 segundos
        setTimeout(() => {
          setLastRegisteredClient(null);
        }, 5000);
      }

      toast({
        title: "Asistencia registrada",
        description: `${cliente.nombre} ha registrado su asistencia a las ${hora}.`,
      });

      setDniInput("");
    } catch (error: any) {
      // El error ya fue manejado en el hook, pero podemos agregar lógica específica aquí
      console.error('Error registrando asistencia:', error);
      
      // Para el QR scanner, limpiar el estado si hay error de asistencia duplicada
      if (tipo === "qr" && error.message.includes('ya registró su asistencia hoy')) {
        setLastRegisteredClient(`${cliente.nombre} - Ya registrado hoy`);
        setTimeout(() => {
          setLastRegisteredClient(null);
        }, 5000);
      }
    }
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

    try {
      // Buscar cliente por DNI en la API
      const response = await fetch(`/api/clientes/validar-dni?dni=${dniInput}`);

      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Cliente no encontrado",
          description: "No existe un cliente con el DNI ingresado.",
        });
        return;
      }

      const data = await response.json();

      if (!data.existe || !data.cliente) {
        toast({
          variant: "destructive",
          title: "Cliente no encontrado",
          description: "No existe un cliente con el DNI ingresado.",
        });
        return;
      }

      await registrarAsistencia(data.cliente, "dni");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error buscando cliente",
        description: error.message,
      });
    }
  };

  const registrarPorQRTexto = async (texto: string, fromCamera: boolean = false) => {
    const contenido = texto.trim();

    // Si viene de la cámara, verificar si ya se está procesando o es el mismo QR
    if (fromCamera) {
      if (isProcessingQR) {
        return; // Ya se está procesando un QR
      }
      if (lastScannedQR === contenido) {
        return; // Es el mismo QR que se acaba de escanear
      }
    }

    if (!contenido) {
      toast({
        variant: "destructive",
        title: "QR vacío",
        description: "El contenido del QR no es válido.",
      });
      return;
    }

    let cliente: Cliente | null = null;

    try {
      if (fromCamera) {
        setIsProcessingQR(true);
        setLastScannedQR(contenido);
      }

      if (contenido.startsWith("CLIENT:")) {
        const id = contenido.slice("CLIENT:".length);
        const response = await fetch(`/api/clientes/${id}`);

        if (response.ok) {
          cliente = await response.json();
        }
      } else {
        // Intentar buscar por DNI
        const response = await fetch(`/api/clientes/validar-dni?dni=${contenido}`);

        if (response.ok) {
          const data = await response.json();
          cliente = data.existe ? data.cliente : null;
        }
      }

      if (!cliente) {
        toast({
          variant: "destructive",
          title: "Cliente no encontrado",
          description: "El QR no coincide con ningún cliente."
        });
        if (fromCamera) {
          // Resetear después de 2 segundos para permitir intentar con otro QR
          setTimeout(() => {
            setLastScannedQR("");
            setIsProcessingQR(false);
          }, 2000);
        }
        return;
      }

      await registrarAsistencia(cliente, "qr");

      if (fromCamera) {
        // Resetear después de 3 segundos para permitir escanear otro QR
        setTimeout(() => {
          setLastScannedQR("");
          setIsProcessingQR(false);
        }, 3000);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error buscando cliente",
        description: error.message
      });
      if (fromCamera) {
        setTimeout(() => {
          setLastScannedQR("");
          setIsProcessingQR(false);
        }, 2000);
      }
    }
  };

  // Filtrar y procesar asistencias con sus clientes
  const clientesConAsistencia = asistencias
    .filter((asistencia) => {
      const cliente = asistencia.clientes;
      const nombreMatch = cliente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
      const dniMatch = (cliente?.dni || "").includes(searchTerm);
      const fechaMatch = new Date(asistencia.fecha_asistencia)
        .toLocaleDateString()
        .includes(searchTerm);
      return Boolean(nombreMatch || dniMatch || fechaMatch);
    })
    .map((asistencia) => {
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
        cliente: asistencia.clientes,
      };
    });

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Componente de Registro en modo normal o fullscreen
  const RegistroAsistenciaCard = () => (
    <Card className={isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Registro de Asistencia</CardTitle>
            <CardDescription>
              Selecciona el método de verificación
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className={isFullscreen ? "flex justify-center" : ""}>
        <div className={`space-y-4 ${isFullscreen ? "w-full max-w-2xl" : ""}`}>
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      registrarPorDNI();
                    }
                  }}
                  className={isFullscreen ? "text-lg py-4" : ""}
                />
                <Button onClick={registrarPorDNI} disabled={isLoading} className={isFullscreen ? "px-6" : ""}>
                  Verificar
                </Button>
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
                <>
                  <div className="rounded-md border overflow-hidden relative">
                    <QrScanner
                      constraints={{ facingMode: "environment" }}
                      scanDelay={500}
                      onScan={(detected) => {
                        const text = detected?.[0]?.rawValue || "";
                        if (text && !isProcessingQR) {
                          registrarPorQRTexto(text, true);
                        }
                      }}
                      onError={() => {
                        /* Silencio errores menores de cámara */
                      }}
                      styles={{ container: { width: "100%", aspectRatio: isFullscreen ? "16/9" : "16/9" } }}
                    />
                    {isProcessingQR && (
                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                        <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-md shadow-lg">
                          <p className="text-sm font-medium">Procesando...</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {lastRegisteredClient && (
                    <div className="bg-green-100 dark:bg-green-900/20 border border-green-500 rounded-md p-3">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <div>
                          <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                            ✓ Asistencia registrada
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-300">
                            {lastRegisteredClient}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              {!cameraEnabled && (
                <>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Pega el contenido del QR o DNI"
                      value={qrManual}
                      onChange={(e) => setQrManual(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          registrarPorQRTexto(qrManual);
                        }
                      }}
                      className={isFullscreen ? "text-lg py-4" : ""}
                    />
                    <Button onClick={() => registrarPorQRTexto(qrManual)} disabled={isLoading} className={isFullscreen ? "px-6" : ""}>
                      Verificar
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Escanea el código QR del cliente con la cámara o pega su contenido manualmente.
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <RegistroAsistenciaCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold">Control de Asistencia</h2>
        <p className="text-muted-foreground">
          Registro de entradas al gimnasio mediante código QR o DNI
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RegistroAsistenciaCard />

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
