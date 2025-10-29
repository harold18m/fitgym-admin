# 🚀 Sistema de Login con Primer Admin

## ✅ Implementación Completa

### 📂 Archivos Creados/Modificados

#### API Routes
1. ✅ `/api/auth/verificar-admin/route.ts`
   - Verifica si existe al menos un admin en el sistema
   - Usa `supabaseAdmin` para listar usuarios
   - Retorna: `{ existeAdmin: boolean }`

2. ✅ `/api/auth/registrar-primer-admin/route.ts`
   - Crea el primer usuario administrador
   - Solo funciona si NO hay admin existente
   - Asigna rol 'admin' en user_metadata y app_metadata
   - Auto-confirma el email

#### Frontend
3. ✅ `/app/login/page.tsx`
   - Sistema dual: Login o Registro según existencia de admin
   - Validación de rol en cada login
   - Formularios separados con validación Zod

#### Documentación
4. ✅ `/docs/CONFIGURAR_ADMIN.md` - Actualizado con método automático
5. ✅ `/docs/SISTEMA_AUTENTICACION.md` - Flujo completo del sistema
6. ✅ `/supabase/configurar-admin.sql` - Scripts SQL auxiliares

---

## 🎯 Flujo de Usuario

### Primera vez (Sin administradores)

```
┌─────────────────────────────────────────┐
│  Usuario abre /login                    │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  GET /api/auth/verificar-admin          │
│  Respuesta: { existeAdmin: false }      │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Muestra FORMULARIO DE REGISTRO         │
│  - Nombre completo                      │
│  - Email                                │
│  - Password                             │
│  - Confirmar password                   │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  POST /api/auth/registrar-primer-admin  │
│  - Crea usuario con rol: 'admin'        │
│  - Auto-confirma email                  │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Formulario cambia a LOGIN              │
│  Email pre-llenado                      │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Usuario inicia sesión                  │
│  ✓ Acceso concedido                     │
└─────────────────────────────────────────┘
```

### Subsecuentes veces (Con admin existente)

```
┌─────────────────────────────────────────┐
│  Usuario abre /login                    │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  GET /api/auth/verificar-admin          │
│  Respuesta: { existeAdmin: true }       │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Muestra FORMULARIO DE LOGIN            │
│  - Email                                │
│  - Password                             │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Supabase Auth valida credenciales      │
└────────────┬────────────────────────────┘
             │
             ▼
        ┌────┴────┐
        │ ¿Admin? │
        └────┬────┘
         ┌───┴───┐
         │       │
        Sí      No
         │       │
         ▼       ▼
     ✓ Acceso  ✗ Error
                 + Logout
```

---

## 🔐 Seguridad Implementada

### ✅ Validaciones en Registro
- Solo permite crear admin si NO existe ninguno
- Valida email formato correcto
- Valida password mínimo 6 caracteres
- Confirma que las contraseñas coincidan
- Auto-confirma el email (no requiere verificación)

### ✅ Validaciones en Login
- Verifica credenciales con Supabase Auth
- Verifica rol 'admin' en metadata
- Cierra sesión automáticamente si no es admin
- Mensaje de error específico para usuarios sin permisos

### ✅ Protección de API
- `verificar-admin`: Solo lectura, usa Admin API
- `registrar-primer-admin`: Verifica que no exista admin antes de crear
- Usa `SUPABASE_SERVICE_ROLE_KEY` solo en servidor

---

## 🧪 Cómo Probar

### 1. Primera instalación (Sin admin)

```bash
# 1. Inicia el servidor
bun run dev

# 2. Abre http://localhost:3000/login
# Deberías ver: "Crear administrador"

# 3. Completa el formulario:
#    Nombre: Admin Principal
#    Email: admin@gimnasio.com
#    Password: admin123
#    Confirmar: admin123

# 4. Click en "Crear administrador"
# ✓ El sistema crea el usuario y cambia a modo login

# 5. Inicia sesión con las mismas credenciales
# ✓ Redirige al dashboard
```

### 2. Verificar funcionamiento

```bash
# Verificar que existe admin
curl http://localhost:3000/api/auth/verificar-admin

# Respuesta esperada:
# { "existeAdmin": true }

# Intentar crear otro admin (debe fallar)
curl -X POST http://localhost:3000/api/auth/registrar-primer-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "otro@admin.com",
    "password": "password123",
    "nombre": "Otro Admin"
  }'

# Respuesta esperada:
# { "error": "Ya existe un usuario administrador en el sistema" }
```

### 3. Verificar en Supabase Dashboard

1. Ve a tu proyecto en Supabase
2. Abre **Authentication > Users**
3. Deberías ver tu usuario admin creado
4. Click en el usuario para ver detalles
5. En **Raw User Meta Data** deberías ver:
   ```json
   {
     "nombre": "Admin Principal",
     "rol": "admin"
   }
   ```
6. En **Raw App Meta Data** deberías ver:
   ```json
   {
     "rol": "admin"
   }
   ```

---

## 🔧 Variables de Entorno Necesarias

Verifica que tu `.env.local` tenga:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key

# ⚠️ IMPORTANTE: Service Role Key para Admin API
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

**¿Dónde encontrar el Service Role Key?**
1. Ve a tu proyecto en Supabase Dashboard
2. Settings > API
3. Copia el "service_role" key (secret)
4. ⚠️ NUNCA expongas esta key en el cliente

---

## 📊 Estados del Sistema

### Estado 1: Sin Admin
- **Título**: "Crear administrador"
- **Descripción**: "No hay administradores. Crea el primer usuario administrador para comenzar."
- **Formulario**: Registro (4 campos)
- **Botón**: "Crear administrador"

### Estado 2: Verificando
- **Título**: "Cargando..."
- **Descripción**: "Verificando configuración del sistema..."
- **Formulario**: Spinner de carga

### Estado 3: Con Admin
- **Título**: "Iniciar sesión"
- **Descripción**: "Ingresa tus credenciales para acceder al sistema"
- **Formulario**: Login (2 campos)
- **Botón**: "Iniciar sesión"

---

## ❓ Troubleshooting

### Error: "Ya existe un usuario administrador"
**Causa**: Ya hay un admin creado en el sistema.
**Solución**: Usa el formulario de login en lugar del registro.

### Error: "No se puede conectar al servidor"
**Causa**: `SUPABASE_SERVICE_ROLE_KEY` no configurada.
**Solución**: Verifica que la variable de entorno esté en `.env.local`

### El formulario no cambia después de crear admin
**Causa**: El estado `existeAdmin` no se actualizó.
**Solución**: Recarga la página manualmente o verifica que el `setExisteAdmin(true)` se ejecute.

### No puedo iniciar sesión después de crear el admin
**Causa**: Posible error en la creación del usuario.
**Solución**: 
1. Verifica en Supabase Dashboard > Authentication > Users que el usuario existe
2. Verifica que el usuario tenga `rol: 'admin'` en metadata
3. Intenta resetear la contraseña desde Supabase Dashboard

---

## 🎉 ¡Listo!

Tu sistema ahora:
- ✅ Detecta automáticamente si hay admin
- ✅ Permite crear el primer admin desde la UI
- ✅ Solo permite login de usuarios con rol admin
- ✅ Protege el sistema de accesos no autorizados
- ✅ No permite registro después del primer admin
