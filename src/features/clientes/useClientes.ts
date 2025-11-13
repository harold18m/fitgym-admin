// Nueva versión con Prisma
import { useState, useEffect } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { useMembresias } from "@/hooks/useMembresias";
import { authenticatedFetch } from "@/lib/fetch-utils";
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

export const useClientes = () => {
  const [clientes, setClientes] = useState<clientes[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clienteActual, setClienteActual] = useState<clientes | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const { getMembresiasPorSeleccion } = useMembresias();
  const queryClient = useQueryClient();

  // Cargar clientes desde la API (Prisma en el backend)
  const fetchClientes = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/clientes');

      if (!response.ok) {
        throw new Error('Error al cargar clientes');
      }

      const data = await response.json();
      setClientes(data);
    } catch (err) {
      console.error('Error al cargar clientes:', err);
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchClientes();
  }, []);

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
      // Invalidar cache global de clientes para que otros componentes se actualicen
      queryClient.invalidateQueries({ queryKey: ['clientes', 'list'] });
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
        throw new Error('Error al guardar cliente');
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

      // Invalidar cache global de clientes para que se refresque con los cambios
      queryClient.invalidateQueries({ queryKey: ['clientes', 'list'] });

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
    loading,
    handleEdit,
    handleDelete,
    confirmDelete,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    onSubmit,
    handleAddNew,
    membresiasDisponibles: getMembresiasPorSeleccion(),
    fetchClientes,
    saveCliente,
  };
};
