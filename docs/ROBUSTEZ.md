# Configuración de Robustez - FitGym

Este documento describe las mejoras de robustez implementadas en el proyecto.

## 🛡️ Mejoras Implementadas

### 1. Validación de Input con Zod

Todas las APIs ahora validan sus payloads antes de tocar la base de datos:

- **Clientes**: `POST /api/clientes`, `PUT /api/clientes/[id]`
- **Membresías**: `POST /api/membresias`, `PUT /api/membresias/[id]`
- **Asistencias**: `POST /api/asistencias`
- **Rutinas**: `POST /api/rutina-templates`, `PUT /api/rutina-templates/[id]`

**Schemas ubicados en**: `src/lib/validations/`

**Beneficios**:
- ✅ Previene datos malformados en la DB
- ✅ Respuestas 400 con detalles claros del error
- ✅ Type-safety en runtime

---

### 2. Rate Limiting con Upstash Redis

Rate limiter distribuido que funciona en serverless:
- **Límite**: 100 requests por minuto por IP
- **Headers informativos**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- **Fail-open**: Si Redis falla, permite el request

**Configuración requerida**:

1. Crear cuenta en [Upstash](https://upstash.com)
2. Crear una base de datos Redis (región más cercana)
3. Copiar credenciales al `.env`:

```bash
UPSTASH_REDIS_REST_URL=https://tu-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=tu-token-upstash
```

**Verificar**:
```bash
curl -X GET http://localhost:3000/api/clientes \
  -H "Authorization: Bearer tu-token"
# Revisa los headers X-RateLimit-*
```

---

### 3. Logger Centralizado + Sentry

Logger unificado que envía errores a Sentry en producción:

```typescript
import { logger } from '@/lib/logger';

logger.info('Mensaje informativo');
logger.warn('Advertencia', { context: 'valor' });
logger.error('Error crítico', { error, userId: '123' });
logger.debug('Solo en desarrollo');
```

**Configuración Sentry**:

✅ **Correcto** (usando variables de entorno):
```typescript
// sentry.server.config.ts y sentry.edge.config.ts
Sentry.init({
  dsn: process.env.SENTRY_DSN,  // ✅ Desde .env
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
  enabled: process.env.NODE_ENV === 'production',
  sendDefaultPii: false, // No enviar datos personales
});
```

❌ **Incorrecto** (hardcoded):
```typescript
// ❌ NUNCA hagas esto
Sentry.init({
  dsn: "https://tu-dsn-hardcodeado...", // ❌ Riesgo de seguridad
});
```

**Variables de entorno requeridas**:
```bash
SENTRY_DSN=https://tu-dsn@sentry.io/proyecto
SENTRY_AUTH_TOKEN=tu-auth-token  # Solo para source maps
```

**En Vercel**: Agregar `SENTRY_DSN` en Settings → Environment Variables

**Beneficios**:
- ✅ Errores capturados automáticamente en producción
- ✅ Stack traces completos
- ✅ Context extra para debugging
- ✅ Un solo punto para cambiar provider (Sentry → Datadog)

---

### 4. Error Boundary Global

Captura errores no manejados en el root de la app:
- **Archivo**: `src/app/error.tsx`
- **Funcionalidad**: Botones "Reintentar" e "Ir al inicio"

---

## 🚀 Cómo Probar

### Local

1. **Instalar dependencias**:
```bash
npm install
```

2. **Configurar variables de entorno**:
Copia `.env.example` y llena las variables de Upstash:
```bash
cp .env.example .env.local
# Edita .env.local con tus credenciales
```

3. **Ejecutar desarrollo**:
```bash
npm run dev
```

4. **Probar validaciones**:
```bash
# Request inválido (debe retornar 400)
curl -X POST http://localhost:3000/api/clientes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu-token" \
  -d '{"email": "invalid-email"}'

# Response esperado:
# {
#   "error": "Datos inválidos",
#   "details": { "fieldErrors": { "email": ["Invalid email"] } }
# }
```

5. **Probar rate limiting**:
```bash
# Script para hacer 101 requests rápidos
for i in {1..101}; do
  curl -X GET http://localhost:3000/api/clientes \
    -H "Authorization: Bearer tu-token" &
done
# La request 101 debe retornar 429
```

---

### Producción (Vercel)

1. **Agregar variables de entorno en Vercel**:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `SENTRY_DSN` (ya configurado)

2. **Redeploy**:
```bash
git push origin main
# Vercel auto-deploy
```

3. **Verificar en Sentry**:
   - Visita tu proyecto en [sentry.io](https://sentry.io)
   - Fuerza un error: `GET /api/clientes/id-inexistente`
   - Debe aparecer en Issues

---

## 📊 Monitoreo

### Rate Limiting
- Dashboard de Upstash: ver requests/min, hits, bloqueos
- Headers en responses: `X-RateLimit-*`

### Errores
- Sentry Dashboard: errores en tiempo real
- Logger local: `console.error` en desarrollo

### Validaciones
- Logs en terminal cuando hay 400
- `details` en response JSON con errores específicos

---

## 🔧 Próximos Pasos Recomendados

1. **Tests Automatizados**:
   ```bash
   npm install -D vitest @testing-library/react
   # Crear tests en src/__tests__/
   ```

2. **RBAC Granular**:
   - Agregar roles: `TRAINER`, `RECEPTIONIST`, `ACCOUNTANT`
   - Middleware por recurso

3. **Auditoría**:
   - Tabla `audit_logs` en Prisma
   - Log de cambios críticos (quién modificó/eliminó qué)

4. **Backup Automático**:
   - Cron job en Vercel: `/api/cron/backup-db`
   - pg_dump a Supabase Storage

---

## 📚 Referencias

- [Zod Docs](https://zod.dev)
- [Upstash Redis](https://upstash.com/docs/redis/overall/getstarted)
- [Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)

---

**Autor**: GitHub Copilot
**Fecha**: 16 de noviembre de 2025
