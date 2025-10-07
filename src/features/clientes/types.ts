
export interface Cliente {
  id: string;
  nombre: string;
  dni: string;
  email: string;
  telefono: string;
  membresia: "activa" | "vencida" | "pendiente";
  tipoMembresia?: string; // ID de la membresía asignada
  nombreMembresia?: string; // Nombre de la membresía para mostrar
  membresia_id?: string; // ID de la membresía asignada
  fecha_nacimiento?: string; // Fecha de nacimiento del cliente
  fecha_inicio: string;
  fecha_fin: string;
  asistencias: number;
  avatarUrl?: string;
  fechaNacimiento: string;
}

export const estadoStyle = {
  activa: "bg-green-500",
  vencida: "bg-red-500",
  pendiente: "bg-yellow-500",
};
