# 🔒 Checklist de Seguridad - FitGym

## ✅ Completado

- [x] **DSN de Sentry en variables de entorno** (no hardcoded)
- [x] **Rate limiting implementado** (Upstash Redis)
- [x] **Validación de inputs** (Zod en todas las APIs)
- [x] **`.env` en `.gitignore`** (credentials no se suben a Git)
- [x] **Logger centralizado** (sin logs sensibles en producción)
- [x] **Middleware de autenticación** (verifica rol admin)

## ⚠️ Recomendaciones Adicionales

### 1. Revisar Variables Sensibles en .env
```bash
# ❌ NO subir a Git
DATABASE_URL=postgresql://...  # Contiene password
SUPABASE_SERVICE_ROLE_KEY=...  # Key con permisos admin
SENTRY_DSN=...                  # Identificador del proyecto

# ✅ Verificar que estén en .gitignore
cat .gitignore | grep .env
```

### 2. Rotar Credentials Expuestas
Si alguna vez committeaste credentials hardcodeadas:
```bash
# 1. Buscar en historial
git log --all --full-history -- "**/*config*.ts"

# 2. Si encontraste DSN/keys expuestas:
# - Rotar en Sentry (generar nuevo DSN)
# - Rotar en Supabase (generar nuevo service role key)
# - Actualizar .env localmente y en Vercel
```

### 3. Separar Ambientes
**Mejor práctica**: DSN diferentes para dev/staging/prod

```bash
# .env.local (desarrollo)
SENTRY_DSN=https://dev-dsn@sentry.io/dev-project

# Vercel (producción)
SENTRY_DSN=https://prod-dsn@sentry.io/prod-project
```

### 4. Configurar CORS Correctamente
Revisar `vercel.json`:
```json
{
  "headers": [{
    "source": "/api/(.*)",
    "headers": [{
      "key": "Access-Control-Allow-Origin",
      "value": "https://tu-dominio.com"  // ❌ Evitar "*" en prod
    }]
  }]
}
```

### 5. Habilitar Source Maps Privadas (Sentry)
```bash
# En Vercel, agregar:
SENTRY_AUTH_TOKEN=tu-auth-token

# En next.config.mjs:
module.exports = {
  sentry: {
    widenClientFileUpload: true,
    hideSourceMaps: true, // No exponer source maps públicamente
  }
}
```

### 6. Headers de Seguridad
Agregar a `next.config.mjs`:
```javascript
const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

### 7. Rate Limiting por Endpoint
Actualmente todos los endpoints tienen el mismo límite (100/min). Considera:
```typescript
// Endpoints críticos: más restrictivos
POST /api/auth/login → 5 req/min
POST /api/clientes → 20 req/min

// Endpoints lectura: más permisivos
GET /api/clientes → 100 req/min
```

### 8. SQL Injection
✅ **Ya protegido**: Usas Prisma (ORM con prepared statements)

Pero si usas raw queries:
```typescript
// ❌ NUNCA
prisma.$queryRaw`SELECT * FROM clientes WHERE id = ${req.body.id}`

// ✅ Usar parámetros
prisma.$queryRaw`SELECT * FROM clientes WHERE id = ${Prisma.sql`${req.body.id}`}`
```

### 9. Logs Sensibles
Revisar que no loguees:
- Passwords
- Tokens
- Números de tarjeta
- DNI completos (solo últimos 4 dígitos)

```typescript
// ❌ Evitar
logger.info('User logged in', { password: user.password });

// ✅ Correcto
logger.info('User logged in', { userId: user.id });
```

### 10. Dependencias Vulnerables
```bash
# Ejecutar periódicamente
npm audit

# Si hay vulnerabilidades:
npm audit fix

# Si persisten, revisar manualmente
npm audit fix --force
```

---

## 🎯 Acción Inmediata

1. **Verificar que el DSN viejo no esté en Git**:
```bash
git log --all --full-history --source -- sentry.*.config.ts | grep "93ac394"
```

2. **Si aparece**: Considerar rotar el DSN en Sentry (Settings → Client Keys)

3. **Actualizar Vercel**: Asegurar que `SENTRY_DSN` esté en Environment Variables

---

## 📋 Checklist Pre-Deploy

Antes de cada deploy a producción:

- [ ] Variables de entorno actualizadas en Vercel
- [ ] No hay credentials hardcodeadas en el código
- [ ] `npm audit` sin vulnerabilidades críticas
- [ ] Rate limiting configurado (Upstash)
- [ ] Sentry recibiendo errores correctamente
- [ ] CORS configurado (no `*` en prod)
- [ ] Build exitoso: `npm run build`

---

**Última actualización**: 16 de noviembre de 2025
