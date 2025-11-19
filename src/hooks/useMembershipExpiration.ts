import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/fetch-utils';

interface ExpiringMembership {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  fecha_fin: string;
  days_remaining: number;
  nombre_membresia: string;
}

export const useMembershipExpiration = () => {
  const [expiringMemberships, setExpiringMemberships] = useState<ExpiringMembership[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Obtener membresías próximas a vencer usando API con Prisma
  const fetchExpiringMemberships = async (daysAhead: number = 7) => {
    setLoading(true);
    try {
      const response = await authenticatedFetch(`/api/clientes/expiring?days=${daysAhead}`);

      if (!response.ok) {
        throw new Error('Error al cargar membresías próximas a vencer');
      }

      const data = await response.json();
      setExpiringMemberships(data || []);
    } catch (error) {
      console.error('Error fetching expiring memberships:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las membresías próximas a vencer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Obtener días restantes de una membresía específica
  const getDaysRemaining = async (clientId: string): Promise<number | null> => {
    try {
      const response = await authenticatedFetch(`/api/clientes/${clientId}`);

      if (!response.ok) {
        throw new Error('Error al obtener cliente');
      }

      const cliente = await response.json();

      if (!cliente.fecha_fin) return null;

      const today = new Date();
      const endDate = new Date(cliente.fecha_fin);
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays;
    } catch (error) {
      console.error('Error getting days remaining:', error);
      return null;
    }
  };

  // Renovar membresía - usa la API de extensión de pago
  const renewMembership = async (clientId: string, newMembresiaId?: string): Promise<boolean> => {
    try {
      const response = await authenticatedFetch(`/api/clientes/${clientId}/pago`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          membresia_id: newMembresiaId,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al renovar membresía');
      }

      const data = await response.json();

      if (data) {
        toast({
          title: "Membresía renovada",
          description: "La membresía ha sido renovada exitosamente",
        });

        // Actualizar la lista de membresías próximas a vencer
        await fetchExpiringMemberships();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error renewing membership:', error);
      toast({
        title: "Error",
        description: "No se pudo renovar la membresía",
        variant: "destructive",
      });
      return false;
    }
  };

  // Calcular estado de membresía basado en fecha de vencimiento
  const getMembershipStatus = (fechaFin: string | Date | null): 'activa' | 'vencida' | 'por_vencer' => {
    if (!fechaFin) return 'activa';

    const today = new Date();
    const endDate = typeof fechaFin === 'string' ? new Date(fechaFin) : fechaFin;
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'vencida';
    if (diffDays <= 7) return 'por_vencer';
    return 'activa';
  };

  // Obtener color del badge según el estado
  const getStatusColor = (status: 'activa' | 'vencida' | 'por_vencer') => {
    switch (status) {
      case 'activa':
        return 'bg-green-500';
      case 'vencida':
        return 'bg-red-500';
      case 'por_vencer':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Obtener texto del estado
  const getStatusText = (status: 'activa' | 'vencida' | 'por_vencer') => {
    switch (status) {
      case 'activa':
        return 'Activa';
      case 'vencida':
        return 'Vencida';
      case 'por_vencer':
        return 'Por vencer';
      default:
        return 'Desconocido';
    }
  };

  // NO cargar automáticamente - el componente debe llamar fetchExpiringMemberships manualmente

  return {
    expiringMemberships,
    loading,
    fetchExpiringMemberships,
    getDaysRemaining,
    renewMembership,
    getMembershipStatus,
    getStatusColor,
    getStatusText,
  };
};