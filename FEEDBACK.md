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
- `ProfilePage`: toggles para activar/desactivar roles (fix CSS: `w-11 overflow-hidden left-1`)
- `RegisterPage`: checkmark en selección + aviso de múltiples roles

**Bug resuelto — Toggle CSS:**
El círculo blanco salía del área verde porque faltaba `overflow-hidden` en el botón
y `left-1` fijo en el span. Fix: `w-11 h-6 overflow-hidden` + `absolute left-1 translate-x-0/5`.

---

## Seguridad — RLS en Supabase

**Tablas protegidas:**

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `products` | Público | vendor/admin | dueño O has_role('vendor') O admin | dueño/admin |
| `courts` | Público | court_owner/admin | dueño/admin | dueño/admin |
| `tournaments` | Público | organizer/admin | dueño/admin | dueño/admin |
| `coaches` | Público | coach/admin | dueño/admin | dueño/admin |
| `reservations` | Propio/admin | Propio | Propio/admin | — |
| `orders` | Propio/admin | Propio | — | — |
| `notifications` | Propio | — | Propio | — |
| `posts` | Público | Autenticado | Propio/admin | Propio/admin |
| `reviews` | Público | Autenticado | Propio/admin | Propio/admin |
| `post_comments` | Público | Autenticado | — | Propio |
| `storage.images` | Público | Autenticado | — | Propio (por carpeta user_id) |

**Bug resuelto — UPDATE products atascado:**
La política original solo permitía `vendor_id = auth.uid()`. Productos creados antes
de RLS o sin vendor_id correcto bloqueaban el UPDATE silenciosamente. Fix: agregar
`OR has_role('vendor')` a la política.

---

## Dashboards por rol

| Dashboard | Ruta | Estado |
|---|---|---|
| Vendor | `/vendor` | Completo — CRUD productos + stats |
| Organizer | `/organizer` | Completo — CRUD torneos + stats + edit/delete |
| CourtOwner | `/court-owner` | Completo — CRUD canchas + stats + delete |
| Coach | `/coach` | Nuevo — perfil con especialidades, tarifa, certificaciones |

**Hooks agregados a useSupabase.ts:**
`useDeleteCourt`, `useUpdateTournament`, `useDeleteTournament`, `useMyCoach`, `useUpsertCoach`

**Bug resuelto — hooks con abortSignal:**
`useUpdateProduct` y `useUpdateCourt` usaban `AbortController` con timeout de 20s.
Cuando RLS bloqueaba el UPDATE, `.single()` retornaba vacío y el `isPending` quedaba
atascado. Fix: simplificar sin abortSignal, agregar validación de `!data`.

---

## Subida de imágenes — Supabase Storage

**Bucket:** `images` (público)
**Ruta de archivos:** `{user.id}/{timestamp}-{random}.{ext}`

**Componente:** `src/app/components/shared/ImageUpload.tsx`
- Modo múltiple: hasta 6 imágenes, preview en grid, fallback URL
- Modo single: recortador circular con `react-easy-crop`, zoom slider, preview circular

**Bugs resueltos:**
1. `setUploading(false)` fuera de `finally` → estado cargando infinito. Fix: mover a `finally`.
2. `crossOrigin = 'anonymous'` en `getCroppedBlob` con blob URL local → canvas fallaba
   silenciosamente. Fix: quitar `crossOrigin` para URLs locales del dispositivo.

---

## Carrito de compras

**Decisión:** No requiere login para agregar productos. La cantidad se gestiona desde el carrito.

**Cambios:**
- `cartStore.addItem`: respeta stock con `Math.min(qty + new, stock)` — no permite exceder
- `ProductCard` y `ProductDetailPage`: botón "Agregado" permanente basado en `items` del carrito
  (no timeout), se resetea solo cuando el usuario elimina el producto del carrito
- `CartPage`: botón `+` ya tenía `disabled={quantity >= stock}` — correcto

---

## Login

**Bugs resueltos:**
1. `<link rel="icon">` en JSX (inválido) → reemplazado por `<img src="/logo.png">`
2. Botón "¿Olvidaste tu contraseña?" sin función → implementado con `supabase.auth.resetPasswordForEmail()`
3. `showPassword` state existía pero nunca se usaba → botón ojo añadido al input

---

## Comunidad

**Bugs resueltos:**
1. Avatar en formulario de comentar se estiraba → agregar `object-cover`
2. Botón eliminar comentario usaba `opacity-0 group-hover:opacity-100` → no funcionaba en
   móvil ni sin hover. Fix: botón siempre visible dentro del globo del comentario, solo
   para comentarios propios (`user?.id === c.user_id`)
3. `handleSubmit` tenía `return` dentro de `try` sin `finally` → `setSubmitting` quedaba
   en `true`. Fix: mover lógica, agregar `finally`
4. Dynamic import innecesario de `useAuthStore` dentro de `handleSubmit` → eliminado,
   usar `user` del closure

---

## Navegación

- `ScrollToTop` agregado en `App.tsx` dentro de `BrowserRouter`
- Redireccionamiento al login eliminado de todas las acciones — reemplazado por toast informativo

---

## Pendiente / Issues conocidos

- [ ] Política RLS para `coaches` INSERT — verificar que entrenadores puedan crear su perfil
- [ ] URL de redirect para reset de contraseña necesita configurarse en Supabase Auth dashboard
- [ ] El perfil de entrenador creado desde `/coach` debe aparecer en la lista `/coaches`
- [ ] `post_comments` RLS: comentarios anteriores con `user_id = NULL` quedaron ocultos al activar RLS
