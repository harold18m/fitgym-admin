# Configurar Usuario Administrador

## Descripción
El sistema de administración del gimnasio requiere que los usuarios tengan el rol `admin` en su metadata de Supabase Auth para poder acceder.

## ✨ Método Automático (RECOMENDADO)

### Crear el primer administrador desde la aplicación

1. **Accede a la página de login**: Al abrir la aplicación por primera vez, el sistema detectará automáticamente que no hay administradores.

2. **Formulario de registro**: Verás un formulario para "Crear administrador" con los siguientes campos:
   - Nombre completo
   - Correo electrónico
   - Contraseña (mínimo 6 caracteres)
   - Confirmar contraseña

3. **Crea el administrador**: Completa el formulario y haz clic en "Crear administrador"

4. **Inicia sesión**: Una vez creado, el sistema cambiará automáticamente al modo de login. Ingresa tus credenciales para acceder.

### ⚠️ Importante
- **Solo se puede crear un administrador** cuando NO existe ningún admin en el sistema
- Una vez creado el primer admin, el formulario de registro ya no estará disponible
- Otros administradores deben ser creados manualmente usando los métodos SQL

---

## 🛠️ Métodos Manuales

### Opción 1: Usando SQL en Supabase Dashboard

1. Accede a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a **SQL Editor**
3. Ejecuta el siguiente SQL para asignar rol admin a un usuario:

```sql
-- Reemplaza 'usuario@ejemplo.com' con el email del usuario admin
UPDATE auth.users
SET raw_app_meta_data = 
  COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"rol": "admin"}'::jsonb
WHERE email = 'usuario@ejemplo.com';
```

### Opción 2: Crear usuario admin con trigger automático

Puedes crear un trigger que asigne automáticamente el rol admin al primer usuario:

```sql
-- Función que asigna rol admin al primer usuario
CREATE OR REPLACE FUNCTION public.assign_admin_to_first_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar si es el primer usuario
  IF (SELECT COUNT(*) FROM auth.users) = 1 THEN
    -- Asignar rol admin
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"rol": "admin"}'::jsonb
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que se ejecuta después de crear un usuario
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_admin_to_first_user();
```

### Opción 3: Asignar rol admin manualmente desde el código

Si necesitas asignar el rol admin desde tu aplicación, puedes usar el Admin API de Supabase:

```typescript
import { createClient } from '@supabase/supabase-js'

// Usar las credenciales de servicio (service_role key)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // ⚠️ NUNCA expongas esta key en el cliente
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Asignar rol admin a un usuario
async function asignarRolAdmin(userId: string) {
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { 
      app_metadata: { rol: 'admin' }
    }
  )
  
  if (error) {
    console.error('Error asignando rol admin:', error)
    return false
  }
  
  console.log('Rol admin asignado exitosamente')
  return true
}
```

## Verificar el rol de un usuario

Para verificar que un usuario tiene el rol admin asignado:

```sql
SELECT 
  email,
  raw_app_meta_data->>'rol' as rol,
  raw_user_meta_data->>'rol' as rol_usuario
FROM auth.users
WHERE email = 'usuario@ejemplo.com';
```

## Crear el primer usuario administrador

1. **Registra un usuario** (puedes usar Supabase Dashboard):
   - Ve a **Authentication > Users**
   - Click en **Add user**
   - Ingresa email y contraseña
   - Click en **Create user**

2. **Asigna el rol admin** usando cualquiera de las opciones anteriores

3. **Inicia sesión** en la aplicación con las credenciales del usuario admin

## Seguridad

⚠️ **Importante**: 
- Solo usuarios con `rol: 'admin'` pueden acceder al sistema
- El sistema valida el rol en cada inicio de sesión
- Si un usuario sin rol admin intenta acceder, la sesión se cierra automáticamente
- La validación se hace tanto en el login como al verificar sesiones existentes

## Troubleshooting

### Error: "Solo usuarios administradores pueden acceder al sistema"
**Causa**: El usuario no tiene el rol admin asignado en su metadata.

**Solución**: 
1. Verifica el rol del usuario con la query SQL de verificación
2. Asigna el rol admin usando una de las opciones anteriores
3. El usuario debe cerrar sesión y volver a iniciar sesión

### El rol no se actualiza
**Causa**: La sesión del usuario aún tiene el token antiguo sin el rol.

**Solución**:
1. Cierra sesión en la aplicación
2. Espera unos segundos
3. Vuelve a iniciar sesión
