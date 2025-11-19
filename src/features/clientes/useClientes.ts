// Nueva versión con Prisma
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { authenticatedFetch, authenticatedGet } from "@/lib/fetch-utils";
import type { clientes, EstadoCliente } from "@prisma/client";

// Tipos para los datos del formulario
export type ClienteFormData = {
  nombre: string;
  email: string;
  telefono: string;
  dni?: string | null;
  fecha_nacimiento: string; // Cambiar de Date a string para coincidir con FormValues
  membresia_id?: string | null;
  nombre_membresia?: string | null;
  fecha_inicio?: string | null; // Cambiar de Date a string
  fecha_fin?: string | null; // Cambiar de Date a string
  estado?: EstadoCliente;
};

export const useClientes = (initialClientes: clientes[] = []) => {
  const [clientes, setClientes] = useState<clientes[]>(initialClientes);
  const [busqueda, setBusqueda] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clienteActual, setClienteActual] = useState<clientes | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  // Cargar clientes desde la API solo cuando se necesite refrescar
  const fetchClientes = async () => {
    try {
      const data = await authenticatedGet<clientes[]>('/api/clientes');
      setClientes(data);
      return data;
    } catch (err) {
      console.error('Error al cargar clientes:', err);
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      });
      throw err;
    }
  };

  const filteredClientes = clientes.filter(
    (cliente) =>
      cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      cliente.email.toLowerCase().includes(busqueda.toLowerCase()) ||
      cliente.telefono.includes(busqueda) ||
      (cliente.dni?.includes(busqueda) ?? false)
  );

  const handleEdit = (cliente: clientes) => {
    setClienteActual(cliente);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setClienteToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!clienteToDelete) return;

    try {
      const response = await authenticatedFetch(`/api/clientes/${clienteToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar cliente');
      }

      // Actualizar estado local inmediatamente
      setClientes(clientes.filter((cliente) => cliente.id !== clienteToDelete));
      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado correctamente",
      });
    } catch (err) {
      console.error('Error al eliminar cliente:', err);
      toast({
        title: "Error",
        description: "No se pudo eliminar el cliente",
        variant: "destructive",
      });
    } finally {
      setClienteToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const saveCliente = async (values: ClienteFormData, options: { closeDialog?: boolean } = { closeDialog: true }) => {
    try {
      const method = clienteActual ? 'PUT' : 'POST';
      const url = clienteActual ? `/api/clientes/${clienteActual.id}` : '/api/clientes';

      const response = await authenticatedFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Error al guardar cliente' }));
        throw new Error(err.error || err.message || 'Error al guardar cliente');
      }

      const data = await response.json();

      if (clienteActual) {
        // Actualizar en la lista
        setClientes(
          clientes.map((c) => (c.id === clienteActual.id ? data : c))
        );

        toast({
          title: "Cliente actualizado",
          description: "Los datos del cliente han sido actualizados correctamente",
        });
      } else {
        // Agregar a la lista
        setClientes([data, ...clientes]);
        toast({
          title: "Cliente agregado",
          description: "El nuevo cliente ha sido agregado correctamente"
        });
      }

      if (options.closeDialog) {
        setIsDialogOpen(false);
        setClienteActual(null);
      }

      return data;
    } catch (err) {
      console.error('Error al guardar cliente:', err);
      toast({
        title: "Error",
        description: "No se pudo guardar el cliente",
        variant: "destructive",
      });
      throw err;
    }
  };

  const onSubmit = async (values: ClienteFormData) => {
    await saveCliente(values, { closeDialog: true });
  };

  const handleAddNew = () => {
    setClienteActual(null);
    setIsDialogOpen(true);
  };

  return {
    clientes,
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
    fetchClientes,
    saveCliente,
  };
};
