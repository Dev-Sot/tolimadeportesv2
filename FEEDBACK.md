# Feedback — Tolima Deportes v2

Registro de decisiones tomadas, bugs resueltos y contexto de cada cambio.
Actualizar cada sesión de trabajo.

---

## Sistema de roles múltiples

**Decisión:** Una sola cuenta con múltiples roles en lugar de cuentas separadas por rol.
Referencia: Airbnb (host/huésped), Rappi (usuario/repartidor).

**Cambios realizados:**
- Supabase: columna `roles text[]` en `profiles`, función `has_role(role text)`
- `types/index.ts`: `roles: UserRole[]` en `User` y `SupabaseProfile`
- `authStore.ts`: `activeRole`, `setActiveRole`, mapeo del array desde Supabase
- `App.tsx`: `RoleRoute` usa `.some()` en lugar de comparación simple
- `DashboardPage`: selector de perfil activo con botones pill
- `Navbar`: switcher rápido en el dropdown del usuario
- `ProfilePage`: toggles para activar/desactivar roles
- `RegisterPage`: checkmark en selección + aviso de múltiples roles

**Bug resuelto — Toggle CSS:**
Círculo blanco salía del área verde. Faltaba `overflow-hidden` y `left-1` fijo.
Fix: `w-11 h-6 overflow-hidden` + `absolute left-1 translate-x-0/5`.

---

## Seguridad — RLS en Supabase

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `products` | Público | vendor/admin | dueño O has_role('vendor') O admin | dueño/admin |
| `courts` | Público | court_owner/admin | dueño/admin | dueño/admin |
| `tournaments` | Público | organizer/admin | dueño/admin | dueño/admin |
| `coaches` | Público | coach/admin | dueño O has_role('coach') O admin | dueño/admin |
| `reservations` | Propio/admin | Propio | Propio/admin | — |
| `orders` | Propio/admin | Propio | — | — |
| `notifications` | Propio | — | Propio | — |
| `posts` | Público | Autenticado | Propio/admin | Propio/admin |
| `reviews` | Público | Autenticado | Propio/admin | Propio/admin |
| `post_comments` | Público | Autenticado | — | Propio |
| `storage.images` | Público | Autenticado | — | Propio (carpeta user_id) |

**Bug resuelto — UPDATE products/courts atascado:**
RLS bloqueaba silenciosamente. Fix: agregar `OR has_role('vendor/coach')` y simplificar
hooks quitando `AbortController` (useUpdateProduct, useUpdateCourt, useProducts).

**Bug resuelto — Trigger reseñas roto:**
Error `missing FROM-clause entry for table "update_target_rating"`. Trigger mal escrito.
Fix: Drop + reescribir `fn_update_target_rating()` con `COALESCE(NEW, OLD)` correcto.

---

## Dashboards por rol

| Dashboard | Ruta | Contenido |
|---|---|---|
| Vendor | `/vendor` | Tabs: Productos (CRUD) · Pedidos recibidos · Estadísticas (Recharts) · Alerta stock bajo |
| Organizer | `/organizer` | CRUD torneos + stats + lista de participantes expandible por torneo |
| CourtOwner | `/court-owner` | Tabs: Canchas (CRUD) · Reservas recibidas (confirmar/cancelar) |
| Coach | `/coach` | Tabs: Mi perfil (especialidades, tarifa, certs) · Solicitudes de sesión |

**Hooks agregados:**
`useDeleteCourt`, `useUpdateTournament`, `useDeleteTournament`, `useMyCoach`,
`useUpsertCoach`, `useCourtOwnerReservations`, `useUpdateReservationStatus`,
`useCancelReservation`, `useVendorOrders`

---

## Notificaciones

- Supabase Realtime: suscripción a INSERT en `notifications` por `user_id`
- Auto-notificación al dueño de cancha cuando alguien reserva
- Auto-notificación al organizador cuando alguien se inscribe al torneo
- Auto-notificación al vendor cuando alguien compra sus productos
- Solicitudes de sesión de entrenador → notificación tipo `session_request`

---

## Subida de imágenes — Supabase Storage

**Bucket:** `images` (público)  
**Ruta:** `{user.id}/{timestamp}-{random}.{ext}`  
**Componente:** `src/app/components/shared/ImageUpload.tsx`

- Modo múltiple: hasta 6 imágenes, grid, fallback URL
- Modo single (avatar): recortador circular con `react-easy-crop` + zoom slider

**Bugs resueltos:**
1. `setUploading(false)` fuera de `finally` → cargando infinito. Fix: mover a `finally`.
2. `crossOrigin = 'anonymous'` en `getCroppedBlob` → canvas fallaba con blob URLs. Fix: quitar.
3. `upsert: true` en Storage upload para evitar errores de duplicado.

---

## Carrito de compras

**Decisión:** No requiere login. Cantidad se gestiona desde el carrito.

- `cartStore.addItem`: `Math.min(qty + new, stock)` — nunca excede stock
- Botón "Agregado" permanente basado en `items` del carrito, no en timeout
- `CartPage`: `disabled={quantity >= stock}` en botón `+`

---

## Reservas de canchas

**Calendario:**
- Slots ocupados en rojo sólido (`bg-destructive/70 text-white`)
- `isEndDisabled()`: impide seleccionar fin que "salte" sobre una hora ocupada
- Tras confirmar reserva: `setSelectedStart('')` y `setSelectedEnd('')` limpian selección
- Query `court_reservations` se invalida → slots rojos inmediatamente

**Cancelación:** botón en Perfil → Reservas, solo en reservas pendientes/confirmadas con fecha futura.

---

## Reseñas y calificaciones

- Default cambiado de 5 → **3 estrellas**
- Estado `hover` eliminado — solo `onClick` cambia el rating
- Etiqueta de texto: Muy malo / Malo / Regular / Bueno / Excelente
- Estrellas más grandes (`w-8 h-8`) para facilitar el toque en móvil

---

## Comunidad

- Botón eliminar comentario siempre visible (no hover) dentro del globo, solo en propios
- `handleSubmit`: `finally` agregado para que `setSubmitting` siempre se resetee
- Dynamic import innecesario de `useAuthStore` eliminado — usar `user` del closure
- Soporte de imágenes en publicaciones (hasta 4, via `ImageUpload`)

---

## Login

- `<link rel="icon">` en JSX → reemplazado por `<img src="/logo.png">`
- Botón "¿Olvidaste tu contraseña?" → `supabase.auth.resetPasswordForEmail()`
- Toggle mostrar/ocultar contraseña implementado

---

## Navegación y UX global

- `ScrollToTop` en `App.tsx` — siempre va al top al navegar
- Redirects al login eliminados — reemplazados por toast informativo
- Fallbacks de imagen en `CourtsPage` y `ProductDetailPage` para arrays vacíos
- `(court.rating ?? 0).toFixed(1)` y `(court.review_count ?? 0)` — no muestra undefined

---

## Pendiente confirmado / Issues abiertos

- [ ] `clearCart()` debe moverse a `onSuccess` en CheckoutPage (actualmente antes de confirmar)
- [ ] Validar `canvas.getContext('2d')` no es null en ImageUpload
- [ ] Deshabilitar botón Wompi mientras el widget carga
- [ ] Manejar cancelación de Wompi con feedback al usuario
- [ ] Resincronizar form del perfil cuando `user` cambia desde otra pestaña
- [ ] Simplificar `useCreateProduct` (aún tiene AbortController de 20s)
- [ ] Filtro de specialty de coaches debe ser server-side (actualmente client-side)
- [ ] URL de redirect reset de contraseña en Supabase Auth dashboard
- [ ] Ver AUDIT.md para lista completa de issues pendientes
