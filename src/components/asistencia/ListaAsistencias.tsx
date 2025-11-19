"use client";

import { useState } from "react";
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
import { Search, Clock, Calendar, QrCode, UserCheck, Loader2 } from "lucide-react";
import { getStatusBadge } from "@/utils/asistenciaUtils";
import { asistencias } from "@prisma/client";

type AsistenciaConCliente = asistencias & {
    clientes: {
        id: string;
        nombre: string;
        dni: string | null;
        avatar_url: string | null;
        email: string;
        estado: string;
    } | null;
};

interface ListaAsistenciasProps {
    asistencias: AsistenciaConCliente[];
    isLoading?: boolean;
}

export function ListaAsistencias({ asistencias, isLoading }: ListaAsistenciasProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDate, setSelectedDate] = useState<Date>();

    // Mostrar loading
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Asistencias Recientes</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }

    // Filtrado mejorado
    const filteredAsistencias = asistencias.filter((asistencia) => {
        const cliente = asistencia.clientes;
        if (!cliente) return false;

        const matchesSearch =
            cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cliente.dni?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDate = selectedDate
            ? new Date(asistencia.fecha_asistencia).toDateString() === selectedDate.toDateString()
            : true;

        return matchesSearch && matchesDate;
    });

    // Calcular asistencias del día actual
    const today = new Date();
    const todayAsistencias = asistencias.filter((asistencia) => {
        const asistenciaDate = new Date(asistencia.fecha_asistencia);
        return asistenciaDate.toDateString() === today.toDateString();
    });

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <UserCheck className="h-5 w-5" />
                            Asistencias Recientes
                        </CardTitle>
                        <CardDescription>
                            Hoy: {todayAsistencias.length} asistencias
                        </CardDescription>
                    </div>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cliente</TableHead>
                                <TableHead>DNI</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Fecha/Hora</TableHead>
                                <TableHead>Tipo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAsistencias.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No hay asistencias registradas
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAsistencias.map((asistencia) => {
                                    const cliente = asistencia.clientes;
                                    if (!cliente) return null;

                                    const fecha = new Date(asistencia.fecha_asistencia);
                                    const tipo = asistencia.notas?.includes("qr") ? "QR" : "DNI";

                                    return (
                                        <TableRow key={asistencia.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarImage
                                                            src={cliente.avatar_url || undefined}
                                                            alt={cliente.nombre}
                                                        />
                                                        <AvatarFallback>
                                                            {cliente.nombre
                                                                .split(" ")
                                                                .map((n) => n[0])
                                                                .join("")
                                                                .toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium leading-none">
                                                            {cliente.nombre}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            {cliente.dni || "Sin DNI"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {cliente.dni || "—"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge 
                                                    variant={
                                                        cliente.estado === 'activa' 
                                                            ? 'default' 
                                                            : cliente.estado === 'vencida' 
                                                            ? 'destructive' 
                                                            : 'secondary'
                                                    }
                                                >
                                                    {cliente.estado === 'activa' ? 'Activa' : cliente.estado === 'vencida' ? 'Vencida' : 'Sin membresía'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <Calendar className="h-3 w-3 text-muted-foreground" />
                                                        {fecha.toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <Clock className="h-3 w-3" />
                                                        {fecha.toLocaleTimeString()}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={tipo === "QR" ? "default" : "secondary"}>
                                                    {tipo === "QR" ? (
                                                        <QrCode className="h-3 w-3 mr-1" />
                                                    ) : (
                                                        <UserCheck className="h-3 w-3 mr-1" />
                                                    )}
                                                    {tipo}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
