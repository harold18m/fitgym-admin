# Guía: Foto de Perfil en Clientes

## 📸 Funcionalidad Implementada

La foto de perfil de los clientes está completamente funcional tanto para **crear nuevos clientes** como para **editar clientes existentes**.

---

## ✅ Características

### 1. **Al Crear un Cliente**
- La foto es **opcional**
- Se selecciona al llenar la información personal (Paso 1)
- Se sube automáticamente cuando haces click en "Guardar Cliente"
- Aparece un indicador **"Nueva foto seleccionada"** en verde

### 2. **Al Editar un Cliente**
- Se muestra la **foto actual** del cliente en el avatar
- Puedes cambiarla seleccionando una nueva imagen
- Se actualiza automáticamente cuando guardas los cambios
- Puedes hacer click en "Limpiar" para descartar la nueva foto

### 3. **Indicadores Visuales**
- ✅ **Avatar ampliado** con borde (h-24 w-24)
- 🔵 **Círculo azul** en la esquina superior derecha indica nueva foto cargada
- 📝 **Texto informativo** mostrando formatos soportados
- ✓ **Checkmark verde** cuando se selecciona una nueva foto

---

## 🎯 Cómo Usar

### Crear Cliente con Foto
```
1. Click en "Nuevo Cliente"
2. Completa Nombre, DNI, Teléfono, Fecha de nacimiento
3. Haz click en el input de "Foto de perfil"
4. Selecciona una imagen JPG, PNG o GIF
5. Verás "✓ Nueva foto seleccionada" en verde
6. Click en "Siguiente" → "Siguiente" → "Guardar Cliente"
7. La foto se subirá automáticamente a Supabase Storage
```

### Editar Cliente y Cambiar Foto
```
1. Click en Edit (✏️) en la fila del cliente
2. En "Información Personal" verás su foto actual
3. Haz click en el input de "Foto de perfil"
4. Selecciona una nueva imagen
5. Verás "✓ Nueva foto seleccionada" en verde
6. Click en "Actualizar"
7. La foto se cambia automáticamente
```

### Descartar Nueva Foto
```
1. Después de seleccionar una foto, aparece botón "Limpiar"
2. Haz click en "Limpiar" para volver a la foto anterior
3. El input se resetea
```

---

## 🔧 Detalles Técnicos

### Almacenamiento
- **Ubicación:** Supabase Storage en `avatars/` bucket
- **Ruta:** `clientes/{clientId}/avatar-{timestamp}.{ext}`
- **Formatos:** JPG, PNG, GIF
- **Límite:** 5MB (recomendado)

### Base de Datos
- Campo en Prisma: `avatar_url` (String?)
- Se guarda la URL pública de Supabase Storage

### Flujo de Upload
```
1. Usuario selecciona foto → handlePhotoChange()
2. Se crea preview local → photoPreview state
3. Al guardar → uploadPhotoForClient()
4. Se sube a Storage → se obtiene URL pública
5. Se actualiza registro con PUT /api/clientes/[id]
6. Se guarda en DB: clientes.avatar_url
```

---

## 🐛 Solución de Problemas

### "No se ve la foto después de guardar"
- Verifica que Supabase Storage esté funcionando
- Revisa en la consola (DevTools) si hay errores de carga
- Recarga la página para ver los cambios

### "La foto no se carga al editar"
- Confirma que el cliente tiene `avatar_url` en la BD
- Verifica que la URL sea accesible desde Supabase Storage

### "El input de foto no funciona"
- Verifica permisos de Supabase Storage
- Asegúrate de tener `onPhotoUpload` prop configurado

---

## 📁 Archivos Modificados

- `src/features/clientes/ClienteForm.tsx`:
  - Mejorada UI de foto (Avatar más grande, indicadores visuales)
  - Carga de foto al editar cliente
  - Botón "Limpiar" para descartar nueva foto
  - Feedback visual de nueva foto seleccionada

---

## ✨ Mejoras Futuras Posibles

- [ ] Cropper de imagen para ajustar tamaño
- [ ] Vista previa más grande antes de guardar
- [ ] Drag & drop para cargar foto
- [ ] Eliminación de foto existente
- [ ] Compresión automática de imagen
