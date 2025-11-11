import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { membresias } from '@prisma/client';
import { authenticatedGet, authenticatedPost, authenticatedFetch } from '@/lib/fetch-utils';

type MembresiaInsert = Omit<membresias, 'id' | 'created_at' | 'updated_at' | 'clientes_activos'>;
type MembresiaUpdate = Partial<MembresiaInsert>;

export const useMembresias = () => {
  const [membresias, setMembresias] = useState<membresias[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Cargar membresías desde API
  const fetchMembresias = async () => {
    try {
      setLoading(true);
      const data = await authenticatedGet<membresias[]>('/api/membresias');
      setMembresias(data || []);
      setError(null);
    } catch (err) {
      console.error('Error al cargar membresías:', err);
      setError('Error al cargar las membresías');
      toast({
        title: "Error",
        description: "No se pudieron cargar las membresías",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Crear nueva membresía
  const crearMembresia = async (membresia: MembresiaInsert) => {
    try {
      const data = await authenticatedPost<membresias>('/api/membresias', membresia);
      setMembresias(prev => [data, ...prev]);

      toast({
        title: "Membresía creada",
        description: "La membresía ha sido creada exitosamente",
      });

      return { success: true, data };
    } catch (err) {
      console.error('Error al crear membresía:', err);
      toast({
        title: "Error",
        description: "No se pudo crear la membresía",
        variant: "destructive",
      });
      return { success: false, error: err };
    }
  };

  // Actualizar membresía
  const actualizarMembresia = async (id: string, updates: MembresiaUpdate) => {
    try {
      const response = await authenticatedFetch(`/api/membresias/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar membresía');
      }

      const data = await response.json();
      setMembresias(prev =>
        prev.map(m => m.id === id ? data : m)
      );

      toast({
        title: "Membresía actualizada",
        description: "La membresía ha sido actualizada exitosamente",
      });

      return { success: true, data };
    } catch (err) {
      console.error('Error al actualizar membresía:', err);
      toast({
        title: "Error",
        description: "No se pudo actualizar la membresía",
        variant: "destructive",
      });
      return { success: false, error: err };
    }
  };

  // Eliminar membresía
  const eliminarMembresia = async (id: string) => {
    try {
      const response = await authenticatedFetch(`/api/membresias/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar membresía');
      }

      setMembresias(prev => prev.filter(m => m.id !== id));

      toast({
        title: "Membresía eliminada",
        description: "La membresía ha sido eliminada exitosamente",
      });

      return { success: true };
    } catch (err) {
      console.error('Error al eliminar membresía:', err);
      toast({
        title: "Error",
        description: "No se pudo eliminar la membresía",
        variant: "destructive",
      });
      return { success: false, error: err };
    }
  };

  // Obtener membresías activas para selección
  const getMembresiasPorTipo = () => {
    const tiposMembresia = [
      { value: 'mensual', label: 'Mensual' },
      { value: 'trimestral', label: 'Trimestral' }
    ];

    return tiposMembresia.map(tipo => ({
      ...tipo,
      membresias: membresias.filter(m => m.tipo === tipo.value && m.activa),
      total: membresias.filter(m => m.tipo === tipo.value && m.activa).length
    }));
  };

  // Obtener membresías disponibles para formularios
  const getMembresiasPorSeleccion = () => {
    return membresias
      .filter(m => m.activa)
      .map(m => ({
        id: m.id,
        nombre: m.nombre,
        precio: Number(m.precio),
        tipo: m.tipo,
        modalidad: m.modalidad,
        duracion: m.duracion
      }));
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchMembresias();
  }, []);

  return {
    membresias,
    loading,
    error,
    fetchMembresias,
    crearMembresia,
    actualizarMembresia,
    eliminarMembresia,
    getMembresiasPorTipo,
    getMembresiasPorSeleccion,
  };
};