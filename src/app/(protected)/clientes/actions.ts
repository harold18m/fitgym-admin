"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

type CrearCuentaResult = {
  ok: boolean;
  userId?: string;
  error?: string;
};

// Crea cuenta en Supabase Auth para un cliente existente
export const crearCuentaCliente = async (clienteId: string): Promise<CrearCuentaResult> => {
  try {
    if (!clienteId) {
      return { ok: false, error: "clienteId es requerido" };
    }

    // 1) Obtener cliente
    const { data: cliente, error: fetchError } = await supabaseAdmin
      .from("clientes")
      .select("id, nombre, email, avatar_url")
      .eq("id", clienteId)
      .single();

    if (fetchError) {
      return { ok: false, error: `No se pudo obtener el cliente: ${fetchError.message}` };
    }

    if (!cliente?.email) {
      return { ok: false, error: "El cliente no tiene un email válido" };
    }

    // 2) Crear usuario de Auth
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: cliente.email,
      email_confirm: true,
      user_metadata: {
        nombre: cliente.nombre,
        cliente_id: cliente.id,
      },
    });

    if (createError) {
      return { ok: false, error: `No se pudo crear la cuenta: ${createError.message}` };
    }

    const userId = created.user?.id;
    if (!userId) {
      return { ok: false, error: "Usuario creado sin ID" };
    }

    // 3) Crear perfil vinculado
    const { error: perfilError } = await supabaseAdmin
      .from("perfiles")
      .upsert({
        user_id: userId,
        email: cliente.email,
        nombre_completo: cliente.nombre,
        avatar_url: cliente.avatar_url ?? null,
      });

    if (perfilError) {
      return { ok: false, error: `Perfil no pudo crearse: ${perfilError.message}` };
    }

    // 4) Opcional: enviar invitación
    // await supabaseAdmin.auth.admin.inviteUserByEmail(cliente.email);

    return { ok: true, userId };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Error desconocido" };
  }
};