# Auditoría Técnica — Tolima Deportes v2
Última actualización: Mayo 2026

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

## Pendiente de fix en código

- [ ] `clearCart()` mover a `onSuccess` en CheckoutPage
- [ ] Validar canvas context en ImageUpload
- [ ] Deshabilitar botón Wompi mientras carga
- [ ] Manejar cancelación de Wompi con feedback
- [ ] Resincronizar form de perfil cuando cambia `user`
- [ ] Simplificar `useCreateProduct` (quitar abortSignal)
- [ ] Agregar try-catch a `insertNotification`
- [ ] Filtro de specialty de coaches server-side
- [ ] Remover import `TrendingUp` sin usar en DashboardPage
