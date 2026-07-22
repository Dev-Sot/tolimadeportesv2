# Auditoría Técnica — Canchazo (antes Tolima Deportes v2)
Última actualización: Julio 2026 (v1.0 — transformación a producto)

## Crítico — Julio 2026: página en blanco por el fix de credenciales

El fix de "credencial real hardcodeada" (abajo) lanzaba `throw new Error(...)`
a nivel de módulo en `supabase.ts` cuando faltaban las variables de entorno.
Ese `throw` ocurre durante la carga de módulos, **antes** de que React monte —
el `ErrorBoundary` solo atrapa errores durante el render, así que el resultado
real era una página completamente en blanco, sin ningún mensaje ni en pantalla
ni en la UI (solo en la consola del navegador). Detectado porque el usuario
corrió los SQL pero no tenía `.env.local` creado.

**Fix:** `supabase.ts` ya no lanza error — crea el cliente con credenciales
placeholder si faltan las variables, y exporta `isSupabaseConfigured`.
`App.tsx` revisa ese flag al inicio del render y muestra `SetupScreen`
(instrucciones para crear `.env.local`) en vez de intentar montar la app real.
Verificado en navegador headless: ya no hay pantalla en blanco, sin errores de
consola.

## Crítico — Julio 2026: credencial real hardcodeada en el bundle

`src/app/lib/supabase.ts` tenía la URL y la clave anon de un proyecto Supabase real
como **fallback en código** (no solo en el README como se creía). Esto se compilaba
en el JS de producción sin importar si `.env.local` existía. Corregido: ahora la
app falla explícito al iniciar si faltan `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`,
en vez de conectarse en silencio a la instancia original del desarrollador.

**Acción manual pendiente:** rotar la clave anon expuesta desde el dashboard de
Supabase (Project Settings → API → Regenerate), ya que estuvo pública en el
historial de git.

---

## Severidad Alta — Crash / Pérdida de datos

| # | Archivo | Problema | Fix |
|---|---------|----------|-----|
| 1 | `CheckoutPage.tsx:75` | `clearCart()` se llama ANTES de confirmar que la orden se creó. Si `createOrder.mutateAsync` falla, el carrito queda vacío sin orden. | Mover `clearCart()` al `onSuccess` del mutation |
| 2 | `useSupabase.ts:useCreateOrder` | INSERT de `orders` y `order_items` sin transacción. Si `order_items` falla, queda una orden vacía en BD. | Crear RPC `create_order_with_items` en Supabase |
| 3 | `ImageUpload.tsx:getCroppedBlob` | `canvas.getContext('2d')!` forzado sin validar null. Si getContext retorna null (modo incógnito restringido), crashea en `ctx.drawImage()`. | Agregar `if (!ctx) throw new Error(...)` |
| 4 | `useSupabase.ts:useCreateProduct` | Timeout de 20s con `AbortController` no rechaza la promesa limpiamente. En red lenta puede mostrar éxito sin datos en BD. | Simplificar sin abortSignal (ya corregido en useUpdateProduct) |

---

## Severidad Media — UX pobre / Seguridad

| # | Archivo | Problema | Fix |
|---|---------|----------|-----|
| 5 | `CheckoutPage.tsx:79-85` | Si el usuario cancela en Wompi, `result` es undefined y no hay feedback. El step sigue en 2 sin mensaje. | Manejar `result === null` con toast y volver a step 1 |
| 6 | `CheckoutPage.tsx:199` | Texto "Cargando widget..." pero el botón Pagar no está deshabilitado mientras Wompi carga. | `disabled={!wompiLoaded && paymentMethod === 'wompi'}` |
| 7 | `useSupabase.ts:useCoaches:489` | Filtro de `specialty` se aplica en client-side después de traer todos los coaches. No escala. | Pasar specialty como filtro al query de Supabase |
| 8 | `useSupabase.ts:insertNotification` | No tiene try-catch ni await de error. Falla silenciosamente sin que nadie se entere. | Envolver en try-catch con logging |
| 9 | `useAuthStore.ts:loadSession` | `activeRole` puede asignarse a un rol que no está en `loaded.roles` si el localStorage tiene un valor obsoleto. | Validar con `loaded.roles.includes(storedRole)` antes de asignar |
| 10 | `ProfilePage.tsx:53` | El form se inicializa con `user` al montar. Si `user` cambia (sincronización entre pestañas), el form no se actualiza. | Agregar `useEffect` que resincroniza `form` cuando `user.id` cambia |
| 11 | `useSupabase.ts:useFavorites` | `insert` sin manejo de clave duplicada fuera del `useJoinTournament`. Doble clic puede tirar error no manejado. | Agregar `onConflict: 'ignore'` al insert |
| 12 | `authStore.ts:onAuthStateChange:155` | No verifica si el `session.user.id` es el mismo usuario. Un token refresh podría asignar usuario diferente. | Agregar `if (session.user.id !== get().user?.id) logout()` |

---

## Severidad Baja — Consistencia / Accesibilidad

| # | Archivo | Problema | Fix |
|---|---------|----------|-----|
| 13 | `DashboardPage.tsx:3` | Import `TrendingUp` sin usar en el código. | Remover |
| 14 | `DashboardPage.tsx / ProfilePage.tsx` | Tarjeta de pedido reciente duplicada — mismo JSX en ambos archivos. Bug en uno requiere fix en dos. | Extraer `<OrderCard />` compartido |
| 15 | `useAuthStore.ts` | `mapProfile()` y `mapAuthUser()` hacen lo mismo en 95%. Si cambias un campo, hay que actualizarlo en dos lugares. | Unificar en `mapUserData()` |
| 16 | `useSupabase.ts` | Mezcla de patrones: a veces `throw error.message`, a veces `return []` en el mismo tipo de error. | Estandarizar: throw siempre en mutations, return [] en queries |
| 17 | `ProductCard.tsx:45,79` | `alt=""` vacío en imágenes de producto. Accesibilidad pobre, lector de pantalla no describe la imagen. | Usar `alt={product.name}` |
| 18 | `MarketplacePage.tsx` | Filtros no tienen overlay de "cargando" mientras el query se ejecuta. El usuario no sabe si se aplicó el filtro. | Agregar spinner sobre la grid cuando `isLoading && !isError` |
| 19 | `useSupabase.ts` | `console.error()` esparcido sin estructura. Difícil de rastrear en producción. | Usar logger centralizado o prefijo uniforme `[hook:nombre]` |
| 20 | `Badge.tsx / Button.tsx` | Variante `success` e `info` existen en Badge pero no en Button. Inconsistencia en el sistema de diseño. | Agregar variantes faltantes a Button |

---

## Seguridad — Verificado y OK

| Tema | Estado |
|------|--------|
| `supabase.ts` — ANON_KEY en código | ✅ Es clave pública por diseño de Supabase. No es sensible. |
| RLS en tablas críticas | ✅ Configurado en products, courts, tournaments, coaches, reservations, orders, notifications, posts, reviews, post_comments, storage |
| XSS en contenido de BD | ✅ Supabase retorna texto plano. React escapa por defecto. Sin dangerouslySetInnerHTML. |
| Wompi PUBLIC_KEY | ✅ Es clave pública de widget. No expone capacidad de cobro. |
| Auth en mutations | ✅ `requireUid()` lanza excepción. RLS rechaza en BD como segunda capa. |

---

## Estado de hooks — abortSignal

| Hook | Estado |
|------|--------|
| `useUpdateProduct` | ✅ Simplificado — sin abortSignal |
| `useUpdateCourt` | ✅ Simplificado — sin abortSignal |
| `useProducts` | ✅ Simplificado — sin abortSignal |
| `useCreateProduct` | ⚠️ Aún tiene abortSignal con timer de 20s |

---

## Resuelto — Julio 2026

- [x] `clearCart()` en `onSuccess`/tras confirmación en ambos flujos de CheckoutPage (cash y Wompi) — ya estaba corregido de una sesión anterior
- [x] `useCreateProduct` simplificado sin `AbortController` — ya estaba corregido
- [x] `activeRole` validado contra `loaded.roles` en `loadSession` — ya estaba corregido
- [x] Canvas context validado en `ImageUpload.getCroppedBlob` (throw explícito si `null` en vez de `!` forzado)
- [x] Orden huérfana mitigada: si falla el insert de `order_items`, se hace rollback (`delete`) de la orden — atomicidad real pendiente de RPC (ver abajo)
- [x] Feedback de cancelación de Wompi (`toast.info`) cuando el usuario cierra el widget sin pagar
- [x] Botón de pago deshabilitado mientras el widget de Wompi no está listo (`disabled={paymentMethod !== 'cash' && !wompiReady}`)
- [x] Filtro `specialty` de coaches movido a server-side (`query.contains('specialties', [...])`)
- [x] `insertNotification` envuelto en try-catch con logging `[insertNotification]`
- [x] `useToggleFavorite` ignora `23505` (duplicado) en vez de mostrar error por doble clic
- [x] `onAuthStateChange` fuerza logout si `TOKEN_REFRESHED` trae un `user.id` distinto al de la sesión en memoria
- [x] Form de `ProfilePage` se resincroniza vía `useEffect` cuando cambia `user.id` (sin pisar una edición en curso)
- [x] Import `TrendingUp` sin usar removido de `DashboardPage`
- [x] Variantes `success`/`info` agregadas a `Button` (paridad con `Badge`)
- [x] 3 errores de `tsc -b` preexistentes corregidos: `roles` faltante en mocks de `mockCoaches`, `ShippingForm` sin index signature, variant `'default'` inválida en `ProductDetailPage`

## Resuelto — v1.0 (Julio 2026)

- [x] Atomicidad real orders/order_items vía RPC `create_order_with_items` en Postgres
      (transacción única: recalcula total, valida y descuenta stock, crea orden + items)
      — ver `supabase/sql/002_create_order_with_items.sql`. **Requiere ejecutarse en el
      SQL Editor de Supabase antes de que el checkout actualizado funcione.**
- [x] Precio del checkout ya no se confía del cliente — se recalcula en la función de Postgres
- [x] Credencial real hardcodeada en `supabase.ts` removida (ver sección crítica arriba)
- [x] Tests automatizados: Vitest + 22 tests en `cartStore`/`utils` (lógica de dinero y stock)
- [x] CI: GitHub Actions corriendo typecheck + test + build en cada PR/push a `main`
- [x] Rebrand completo a Canchazo (nombre, marca, copy, README, datos de contacto)

## Resuelto — v1.5 (Julio 2026)

- [x] Plan Pro + comisión por transacción: tabla `subscriptions`, función `has_pro_plan()`,
      comisión calculada por línea en `create_order_with_items` — ver
      `supabase/sql/003_subscriptions_and_commission.sql`
- [x] Página `/pricing` con flujo de upgrade real contra Wompi
- [x] Exportación CSV en analítica de vendedor
- [x] Deduplicado el loader del script de Wompi (`useWompiScript`) entre Checkout y Pricing

## Limitaciones conocidas y aceptadas — v1.5

- **Activación de Pro no se verifica en servidor.** Igual que el resto del checkout
  con Wompi en esta app, se activa desde el callback del widget en el navegador
  cuando Wompi reporta el pago aprobado. Es el mismo modelo de confianza que ya
  usa `create_order_with_items` — no es una regresión, pero tampoco es una
  verificación real (requeriría un webhook de Wompi + Edge Function con la
  llave privada). El monto en riesgo es una mensualidad, no el total de una
  orden, así que no bloquea el lanzamiento — pero debe resolverse antes de
  escalar el volumen de suscripciones Pro.
- **No hay cobro recurrente automático.** El plan Pro se paga manualmente cada
  30 días con el mismo widget de pago único. Auto-renovación real requiere la
  API de tokenización/tarjetas guardadas de Wompi.
- **WhatsApp Business no implementado.** Requiere una cuenta de Meta Business
  API que el proyecto no tiene todavía — no se construyó un stub falso.

## Resuelto — v2.0 parcial (Julio 2026)

- [x] Libro de liquidaciones a vendedores (`payouts`, `get_vendor_balance`, `generate_payout`, `mark_payout_paid`)
- [x] Panel `/admin`: generar/pagar liquidaciones, verificar entrenadores
- [x] Insignia "Verificado" para entrenadores en listado y detalle

## Limitaciones conocidas — v2.0

- **Liquidaciones solo cubren vendedores del marketplace.** Dueños de cancha no
  tienen comisión registrada en las reservas todavía — extenderlo requiere
  primero llevar el mismo tracking de `commission_rate`/`commission_amount` a
  esa tabla, que no existe hoy.
- **Sin motor de brackets de torneos.** Diferido a propósito — ver ROADMAP.md,
  sesión del 22 de julio.
- **Sin consola multi-tenant real.** `/admin` hoy administra una sola instancia
  (liquidaciones + verificación); multi-tenant (marca blanca por ciudad) sigue
  siendo v3.0.

## Resuelto — v2.0 cierre (Julio 2026)

- [x] Motor de brackets de torneos (`lib/bracket.ts`, 11 tests) + `tournament_matches` +
      UI en `OrganizerDashboardPage` (generar/registrar resultados) y `TournamentDetailPage` (lectura)
- [x] Bug preexistente: `useMyTournaments` no unía `tournament_participants` — el panel de
      organizador nunca mostraba inscritos reales. Corregido de paso al construir el bracket.

## Resuelto — cierre de huecos (Julio 2026)

- [x] `total_price` de reservas ya no se confía del cliente — nueva función
      `create_reservation` lo recalcula desde `courts.price_per_hour` en servidor
- [x] Anti-sobreventa real en reservas: `create_reservation` bloquea la cancha
      dentro de la transacción y rechaza si ya existe una reserva que se solape
      en esa fecha/horario — antes la validación de choque era solo visual (los
      slots en rojo), nada impedía dos reservas simultáneas del mismo horario
- [x] `PlanStatus` ya no muestra "Comisión 8%" en los dashboards de cancha,
      torneos y entrenador — ahí no se cobra comisión de verdad (ver abajo)

## Por qué NO se extendió comisión/liquidaciones a canchas, torneos o coaching

Investigado a fondo antes de construir nada: a diferencia del marketplace,
**reservar una cancha, inscribirse a un torneo o solicitar una sesión de
entrenador no cobra ningún dinero a través de Canchazo hoy** — ninguno de esos
tres flujos invoca el widget de Wompi ni ningún otro medio de pago; el dinero
se paga en persona en la cancha, o directamente entre las partes. Calcular una
"comisión" sobre dinero que la plataforma nunca recibe habría sido un número
de mentira, y generar una "liquidación" para pagarle al dueño de la cancha algo
que nunca se le retuvo, un absurdo.

**Prerrequisito real:** antes de poder cobrar comisión en estos tres flujos,
primero hay que agregar cobro de verdad a través de Canchazo en el momento de
reservar/inscribirse (el mismo widget de Wompi que ya usa el checkout del
marketplace). Eso es una feature nueva, no un hueco que cerrar — por eso queda
fuera de esta sesión, documentada aquí en vez de construida a medias.

## Resuelto — más cierre de huecos (Julio 2026)

- [x] Instalado y configurado ESLint de verdad (flat config, ESLint 10 +
      typescript-eslint). `npm run lint` corre en CI ahora.
- [x] Code-splitting por ruta con `React.lazy` — bundle inicial 766 kB → 123 kB
- [x] Edge Function `wompi-webhook` escrita + tabla `payment_events` — auditoría
      server-side de pagos, con firma verificada. **No desplegada** (sin acceso
      a Supabase CLI ni a Wompi desde este entorno) y **no verificada contra el
      sandbox real de Wompi** — revisa el formato de firma contra
      https://docs.wompi.co/docs/colombia/eventos/ antes de confiar en esto en
      producción. Tampoco reconcilia órdenes automáticamente todavía: hoy solo
      registra lo que Wompi reporta, nada actualiza el estado de una orden si
      hay una discrepancia con lo que dijo el navegador.
- [x] `mapProfile`/`mapAuthUser` unificados vía `buildUser()` compartido

## Pendiente de fix en código

- [ ] Desplegar y probar `wompi-webhook` contra el sandbox real de Wompi antes de confiar en la firma
- [ ] Reconciliación automática de órdenes usando `payment_events` (hoy es solo auditoría, no acción)
- [ ] Cobro real (Wompi) en el momento de reservar cancha / inscribirse a torneo — prerrequisito de cualquier comisión ahí
- [ ] Webhook de Wompi + Edge Function para verificar pagos (checkout y Pro) en servidor
- [ ] Cobro recurrente real del plan Pro (tokenización Wompi)
- [ ] Extraer `<OrderCard />` compartido entre `DashboardPage` y `ProfilePage` (evaluado: el JSX no es tan idéntico como se pensaba — Dashboard es una preview compacta, Profile es la lista completa con items — bajo valor de extracción real)
- [ ] Unificar `mapProfile()` y `mapAuthUser()` en `useAuthStore.ts`
- [ ] Instalar y configurar ESLint (el script `lint` existe en `package.json` pero el paquete `eslint` no está en `devDependencies`)
- [ ] Code-splitting: el bundle principal pesa ~746 kB (194 kB gzip) — usar `import()` dinámico por ruta o `manualChunks`
- [ ] Rotar la clave anon de Supabase expuesta anteriormente (acción manual en el dashboard)
- [ ] Ejecutar `supabase/sql/002` a `005` en la instancia real de Supabase, en orden numérico
