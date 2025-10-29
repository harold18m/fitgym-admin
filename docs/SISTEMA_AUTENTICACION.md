# Sistema de Autenticación y Roles

## 🔐 Flujo de Autenticación

### Primera vez (Sin administradores)

```
Usuario abre /login
       ↓
Sistema verifica si existe admin (GET /api/auth/verificar-admin)
       ↓
NO existe admin
       ↓
Muestra formulario de REGISTRO
       ↓
Usuario completa formulario y envía
       ↓
POST /api/auth/registrar-primer-admin
       ↓
Se crea usuario con rol: 'admin' en user_metadata y app_metadata
       ↓
Formulario cambia a modo LOGIN
       ↓
Usuario inicia sesión con sus credenciales
       ↓
Acceso concedido al sistema
```

### Después del primer admin

```
Usuario abre /login
       ↓
Sistema verifica si existe admin (GET /api/auth/verificar-admin)
       ↓
SÍ existe admin
       ↓
Muestra formulario de LOGIN
       ↓
Usuario ingresa credenciales
       ↓
Supabase Auth valida email/password
       ↓
Sistema verifica rol en metadata
       ↓
¿rol === 'admin'?
    ↓              ↓
   SÍ             NO
    ↓              ↓
Acceso OK    Sesión cerrada + Error
    ↓
Redirige a /
```

## 📁 Archivos del Sistema de Auth

### API Routes

#### `/api/auth/verificar-admin/route.ts`
- **Método**: GET
- **Función**: Verifica si existe al menos un usuario con rol admin
- **Usa**: `supabaseAdmin.auth.admin.listUsers()`
- **Retorna**: `{ existeAdmin: boolean }`

#### `/api/auth/registrar-primer-admin/route.ts`
- **Método**: POST
- **Función**: Crea el primer usuario administrador
- **Validaciones**:
  - Verifica que NO exista ningún admin antes de crear
  - Valida email y password (mín. 6 caracteres)
- **Body**: `{ email, password, nombre }`
- **Crea usuario con**:
  ```typescript
  user_metadata: { nombre, rol: 'admin' }
  app_metadata: { rol: 'admin' }
  email_confirm: true // Auto-confirma el email
  ```

### Frontend

#### `/app/login/page.tsx`
- **Estados**:
  - `existeAdmin`: `boolean | null` - Si existe admin en el sistema
  - `verificandoAdmin`: `boolean` - Indica si está verificando
  - `isLoading`: `boolean` - Loading en submit de formularios

- **Formularios**:
  - **Login** (si `existeAdmin === true`):
    - email
    - password
  
  - **Registro** (si `existeAdmin === false`):
    - nombre
    - email
    - password
    - confirmarPassword

- **Flujo**:
  1. `useEffect` inicial verifica admin al montar
  2. Renderiza spinner mientras verifica
  3. Muestra formulario correcto según resultado
  4. Al registrar, cambia a modo login automáticamente

## 🔒 Validación de Rol Admin

### En Login
```typescript
const rol = data.user?.user_metadata?.rol || data.user?.app_metadata?.rol;

if (rol !== 'admin') {
  await supabase.auth.signOut();
  throw new Error('Solo usuarios administradores pueden acceder');
}
```

### En Providers
```typescript
// providers.tsx verifica sesiones existentes
const { data } = await supabase.auth.getSession();
if (data.session) {
  const rol = data.session.user?.user_metadata?.rol || 
               data.session.user?.app_metadata?.rol;
  
  if (rol === 'admin') {
    setIsAuthenticated(true);
  } else {
    await supabase.auth.signOut();
  }
}
```

## 🛡️ Seguridad

### Variables de Entorno Requeridas

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # ⚠️ Solo en servidor
```

### Permisos

- **Anon Key**: Solo para login normal de usuarios
- **Service Role Key**: 
  - Solo se usa en API Routes (servidor)
  - Permite crear usuarios con metadata personalizada
  - NUNCA exponer en el cliente

### Limitaciones

1. **Solo un admin inicial**: El endpoint `/api/auth/registrar-primer-admin` solo funciona si NO hay admin
2. **No hay registro público**: Sin admin, no se puede crear usuarios normales
3. **Validación en cada sesión**: Cada vez que se verifica la sesión, se valida el rol

## 📊 Metadata de Usuario Admin

```json
{
  "user_metadata": {
    "nombre": "Administrador",
    "rol": "admin"
  },
  "app_metadata": {
    "rol": "admin"
  }
}
```

**¿Por qué en ambos?**
- `user_metadata`: Puede ser modificado por el usuario
- `app_metadata`: Solo puede ser modificado por el Admin API (más seguro)
- Se verifica en ambos por redundancia

## 🧪 Testing

### Verificar que no existe admin
```bash
curl http://localhost:3000/api/auth/verificar-admin
# Respuesta: { "existeAdmin": false }
```

### Crear primer admin
```bash
curl -X POST http://localhost:3000/api/auth/registrar-primer-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gimnasio.com",
    "password": "password123",
    "nombre": "Admin Principal"
  }'
```

### Verificar después de crear
```bash
curl http://localhost:3000/api/auth/verificar-admin
# Respuesta: { "existeAdmin": true }
```

## 🔄 Resetear el Sistema

Si necesitas resetear y crear un nuevo primer admin:

1. **Eliminar todos los usuarios** desde Supabase Dashboard:
   - Ve a Authentication > Users
   - Elimina todos los usuarios

2. **O usar SQL**:
```sql
-- ⚠️ CUIDADO: Esto elimina TODOS los usuarios
DELETE FROM auth.users;
```

3. Recarga `/login` y verás el formulario de registro nuevamente
