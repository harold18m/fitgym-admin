"use client";

import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { ClientesTable } from "@/features/clientes/ClientesTable";
import { ClienteForm } from "@/features/clientes/ClienteForm";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useClientes } from "@/features/clientes/useClientes";
import { useEffect } from 'react';
import { authenticatedFetch } from '@/lib/fetch-utils';

export default function Clientes() {
  const {
    filteredClientes,
    busqueda,
    setBusqueda,
    isDialogOpen,
    setIsDialogOpen,
    clienteActual,
    handleEdit,
    handleDelete,
    confirmDelete,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    onSubmit,
    handleAddNew,
    membresiasDisponibles,
    saveCliente,
    fetchClientes,
  } = useClientes();

  useEffect(() => {
    const openFromHash = async () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash;
      if (!hash || !hash.startsWith('#cliente-')) return;
      const id = hash.replace('#cliente-', '');
      try {
        const resp = await authenticatedFetch(`/api/clientes/${id}`);
        if (!resp.ok) return;
        const cliente = await resp.json();
        if (cliente) {
          handleEdit(cliente);
          const el = document.getElementById(`cliente-${id}`);
          if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
        }
      } catch (err) {
        console.error('Error abriendo cliente desde hash:', err);
      }
    };

    openFromHash();
    const onHash = () => openFromHash();
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [handleEdit]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold">Gestión de Clientes</h2>
        <Button onClick={handleAddNew} className="w-full sm:w-auto">
          <UserPlus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      <ClientesTable
        clientes={filteredClientes}
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ClienteForm
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={onSubmit}
        clienteActual={clienteActual}
        membresiasDisponibles={membresiasDisponibles}
        saveCliente={saveCliente}
        autoCreateAccount={false}
      />

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="¿Eliminar cliente?"
        description="Esta acción no se puede deshacer. El cliente será eliminado permanentemente del sistema."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  );
}
