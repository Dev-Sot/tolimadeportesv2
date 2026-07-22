# Feedback — Canchazo (antes Tolima Deportes v2)

Registro de decisiones tomadas, bugs resueltos y contexto de cada cambio.
Actualizar cada sesión de trabajo.

---

## Rebrand y modelo de negocio — Julio 2026

**Decisión:** transformar el proyecto de "Tolima Deportes" (nombre descriptivo,
atado a una sola región) a **Canchazo** (marca propia, escalable fuera del Tolima).
Modelo de negocio confirmado por el founder: suscripción Pro para el lado que paga
(vendedor/cancha/organizador/entrenador) + comisión por transacción, plan Fan
siempre gratis para el usuario final. Ver el brief de transformación de producto
para el detalle completo de marca, público objetivo y roadmap v1.0→v3.0.

**Por qué el checkout cambió de arquitectura:** el total se calculaba en el
navegador y se enviaba tal cual a la orden — cualquiera podía editarlo antes de
pagar. Se resolvió con una función de Postgres (`create_order_with_items`) que
recalcula el total desde el precio real, en la misma transacción que valida y
descuenta stock. Esto también resolvió, como efecto secundario, el problema de
órdenes huérfanas que antes solo se mitigaba con un rollback desde el cliente.

---

## Monetización v1.5 — Julio 22, 2026

**Decisión:** la comisión se calcula sobre el plan del **vendedor**, no del
comprador — un comprador Fan nunca paga de más por comprarle a un vendedor sin
Pro. La comisión queda registrada por línea de pedido (`order_items.commission_rate`
/ `commission_amount`) desde ahora, aunque el libro de liquidaciones (pagarle
efectivamente a cada vendedor) es trabajo de v2.0 — por ahora es solo registro.

**Por qué Pro se activa desde el navegador y no un webhook:** construir
verificación server-side real requiere una Edge Function de Supabase con la
llave privada de Wompi, que no se puede desplegar ni probar sin acceso a esa
infraestructura. En vez de simular una verificación falsa, se documentó como
limitación conocida en AUDIT.md y se usó el mismo modelo de confianza que ya
tenía el checkout (callback del widget en el navegador). Revisar antes de que
el volumen de suscripciones Pro sea alto.

**Por qué no hay integración de WhatsApp Business:** requiere una cuenta de
Meta Business API que el proyecto no tiene. Se decidió no construir un stub que
aparentara funcionar — queda como pendiente explícito, no como "hecho a medias".

---

## Liquidaciones y verificación — v2.0 parcial, Julio 22, 2026

**Decisión:** de los tres frentes de v2.0 (liquidaciones, verificación,
brackets de torneos), se construyeron los primeros dos completos y se difirió
el tercero a propósito. Razón: el motor de brackets tiene lógica de
emparejamiento no trivial (byes, avance de ganadores) que merece su propio
pase con tests dedicados — meterlo de prisa junto a dos features grandes ya
entregadas arriesgaba bugs sutiles de bracket, no un motor a medias visible
pero roto.

**Por qué las liquidaciones no cubren dueños de cancha:** la comisión por
línea solo existe en `order_items` (marketplace) desde v1.5. Las reservas de
cancha no tienen ese mismo tracking — extender el libro de liquidaciones sin
esa base habría sido construir sobre un dato que no existe.

**Por qué `/admin` no es todavía la "consola multi-tenant" del roadmap
original:** hoy administra una sola instancia de Canchazo (liquidaciones +
verificación de entrenadores). Multi-tenant real (marca blanca por ciudad) es
un cambio de arquitectura de otro orden — sigue en v3.0.

---

## Motor de brackets — Julio 22, 2026

**Decisión:** siembra estándar recursiva (1v8, 4v5, 2v7, 3v6 para 8 cupos) en
vez de emparejar secuencialmente. Razón: emparejar secuencialmente puede
juntar dos "byes" (posiciones vacías) en el mismo partido cuando hay más de
la mitad de cupos vacíos — la siembra estándar lo evita matemáticamente para
cualquier cantidad de participantes, no solo para casos probados a mano.

**Bug evitado a propósito:** la primera versión mental del algoritmo avanzaba
automáticamente a un ganador de bye contra un rival aún sin decidir en ronda 2
("cascada" de avance). Se corrigió antes de escribir el código final: a partir
de la ronda 2, nunca se avanza solo — hay que esperar a que ambos rivales
existan. El test `"un bye de primera ronda NO avanza de más en la segunda
ronda"` en `bracket.test.ts` existe específicamente para no reintroducir esto.

**Por qué la generación del bracket vive en TypeScript y no en SQL:** es una
función pura, fácil de testear exhaustivamente (11 casos, incluidos n de 2 a
20). Reimplementarla en PL/pgSQL habría sido más difícil de probar y de
depurar sin ganar nada — la tabla `tournament_matches` solo necesita persistir
el resultado, no recalcularlo.

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

- [ ] RPC `create_order_with_items` en Supabase para atomicidad real orders/order_items
      (mitigado con rollback cliente-side el 21-jul-2026, no es transaccional)
- [ ] Instalar y configurar ESLint (el script existe, falta el paquete en devDependencies)
- [ ] Code-splitting del bundle principal (~740 kB) con `import()` dinámico
- [ ] URL de redirect reset de contraseña en Supabase Auth dashboard (config, no código)
- [ ] Ver AUDIT.md para lista completa de issues resueltos y pendientes

**Resuelto 21-jul-2026:** todos los demás ítems de esta lista (clearCart, canvas
context, botón Wompi, feedback de cancelación, resync de perfil, AbortController,
filtro specialty server-side) — ver AUDIT.md sección "Resuelto — Julio 2026".
