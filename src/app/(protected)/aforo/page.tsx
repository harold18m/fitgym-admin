'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { authenticatedGet, authenticatedPost } from '@/lib/fetch-utils';
import {
    Users,
    UserX,
    Clock,
    Search,
    RefreshCw,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Settings
} from 'lucide-react';
import { AforoPanel } from '@/components/dashboard/AforoPanel';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface AsistenciaPendiente {
    id: string;
    cliente_id: string;
    hora_entrada: string;
    tiempoTranscurrido: number;
    clientes: {
        id: string;
        nombre: string;
        dni: string | null;
        avatar_url: string | null;
        estado: string;
    };
}

export default function AforoPage() {
    const [asistenciasPendientes, setAsistenciasPendientes] = useState<AsistenciaPendiente[]>([]);
    const [filteredAsistencias, setFilteredAsistencias] = useState<AsistenciaPendiente[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [procesando, setProcesando] = useState(false);
    const [selectedAsistencia, setSelectedAsistencia] = useState<AsistenciaPendiente | null>(null);
    const [showConfig, setShowConfig] = useState(false);
    const { toast } = useToast();

    const fetchAsistenciasPendientes = async () => {
        try {
            setLoading(true);
            const data = await authenticatedGet<{ asistencias: AsistenciaPendiente[] }>('/api/asistencias/salida');
            setAsistenciasPendientes(data.asistencias || []);
            setFilteredAsistencias(data.asistencias || []);
        } catch (error: any) {
            console.error('Error:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudieron cargar las asistencias pendientes'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAsistenciasPendientes();

        // Auto-refresh cada minuto
        const interval = setInterval(fetchAsistenciasPendientes, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (searchTerm === '') {
            setFilteredAsistencias(asistenciasPendientes);
        } else {
            const filtered = asistenciasPendientes.filter(a =>
                a.clientes.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (a.clientes.dni && a.clientes.dni.includes(searchTerm))
            );
            setFilteredAsistencias(filtered);
        }
    }, [searchTerm, asistenciasPendientes]);

    const registrarSalida = async (asistenciaId: string) => {
        try {
            setProcesando(true);
            const data = await authenticatedPost<any>('/api/asistencias/salida', {
                asistencia_id: asistenciaId
            });

            toast({
                title: 'Salida registrada',
                description: `${data.message}. Duración: ${data.duracion.texto}`,
            });

            // Actualizar lista
            await fetchAsistenciasPendientes();
            setSelectedAsistencia(null);

        } catch (error: any) {
            console.error('Error:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message
            });
        } finally {
            setProcesando(false);
        }
    };

    const formatTiempo = (minutos: number) => {
        const horas = Math.floor(minutos / 60);
        const mins = minutos % 60;
        return horas > 0 ? `${horas}h ${mins}min` : `${mins}min`;
    };

    const getTiempoColor = (minutos: number) => {
        if (minutos < 60) return 'text-green-600 bg-green-50';
        if (minutos < 90) return 'text-blue-600 bg-blue-50';
        if (minutos < 120) return 'text-yellow-600 bg-yellow-50';
        return 'text-orange-600 bg-orange-50';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold">Control de Aforo</h2>
                        <p className="text-muted-foreground">
                            Monitoreo de capacidad y registro de salidas
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={fetchAsistenciasPendientes}
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Actualizar
                        </Button>
                    </div>
                </div>
            </div>

            {/* Panel de Aforo */}
            <AforoPanel />

            {/* Control de Salidas */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <UserX className="h-5 w-5" />
                                Registro de Salidas
                            </CardTitle>
                            <CardDescription>
                                Clientes pendientes de registrar salida ({asistenciasPendientes.length})
                            </CardDescription>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre o DNI..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Cargando...
                        </div>
                    ) : filteredAsistencias.length === 0 ? (
                        <div className="text-center py-8">
                            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                            <p className="text-muted-foreground">
                                {searchTerm
                                    ? 'No se encontraron resultados'
                                    : 'Todas las salidas han sido registradas'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredAsistencias.map((asistencia) => (
                                <div
                                    key={asistencia.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={asistencia.clientes.avatar_url || undefined} />
                                            <AvatarFallback>
                                                {asistencia.clientes.nombre.split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-lg">
                                                {asistencia.clientes.nombre}
                                            </p>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <span>DNI: {asistencia.clientes.dni || 'N/A'}</span>
                                                <span>•</span>
                                                <span>
                                                    Entrada: {new Date(asistencia.hora_entrada).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <Badge className={getTiempoColor(asistencia.tiempoTranscurrido)}>
                                                <Clock className="h-3 w-3 mr-1" />
                                                {formatTiempo(asistencia.tiempoTranscurrido)}
                                            </Badge>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Tiempo en gym
                                            </p>
                                        </div>
                                        <Button
                                            variant="default"
                                            onClick={() => setSelectedAsistencia(asistencia)}
                                        >
                                            <UserX className="h-4 w-4 mr-2" />
                                            Registrar Salida
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialog de Confirmación */}
            <Dialog open={!!selectedAsistencia} onOpenChange={(open) => !open && setSelectedAsistencia(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Salida</DialogTitle>
                        <DialogDescription>
                            ¿Deseas registrar la salida de este cliente?
                        </DialogDescription>
                    </DialogHeader>

                    {selectedAsistencia && (
                        <div className="space-y-4 py-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={selectedAsistencia.clientes.avatar_url || undefined} />
                                    <AvatarFallback>
                                        {selectedAsistencia.clientes.nombre.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold text-lg">
                                        {selectedAsistencia.clientes.nombre}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        DNI: {selectedAsistencia.clientes.dni || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                                <div>
                                    <p className="text-sm text-muted-foreground">Hora de Entrada</p>
                                    <p className="font-medium">
                                        {new Date(selectedAsistencia.hora_entrada).toLocaleTimeString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Tiempo en Gym</p>
                                    <p className="font-medium">
                                        {formatTiempo(selectedAsistencia.tiempoTranscurrido)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setSelectedAsistencia(null)}
                            disabled={procesando}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => selectedAsistencia && registrarSalida(selectedAsistencia.id)}
                            disabled={procesando}
                        >
                            {procesando ? 'Registrando...' : 'Confirmar Salida'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
