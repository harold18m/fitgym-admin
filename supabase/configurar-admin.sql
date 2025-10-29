-- =====================================================
-- SCRIPT DE CONFIGURACIÓN INICIAL PARA ADMINISTRADORES
-- =====================================================
-- Este script configura el sistema para administrar usuarios admin
-- en la aplicación de administración del gimnasio
-- =====================================================

-- 1. Función para asignar rol admin a un usuario específico por email
CREATE OR REPLACE FUNCTION public.asignar_rol_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  affected_rows INT;
BEGIN
  -- Actualizar el usuario con el rol admin
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"rol": "admin"}'::jsonb
  WHERE email = user_email;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  IF affected_rows > 0 THEN
    RAISE NOTICE 'Rol admin asignado exitosamente a: %', user_email;
    RETURN TRUE;
  ELSE
    RAISE NOTICE 'No se encontró usuario con email: %', user_email;
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Función para verificar el rol de un usuario
CREATE OR REPLACE FUNCTION public.verificar_rol_usuario(user_email TEXT)
RETURNS TABLE(
  email TEXT,
  rol_app TEXT,
  rol_usuario TEXT,
  es_admin BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.email::TEXT,
    (u.raw_app_meta_data->>'rol')::TEXT as rol_app,
    (u.raw_user_meta_data->>'rol')::TEXT as rol_usuario,
    CASE 
      WHEN u.raw_app_meta_data->>'rol' = 'admin' 
        OR u.raw_user_meta_data->>'rol' = 'admin' 
      THEN TRUE 
      ELSE FALSE 
    END as es_admin
  FROM auth.users u
  WHERE u.email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Función para listar todos los usuarios admin
CREATE OR REPLACE FUNCTION public.listar_usuarios_admin()
RETURNS TABLE(
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email::TEXT,
    u.created_at,
    u.last_sign_in_at
  FROM auth.users u
  WHERE u.raw_app_meta_data->>'rol' = 'admin'
     OR u.raw_user_meta_data->>'rol' = 'admin'
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Función para remover rol admin de un usuario
CREATE OR REPLACE FUNCTION public.remover_rol_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  affected_rows INT;
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = 
    CASE 
      WHEN raw_app_meta_data IS NULL THEN NULL
      ELSE raw_app_meta_data - 'rol'
    END
  WHERE email = user_email;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  IF affected_rows > 0 THEN
    RAISE NOTICE 'Rol admin removido de: %', user_email;
    RETURN TRUE;
  ELSE
    RAISE NOTICE 'No se encontró usuario con email: %', user_email;
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- EJEMPLOS DE USO
-- =====================================================

-- ASIGNAR ROL ADMIN A UN USUARIO
-- Reemplaza 'admin@gimnasio.com' con el email del usuario
-- SELECT public.asignar_rol_admin('admin@gimnasio.com');

-- VERIFICAR ROL DE UN USUARIO
-- SELECT * FROM public.verificar_rol_usuario('admin@gimnasio.com');

-- LISTAR TODOS LOS USUARIOS ADMIN
-- SELECT * FROM public.listar_usuarios_admin();

-- REMOVER ROL ADMIN (úsalo con precaución)
-- SELECT public.remover_rol_admin('usuario@ejemplo.com');

-- =====================================================
-- ASIGNACIÓN RÁPIDA (DESCOMENTAR Y EJECUTAR)
-- =====================================================
-- Reemplaza 'TU_EMAIL_AQUI@ejemplo.com' con tu email de administrador

-- SELECT public.asignar_rol_admin('TU_EMAIL_AQUI@ejemplo.com');

-- Luego verifica que se haya asignado correctamente:
-- SELECT * FROM public.verificar_rol_usuario('TU_EMAIL_AQUI@ejemplo.com');