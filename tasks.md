# ✅ Checklist RSC + Prisma + Supabase (Prioridad Alta → Baja)

## 1. Migrar autenticación a Server Components
- [ ] Usar cookies + `@supabase/auth-helpers-nextjs`.
- [ ] Alternativa: leer JWT desde cookie y validarlo en servidor.
- [ ] Mantener `layout.tsx` como **Server Component**.
- [ ] Pasar `user` como prop a Client Components que lo necesiten.
- [ ] Eliminar Zustand/Auth para estado de sesión (lo maneja el server).

---

## 2. Convertir páginas de listado a Server Components
- [ ] Páginas como **clientes**, **membresías**, **aforo**, etc., deben ser `page.tsx` server.
- [ ] Fetch directo de Prisma en `page.tsx`.
- [ ] Mantener solo componentes interactivos como cliente.

---

## 3. Crear `loading.tsx` en segmentos pesados
- [ ] `app/(protected)/clientes/loading.tsx`
- [ ] `app/(protected)/membresias/loading.tsx`
- [ ] Usar `<Suspense>` para partes secundarias (charts, paneles).

---

## 4. Implementar utilidades cacheadas
- [ ] Crear `src/lib/data/clientes.ts`.
- [ ] Añadir `import "server-only"`.
- [ ] Exportar función cacheada:

```ts
export const getClientes = cache(async () => {
  return prisma.clientes.findMany(...);
});
