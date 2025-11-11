'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { authenticatedGet } from '@/lib/fetch-utils';

interface PersonaEnGym {
    id: string;
    clienteId: string;
    nombre: string;
    avatarUrl: string | null;
    horaEntrada: string;
    tiempoTranscurrido: number; // minutos
    tiempoEstimadoSalida: string;
}

interface AforoData {
    aforoActual: {
        personasActuales: number;
        capacidadMaxima: number;
        porcentajeOcupacion: number;
        espaciosDisponibles: number;
        estado: 'disponible' | 'moderado' | 'lleno' | 'excedido';
        ultimaActualizacion: string;
    };
    personasEnGym: PersonaEnGym[];
    estadisticasHoy: {
        totalAsistencias: number;
        tiempoPromedioMinutos: number;
        picoAforo: {
            hora: string;
            cantidad: number;
        } | null;
    };
    configuracion: {
        capacidadMaxima: number;
        tiempoPromedioMinutos: number;
        alertaPorcentaje: number;
        horarioApertura: string;
        horarioCierre: string;
    };
}

export function AforoPanel() {
    const [aforoData, setAforoData] = useState<AforoData | null>(null);
    const [loading, setLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const { toast } = useToast();

    const fetchAforoData = async () => {
        try {
            const data = await authenticatedGet<AforoData>('/api/aforo');
            setAforoData(data);
        } catch (error: any) {
            console.error('Error fetching aforo:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudieron cargar los datos de aforo'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAforoData();

        // Auto-refresh cada 30 segundos si está activo
        if (autoRefresh) {
            const interval = setInterval(fetchAforoData, 30000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh]);

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case 'disponible': return 'text-green-600 bg-green-50';
            case 'moderado': return 'text-yellow-600 bg-yellow-50';
            case 'lleno': return 'text-orange-600 bg-orange-50';
            case 'excedido': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getEstadoTexto = (estado: string) => {
        switch (estado) {
            case 'disponible': return 'Disponible';
            case 'moderado': return 'Moderado';
            case 'lleno': return 'Casi Lleno';
            case 'excedido': return 'Excedido';
            default: return estado;
        }
    };

    const getProgressColor = (porcentaje: number) => {
        if (porcentaje >= 100) return 'bg-red-600';
        if (porcentaje >= 80) return 'bg-orange-500';
        if (porcentaje >= 50) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const formatTiempo = (minutos: number) => {
        const horas = Math.floor(minutos / 60);
        const mins = minutos % 60;
        if (horas > 0) {
            return `${horas}h ${mins}min`;
        }
        return `${mins}min`;
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Aforo del Gimnasio
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        Cargando datos de aforo...
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!aforoData) return null;

    const { aforoActual, personasEnGym, estadisticasHoy, configuracion } = aforoData;

    return (
        <div className="space-y-6">
            {/* Card Principal de Aforo */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Aforo del Gimnasio
                            </CardTitle>
                            <CardDescription>
                                Control en tiempo real de capacidad
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className={getEstadoColor(aforoActual.estado)}>
                                {getEstadoTexto(aforoActual.estado)}
                            </Badge>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchAforoData}
                            >
                                Actualizar
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Indicador Principal */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-3xl font-bold">
                                    {aforoActual.personasActuales}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    de {aforoActual.capacidadMaxima} personas
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold">
                                    {aforoActual.porcentajeOcupacion}%
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Ocupación
                                </p>
                            </div>
                        </div>

                        <div className="relative">
                            <Progress
                                value={Math.min(aforoActual.porcentajeOcupacion, 100)}
                                className="h-3"
                            />
                            <div
                                className={`absolute top-0 left-0 h-3 rounded-full transition-all ${getProgressColor(aforoActual.porcentajeOcupacion)}`}
                                style={{ width: `${Math.min(aforoActual.porcentajeOcupacion, 100)}%` }}
                            />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                                Espacios disponibles: <span className="font-semibold">{aforoActual.espaciosDisponibles}</span>
                            </span>
                            <span className="text-xs text-muted-foreground">
                                Actualizado: {new Date(aforoActual.ultimaActualizacion).toLocaleTimeString()}
                            </span>
                        </div>
                    </div>

                    {/* Alerta si está lleno */}
                    {aforoActual.porcentajeOcupacion >= configuracion.alertaPorcentaje && (
                        <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <AlertTriangle className="h-5 w-5 text-orange-600" />
                            <div className="flex-1">
                                <p className="font-medium text-orange-900">
                                    Aforo al {aforoActual.porcentajeOcupacion}%
                                </p>
                                <p className="text-sm text-orange-700">
                                    Se ha alcanzado el límite de alerta de capacidad
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Estadísticas del Día */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                        <div className="text-center">
                            <p className="text-2xl font-bold">{estadisticasHoy.totalAsistencias}</p>
                            <p className="text-xs text-muted-foreground">Visitas hoy</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold">
                                {formatTiempo(estadisticasHoy.tiempoPromedioMinutos)}
                            </p>
                            <p className="text-xs text-muted-foreground">Tiempo promedio</p>
                        </div>
                        <div className="text-center">
                            {estadisticasHoy.picoAforo ? (
                                <>
                                    <p className="text-2xl font-bold">{estadisticasHoy.picoAforo.cantidad}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Pico a las {estadisticasHoy.picoAforo.hora}
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">Sin datos</p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Lista de Personas Actualmente en el Gym */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Personas en el Gimnasio ({personasEnGym.length})
                    </CardTitle>
                    <CardDescription>
                        Clientes actualmente dentro del gimnasio
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {personasEnGym.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No hay personas en el gimnasio actualmente
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {personasEnGym.map((persona) => (
                                <div
                                    key={persona.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={persona.avatarUrl || undefined} />
                                            <AvatarFallback>
                                                {persona.nombre.split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{persona.nombre}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Entrada: {new Date(persona.horaEntrada).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="outline" className="mb-1">
                                            <Clock className="h-3 w-3 mr-1" />
                                            {formatTiempo(persona.tiempoTranscurrido)}
                                        </Badge>
                                        <p className="text-xs text-muted-foreground">
                                            Est. salida: {new Date(persona.tiempoEstimadoSalida).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
