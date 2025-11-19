"use client";

import { RegistroAsistenciaCard } from "@/components/asistencia/RegistroAsistenciaCard";
import { ListaAsistencias } from "@/components/asistencia/ListaAsistencias";
import { useState } from "react";
import type { asistencias, clientes } from "@prisma/client";

type AsistenciaConCliente = asistencias & {
  clientes: Pick<clientes, 'id' | 'nombre' | 'dni' | 'email' | 'avatar_url' | 'estado'>;
};

interface AsistenciaContentProps {
  initialAsistencias: AsistenciaConCliente[];
}

export function AsistenciaContent({ initialAsistencias }: AsistenciaContentProps) {
  const [asistencias, setAsistencias] = useState<AsistenciaConCliente[]>(initialAsistencias);

  const handleNuevaAsistencia = (nuevaAsistencia: AsistenciaConCliente) => {
    // Añadir al inicio de la lista
    setAsistencias(prev => [nuevaAsistencia, ...prev]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Registro de Asistencia</h1>
        <p className="text-muted-foreground">
          Registra la asistencia de los miembros del gimnasio
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Componente de registro - pasamos callback para actualizar lista */}
        <RegistroAsistenciaCard onRegistroExitoso={handleNuevaAsistencia} />

        {/* Lista de asistencias */}
        <ListaAsistencias asistencias={asistencias} isLoading={false} />
      </div>
    </div>
  );
}
