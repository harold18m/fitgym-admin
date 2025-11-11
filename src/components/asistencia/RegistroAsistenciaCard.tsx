"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
    QrCode,
    UserCheck,
    Camera,
    CameraOff,
    Maximize2,
    Minimize2,
} from "lucide-react";
import { Cliente } from "@/queries/clientesQueries";
import { useRegistrarAsistencia } from "@/queries/asistenciasQueries";

export function RegistroAsistenciaCard() {
    const [dniInput, setDniInput] = useState("");
    const [modoAsistencia, setModoAsistencia] = useState<"qr" | "dni">("dni");
    const [qrManual, setQrManual] = useState("");
    const [cameraEnabled, setCameraEnabled] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isProcessingQR, setIsProcessingQR] = useState(false);
    const [lastScannedQR, setLastScannedQR] = useState("");
    const [lastRegisteredClient, setLastRegisteredClient] = useState<string | null>(null);
    const { toast } = useToast();

    const { mutate: registrarAsistenciaAPI, isPending: isLoading } = useRegistrarAsistencia();

    // Escáner QR (carga dinámica en cliente)
    const QrScanner = dynamic(
        () => import("@yudiel/react-qr-scanner").then((mod) => mod.Scanner),
        { ssr: false }
    );

    const registrarAsistencia = useCallback(
        async (cliente: Cliente, tipo: "qr" | "dni") => {
            if (cliente.estado === "vencida" || cliente.estado === "suspendida") {
                toast({
                    variant: "destructive",
                    title: "Error de registro",
                    description: "La membresía de este cliente no está activa.",
                });
                return;
            }

            // Usar la mutación de TanStack Query
            registrarAsistenciaAPI(
                {
                    cliente_id: cliente.id,
                    notas: tipo,
                },
                {
                    onSuccess: (asistencia) => {
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

                        setDniInput("");
                    },
                    onError: (error: Error) => {
                        // Para el QR scanner, limpiar el estado si hay error de asistencia duplicada
                        if (
                            tipo === "qr" &&
                            error.message.includes("ya registró su asistencia hoy")
                        ) {
                            setLastRegisteredClient(`${cliente.nombre} - Ya registrado hoy`);
                            setTimeout(() => {
                                setLastRegisteredClient(null);
                            }, 5000);
                        }
                    },
                }
            );
        },
        [registrarAsistenciaAPI, toast]
    );

    const registrarPorDNI = useCallback(async () => {
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
    }, [dniInput, toast, registrarAsistencia]);

    const registrarPorQRTexto = useCallback(
        async (texto: string, fromCamera: boolean = false) => {
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
                    const response = await fetch(
                        `/api/clientes/validar-dni?dni=${contenido}`
                    );

                    if (response.ok) {
                        const data = await response.json();
                        cliente = data.existe ? data.cliente : null;
                    }
                }

                if (!cliente) {
                    toast({
                        variant: "destructive",
                        title: "Cliente no encontrado",
                        description: "El QR no coincide con ningún cliente.",
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
                    description: error.message,
                });
                if (fromCamera) {
                    setTimeout(() => {
                        setLastScannedQR("");
                        setIsProcessingQR(false);
                    }, 2000);
                }
            }
        },
        [isProcessingQR, lastScannedQR, registrarAsistencia, toast]
    );

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    return (
        <Card
            className={`
                ${isFullscreen
                    ? "fixed inset-0 z-50 rounded-none bg-background flex flex-col"
                    : ""
                }
                transition-all duration-300
            `}
        >
            <CardHeader className={isFullscreen ? "border-b" : ""}>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className={isFullscreen ? "text-3xl" : ""}>
                            {isFullscreen ? "🏋️ Registro de Asistencia" : "Registro de Asistencia"}
                        </CardTitle>
                        <CardDescription className={isFullscreen ? "text-base mt-2" : ""}>
                            {isFullscreen
                                ? "Sistema de control de acceso al gimnasio"
                                : "Selecciona el método de verificación"
                            }
                        </CardDescription>
                    </div>
                    <Button
                        variant={isFullscreen ? "outline" : "ghost"}
                        size={isFullscreen ? "lg" : "icon"}
                        onClick={toggleFullscreen}
                        className={isFullscreen ? "px-6" : ""}
                        title={
                            isFullscreen
                                ? "Salir de pantalla completa"
                                : "Pantalla completa"
                        }
                    >
                        {isFullscreen ? (
                            <>
                                <Minimize2 className="mr-2 h-5 w-5" />
                                Salir
                            </>
                        ) : (
                            <Maximize2 className="h-5 w-5" />
                        )}
                    </Button>
                </div>
            </CardHeader>

            <CardContent
                className={`
                    ${isFullscreen
                        ? "flex-1 flex items-center justify-center p-8 overflow-y-auto"
                        : ""
                    }
                `}
            >
                <div
                    className={`
                        space-y-6
                        ${isFullscreen ? "w-full max-w-4xl" : ""}
                    `}
                >
                    {/* Botones de modo mejorados */}
                    <div className={`flex gap-3 ${isFullscreen ? "mb-8" : ""}`}>
                        <Button
                            variant={modoAsistencia === "dni" ? "default" : "outline"}
                            className={`
                                flex-1 
                                ${isFullscreen ? "h-20 text-xl" : ""}
                                transition-all duration-200
                            `}
                            onClick={() => setModoAsistencia("dni")}
                        >
                            <UserCheck className={`mr-2 ${isFullscreen ? "h-6 w-6" : "h-4 w-4"}`} />
                            Verificar por DNI
                        </Button>
                        <Button
                            variant={modoAsistencia === "qr" ? "default" : "outline"}
                            className={`
                                flex-1 
                                ${isFullscreen ? "h-20 text-xl" : ""}
                                transition-all duration-200
                            `}
                            onClick={() => setModoAsistencia("qr")}
                        >
                            <QrCode className={`mr-2 ${isFullscreen ? "h-6 w-6" : "h-4 w-4"}`} />
                            Escanear QR
                        </Button>
                    </div>

                    {/* Contenido por DNI */}
                    {modoAsistencia === "dni" ? (
                        <div className="space-y-6">
                            <div className={`flex gap-3 ${isFullscreen ? "flex-col sm:flex-row" : ""}`}>
                                <Input
                                    placeholder="Ingresa el número de DNI"
                                    value={dniInput}
                                    onChange={(e) => setDniInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            registrarPorDNI();
                                        }
                                    }}
                                    className={`
                                        ${isFullscreen
                                            ? "text-2xl py-8 text-center font-mono tracking-wider"
                                            : ""
                                        }
                                    `}
                                    autoFocus={isFullscreen}
                                />
                                <Button
                                    onClick={registrarPorDNI}
                                    disabled={isLoading}
                                    className={`
                                        ${isFullscreen
                                            ? "h-auto py-8 px-12 text-xl"
                                            : ""
                                        }
                                    `}
                                    size={isFullscreen ? "lg" : "default"}
                                >
                                    {isLoading ? "Verificando..." : "Verificar"}
                                </Button>
                            </div>
                            <div
                                className={`
                                    text-muted-foreground text-center
                                    ${isFullscreen ? "text-lg mt-4" : "text-sm"}
                                `}
                            >
                                💡 {isFullscreen
                                    ? "Ingresa el DNI del cliente y presiona Enter o haz clic en Verificar"
                                    : "Ingresa el DNI del cliente y presiona Verificar"
                                }
                            </div>
                        </div>
                    ) : (
                        /* Contenido por QR */
                        <div className="space-y-6">
                            <div className="flex gap-3">
                                <Button
                                    variant={cameraEnabled ? "default" : "outline"}
                                    className={`
                                        flex-1
                                        ${isFullscreen ? "h-16 text-lg" : ""}
                                    `}
                                    onClick={() => setCameraEnabled((v) => !v)}
                                >
                                    {cameraEnabled ? (
                                        <>
                                            <CameraOff className={`mr-2 ${isFullscreen ? "h-5 w-5" : "h-4 w-4"}`} />
                                            Desactivar Cámara
                                        </>
                                    ) : (
                                        <>
                                            <Camera className={`mr-2 ${isFullscreen ? "h-5 w-5" : "h-4 w-4"}`} />
                                            Activar Cámara
                                        </>
                                    )}
                                </Button>
                            </div>

                            {cameraEnabled && (
                                <>
                                    <div
                                        className={`
                                            rounded-lg border-2 overflow-hidden relative
                                            ${isFullscreen ? "border-primary shadow-2xl" : ""}
                                        `}
                                    >
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
                                        // styles={{
                                        //     container: {
                                        //         width: "100%",
                                        //         aspectRatio: "16/9",
                                        //     },
                                        // }}
                                        />

                                        {/* Overlay de procesamiento */}
                                        {isProcessingQR && (
                                            <div className="absolute inset-0 bg-blue-500/30 backdrop-blur-sm flex items-center justify-center animate-pulse">
                                                <div className="bg-white dark:bg-gray-800 px-8 py-4 rounded-lg shadow-2xl">
                                                    <p className={`font-semibold ${isFullscreen ? "text-2xl" : "text-lg"}`}>
                                                        ⏳ Procesando...
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Marco de escaneo */}
                                        <div className="absolute inset-0 pointer-events-none">
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-4 border-primary rounded-lg animate-pulse"></div>
                                        </div>
                                    </div>

                                    {/* Feedback de registro exitoso */}
                                    {lastRegisteredClient && (
                                        <div
                                            className={`
                                                bg-gradient-to-r from-green-100 to-emerald-100 
                                                dark:from-green-900/30 dark:to-emerald-900/30
                                                border-2 border-green-500 rounded-lg
                                                ${isFullscreen ? "p-6" : "p-4"}
                                                animate-in slide-in-from-bottom duration-300
                                            `}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="bg-green-500 rounded-full p-3">
                                                    <UserCheck className={`text-white ${isFullscreen ? "h-8 w-8" : "h-6 w-6"}`} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`font-bold text-green-800 dark:text-green-200 ${isFullscreen ? "text-2xl" : "text-lg"}`}>
                                                        ✓ Asistencia Registrada
                                                    </p>
                                                    <p className={`text-green-700 dark:text-green-300 ${isFullscreen ? "text-xl mt-1" : "text-sm"}`}>
                                                        {lastRegisteredClient}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div
                                        className={`
                                            text-center text-muted-foreground
                                            ${isFullscreen ? "text-lg" : "text-sm"}
                                        `}
                                    >
                                        📱 Coloca el código QR frente a la cámara para escanear
                                    </div>
                                </>
                            )}

                            {!cameraEnabled && (
                                <>
                                    <div className={`flex gap-3 ${isFullscreen ? "flex-col sm:flex-row" : ""}`}>
                                        <Input
                                            placeholder="Pega el código QR o DNI aquí"
                                            value={qrManual}
                                            onChange={(e) => setQrManual(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    registrarPorQRTexto(qrManual);
                                                }
                                            }}
                                            className={`
                                                ${isFullscreen
                                                    ? "text-xl py-8 text-center"
                                                    : ""
                                                }
                                            `}
                                        />
                                        <Button
                                            onClick={() => registrarPorQRTexto(qrManual)}
                                            disabled={isLoading}
                                            className={`
                                                ${isFullscreen
                                                    ? "h-auto py-8 px-12 text-xl"
                                                    : ""
                                                }
                                            `}
                                        >
                                            {isLoading ? "Verificando..." : "Verificar"}
                                        </Button>
                                    </div>
                                    <div
                                        className={`
                                            text-center text-muted-foreground
                                            ${isFullscreen ? "text-lg" : "text-sm"}
                                        `}
                                    >
                                        💡 Activa la cámara para escanear o pega el código manualmente
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
