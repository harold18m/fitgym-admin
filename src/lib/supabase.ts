import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined) ?? ''
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ?? ''

if (!supabaseUrl || !supabaseAnonKey) {
    // Ayuda a detectar configuración faltante en desarrollo
    throw new Error('Supabase no configurado: define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local')
}

// Configurar Supabase para usar cookies en lugar de localStorage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce', // Usar PKCE para mejor seguridad
    },
    global: {
        headers: {
            'X-Client-Info': 'supabase-js-web',
        },
    },
})

// Tipos para la base de datos
export interface Database {
    public: {
        Tables: {
            membresias: {
                Row: {
                    id: string
                    nombre: string
                    descripcion: string
                    tipo: 'mensual' | 'trimestral'
                    modalidad: 'diario' | 'interdiario' | 'libre'
                    precio: number
                    duracion: number
                    caracteristicas: string[]
                    activa: boolean
                    clientes_activos: number
                    fecha_creacion: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    nombre: string
                    descripcion: string
                    tipo: 'mensual' | 'trimestral'
                    modalidad: 'diario' | 'interdiario' | 'libre'
                    precio: number
                    duracion: number
                    caracteristicas: string[]
                    activa?: boolean
                    clientes_activos?: number
                    fecha_creacion?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    nombre?: string
                    descripcion?: string
                    tipo?: 'mensual' | 'trimestral'
                    modalidad?: 'diario' | 'interdiario' | 'libre'
                    precio?: number
                    duracion?: number
                    caracteristicas?: string[]
                    activa?: boolean
                    clientes_activos?: number
                    fecha_creacion?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            clientes: {
                Row: {
                    id: string
                    nombre: string
                    email: string
                    telefono: string
                    dni: string | null
                    fecha_nacimiento: string
                    fecha_registro: string
                    membresia_id: string | null
                    nombre_membresia: string | null
                    tipo_membresia: string | null
                    fecha_inicio: string | null
                    fecha_fin: string | null
                    estado: 'activa' | 'vencida' | 'suspendida'
                    asistencias: number
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    nombre: string
                    email: string
                    telefono: string
                    dni?: string | null
                    fecha_nacimiento: string
                    fecha_registro?: string
                    membresia_id?: string | null
                    nombre_membresia?: string | null
                    tipo_membresia?: string | null
                    fecha_inicio?: string | null
                    fecha_fin?: string | null
                    estado?: 'activa' | 'vencida' | 'suspendida'
                    asistencias?: number
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    nombre?: string
                    email?: string
                    telefono?: string
                    dni?: string | null
                    fecha_nacimiento?: string
                    fecha_registro?: string
                    membresia_id?: string | null
                    nombre_membresia?: string | null
                    tipo_membresia?: string | null
                    fecha_inicio?: string | null
                    fecha_fin?: string | null
                    estado?: 'activa' | 'vencida' | 'suspendida'
                    asistencias?: number
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            , asistencias: {
                Row: {
                    id: string
                    evento_id: string | null
                    cliente_id: string
                    fecha_asistencia: string
                    estado: 'presente' | 'ausente' | 'tardanza'
                    notas: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    evento_id?: string | null
                    cliente_id: string
                    fecha_asistencia?: string
                    estado?: 'presente' | 'ausente' | 'tardanza'
                    notas?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    evento_id?: string | null
                    cliente_id?: string
                    fecha_asistencia?: string
                    estado?: 'presente' | 'ausente' | 'tardanza'
                    notas?: string | null
                    created_at?: string
                }
            }
            , eventos: {
                Row: {
                    id: string
                    titulo: string
                    descripcion: string | null
                    fecha: string
                    hora: string
                    tipo: string
                    cliente_id: string | null
                    nombre_cliente: string | null
                    entrenador: string | null
                    duracion: number
                    estado: string
                    max_participantes: number | null
                    participantes_actuales: number | null
                    precio: number | null
                    notas: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    titulo: string
                    descripcion?: string | null
                    fecha: string
                    hora: string
                    tipo: string
                    cliente_id?: string | null
                    nombre_cliente?: string | null
                    entrenador?: string | null
                    duracion?: number
                    estado?: string
                    max_participantes?: number | null
                    participantes_actuales?: number | null
                    precio?: number | null
                    notas?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    titulo?: string
                    descripcion?: string | null
                    fecha?: string
                    hora?: string
                    tipo?: string
                    cliente_id?: string | null
                    nombre_cliente?: string | null
                    entrenador?: string | null
                    duracion?: number
                    estado?: string
                    max_participantes?: number | null
                    participantes_actuales?: number | null
                    precio?: number | null
                    notas?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            , perfiles: {
                Row: {
                    id: string
                    user_id: string
                    email: string | null
                    nombre_completo: string | null
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    email?: string | null
                    nombre_completo?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    email?: string | null
                    nombre_completo?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            , rutinas: {
                Row: {
                    id: string
                    cliente_id: string
                    nombre: string
                    descripcion: string | null
                    estado: string
                    fecha_inicio: string | null
                    fecha_fin: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    cliente_id: string
                    nombre: string
                    descripcion?: string | null
                    estado?: string
                    fecha_inicio?: string | null
                    fecha_fin?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    cliente_id?: string
                    nombre?: string
                    descripcion?: string | null
                    estado?: string
                    fecha_inicio?: string | null
                    fecha_fin?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            , rutina_ejercicios: {
                Row: {
                    id: string
                    rutina_id: string
                    nombre: string
                    sets: number | null
                    reps: number | null
                    dia: string | null
                    notas: string | null
                    orden: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    rutina_id: string
                    nombre: string
                    sets?: number | null
                    reps?: number | null
                    dia?: string | null
                    notas?: string | null
                    orden?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    rutina_id?: string
                    nombre?: string
                    sets?: number | null
                    reps?: number | null
                    dia?: string | null
                    notas?: string | null
                    orden?: number | null
                    created_at?: string
                }
            }
            , tarjetas_acceso: {
                Row: {
                    id: string
                    cliente_id: string
                    codigo: string
                    estado: string
                    ultima_entrada: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    cliente_id: string
                    codigo: string
                    estado?: string
                    ultima_entrada?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    cliente_id?: string
                    codigo?: string
                    estado?: string
                    ultima_entrada?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            , rutina_templates: {
                Row: {
                    id: string
                    nombre: string
                    descripcion: string | null
                    creado_por: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    nombre: string
                    descripcion?: string | null
                    creado_por?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    nombre?: string
                    descripcion?: string | null
                    creado_por?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            , rutina_template_ejercicios: {
                Row: {
                    id: string
                    template_id: string
                    ejercicio_id: string | null
                    nombre: string | null
                    sets: number | null
                    repeticiones: number | null
                    peso_sugerido: number | null
                    dia: string | null
                    notas: string | null
                    orden: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    template_id: string
                    ejercicio_id?: string | null
                    nombre?: string | null
                    sets?: number | null
                    repeticiones?: number | null
                    peso_sugerido?: number | null
                    dia?: string | null
                    notas?: string | null
                    orden?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    template_id?: string
                    ejercicio_id?: string | null
                    nombre?: string | null
                    sets?: number | null
                    repeticiones?: number | null
                    peso_sugerido?: number | null
                    dia?: string | null
                    notas?: string | null
                    orden?: number | null
                    created_at?: string
                }
            }
        }
        Functions: {
            get_days_remaining: {
                Args: {
                    client_id: string
                }
                Returns: number | null
            }
            get_expiring_memberships: {
                Args: {
                    days_ahead?: number
                }
                Returns: {
                    id: string
                    nombre: string
                    email: string
                    telefono: string
                    fecha_fin: string
                    days_remaining: number
                    nombre_membresia: string
                }[]
            }
            renew_membership: {
                Args: {
                    client_id: string
                    new_membresia_id?: string
                }
                Returns: boolean
            }
        }
    }
}