# Roadmap — Canchazo (antes Tolima Deportes v2)

Estado actual del producto y dirección de desarrollo hacia un SaaS vendible.
Ver el brief de transformación de producto para el contexto de marca, modelo de
negocio y las cuatro fases (v1.0 → v3.0) acordadas con el founder.

---

## Estado actual — Mayo 2026

### Completado

#### Infraestructura
- [x] React 18 + TypeScript + Vite
- [x] Supabase (Auth + DB + Storage + RLS en 11 tablas)
- [x] Zustand (authStore + cartStore) con localStorage
- [x] TanStack React Query + Supabase Realtime en notificaciones
- [x] Tailwind CSS v4 + Radix UI + Lucide React
- [x] Modo claro/oscuro
- [x] ScrollToTop en cada navegación
- [x] ErrorBoundary global

#### Autenticación
- [x] Registro con selección de rol inicial
- [x] Login: toggle contraseña + recuperación por email
- [x] Sesión persistida + sincronización `onAuthStateChange`
- [x] Sistema de roles múltiples por cuenta
- [x] `activeRole` seleccionable en Dashboard y Navbar
- [x] Gestión de roles con toggles en Perfil

#### Marketplace
- [x] Listado con filtros (categoría, precio, orden) + vista grid/lista
- [x] Detalle de producto con galería, selector de cantidad y stock
- [x] Carrito: límite de stock, botón "Agregado" permanente, sin login requerido
- [x] Checkout: 3 pasos (envío → pago → confirmación), Wompi + PSE + contraentrega

#### Canchas
- [x] Listado con búsqueda y filtro por deporte
- [x] Detalle: galería, amenidades, horarios disponibles
- [x] Calendario de reserva: slots en rojo si ocupados, valida rangos
- [x] Cancelar reserva propia desde Perfil
- [x] Dashboard dueño: Tabs Canchas (CRUD) + Reservas (confirmar/cancelar)

#### Torneos
- [x] Listado y detalle con inscripción
- [x] Dashboard organizador: CRUD + lista de participantes expandible

#### Entrenadores
- [x] Listado y detalle
- [x] Solicitar sesión desde detalle → notificación al entrenador
- [x] Dashboard entrenador: perfil (especialidades, tarifa, certs) + solicitudes recibidas

#### Vendedor
- [x] Dashboard: Tabs Productos (CRUD + imágenes) + Pedidos recibidos + Estadísticas
- [x] Alerta de stock bajo (≤ 5 unidades)
- [x] Gráfica de valor de catálogo por categoría (Recharts)

#### Comunidad
- [x] Feed de publicaciones con imágenes (hasta 4)
- [x] Comentarios: publicar, eliminar propio
- [x] Likes con actualización optimista
- [x] Filtro por tema deportivo

#### Perfil de usuario
- [x] Tabs: Resumen, Pedidos, Reservas (con cancelar), Notificaciones, Configuración
- [x] Edición de datos personales
- [x] Foto de perfil con recortador circular (react-easy-crop)
- [x] Gestión de roles con toggles

#### Notificaciones
- [x] Centro de notificaciones con iconos por tipo
- [x] Tiempo real con Supabase Realtime (INSERT listener)
- [x] Auto-generación al reservar cancha, inscribir torneo, comprar productos
- [x] Marcar leída / marcar todas

#### Imágenes
- [x] Subida desde dispositivo a Supabase Storage
- [x] Recortador circular para avatar
- [x] Fallback automático si no hay imagen

#### Reseñas
- [x] Sistema de reseñas para productos, canchas y entrenadores
- [x] Trigger en Supabase actualiza rating automáticamente
- [x] Estrellas por click (default 3), etiqueta de texto, sin hover

---

## Bugs de auditoría — Resueltos Julio 2026

> Ver `AUDIT.md` para detalle completo. Todos los ítems críticos y de severidad media
> de la auditoría de Mayo 2026 están resueltos, salvo la atomicidad transaccional
> completa de `create_order_with_items` (mitigada con rollback, RPC pendiente).

- [x] `clearCart()` en `onSuccess` en CheckoutPage
- [x] Validar canvas context en ImageUpload (`getContext('2d')`)
- [x] Deshabilitar botón Wompi mientras el widget carga
- [x] Manejar cancelación de Wompi con feedback
- [x] Resincronizar form de perfil cuando `user` cambia
- [x] Simplificar `useCreateProduct` (quitar AbortController)
- [x] Filtro specialty coaches → server-side
- [ ] Configurar URL redirect reset contraseña en Supabase dashboard (requiere acceso al dashboard, no es un cambio de código)

---

## Próximo — Prioridad Alta

### Técnico
- [ ] RPC `create_order_with_items` en Supabase para atomicidad real (orders + order_items)
- [ ] Instalar y configurar ESLint (script existe, falta el paquete)
- [ ] Code-splitting del bundle principal (~740 kB) con `import()` dinámico por ruta

### Búsqueda global
- [ ] Buscador unificado: productos, canchas, torneos, entrenadores
- [ ] Resultados agrupados por categoría
- [ ] Filtros por ubicación y precio

### Checkout mejorado
- [ ] Confirmación de orden por email (Supabase Edge Functions)
- [ ] Estado de orden en tiempo real (Realtime)

---

## Próximo — Prioridad Media

### Canchas
- [ ] Disponibilidad por horario configurable desde el dashboard

### Torneos
- [ ] Bracket/fixture del torneo
- [ ] Resultados en tiempo real

### Comunidad
- [ ] Menciones de usuarios (@usuario)
- [ ] Compartir publicación (copiar link)

### Técnico
- [ ] Extraer `<OrderCard />` compartido (duplicado en Dashboard y Profile)
- [ ] Unificar `mapProfile()` y `mapAuthUser()` en `mapUserData()`
- [ ] Estandarizar variantes Badge/Button

---

## Próximo — Prioridad Baja

### Técnico
- [ ] Tests unitarios (Vitest)
- [ ] Tests E2E (Playwright)
- [ ] CI/CD con GitHub Actions
- [ ] PWA (installable, offline básico)
- [ ] SEO (meta tags dinámicos)

### UX / Diseño
- [ ] Onboarding para nuevos usuarios
- [ ] Página 404 personalizada
- [ ] Skeleton loaders uniformes en todas las páginas
- [ ] Accesibilidad WCAG 2.1 (alt text, roles ARIA)

### Negocio
- [ ] Dashboard admin con métricas globales
- [ ] Sistema de comisiones para vendedores
- [ ] Verificación de identidad para entrenadores
- [ ] Landing page con SEO

---

## Arquitectura

```
src/app/
├── pages/          28 páginas
├── components/
│   ├── layout/     Navbar, Footer
│   ├── ui/         Button, Card, Input, Badge, ThemeToggle
│   ├── shared/     ErrorBoundary, ReviewSection, ImageUpload
│   └── marketplace/ ProductCard
├── stores/         authStore (roles + activeRole), cartStore
├── hooks/          useSupabase (50+ hooks), useTheme
├── lib/            supabase, utils, mockData
└── types/          User, Product, Court, Tournament, Coach...
```

## Stack

| Capa | Tecnología |
|---|---|
| UI | React 18 + TypeScript |
| Estilos | Tailwind CSS v4 + Radix UI |
| Routing | React Router v7 |
| Estado | Zustand |
| Data | TanStack React Query |
| Realtime | Supabase Realtime |
| Backend | Supabase (Auth + DB + Storage + RLS) |
| Recorte | react-easy-crop |
| Gráficas | Recharts |
| Animaciones | Motion |
| Toasts | Sonner |
| Iconos | Lucide React |
| Build | Vite 6 |

---

## Sesiones

**Julio 22, 2026 — cierre de huecos existentes**
- **Reservas de cancha blindadas**: nueva función `create_reservation`
  (`supabase/sql/006_reservation_integrity.sql`) — recalcula el precio en
  servidor desde `courts.price_per_hour` (antes se confiaba del navegador,
  igual que el checkout antes del fix de v1.0) y bloquea la cancha dentro de
  la transacción para que dos reservas simultáneas no se cuelen en el mismo
  horario (antes la validación de choque era solo visual)
- **`PlanStatus` corregido**: ya no dice "Comisión 8%" en los dashboards de
  cancha, torneos y entrenador — investigué y confirmé que esos tres flujos no
  cobran nada a través de Canchazo hoy (se paga en persona), así que esa línea
  era un dato falso. Solo el marketplace la muestra.
- **ESLint instalado y configurado de verdad** (el script existía desde antes
  pero el paquete nunca se instaló). Encontró y se corrigieron bugs reales:
  código muerto en `ProductDetailPage` (`?? 'Vendedor'` que nunca podía
  activarse), un patrón impuro en `CheckoutPage` (`Math.random()` dentro de
  `useMemo`, movido a un inicializador de `useState`), y un `setState`
  síncrono en `useWompi.ts`. Dos hallazgos de la misma familia en
  `ProfilePage`/`CoachDashboardPage` se dejaron en `warn` a propósito — son
  patrones intencionales, no bugs; arreglarlos del todo implica remontar el
  form con `key` en vez de un effect, un cambio estructural que merece su
  propia revisión.
- **Code-splitting por ruta**: todas las páginas ahora son `React.lazy()`. El
  bundle inicial bajó de ~766 kB a ~123 kB; ya no aparece ninguna advertencia
  de tamaño de chunk. Verificado en navegador real que las rutas cargan bien.
- **Edge Function de Wompi escrita** (`supabase/functions/wompi-webhook/`) +
  tabla `payment_events` — auditoría server-side de lo que Wompi realmente
  reporta, con firma verificada. No desplegada (sin acceso a Supabase CLI ni a
  una cuenta de Wompi desde este entorno) y no reconcilia órdenes
  automáticamente todavía — ver AUDIT.md para el alcance exacto.
- **`mapProfile`/`mapAuthUser` unificados** en `authStore.ts` vía un
  `buildUser()` compartido — mismo comportamiento, sin la lógica de defaults
  duplicada.

**Julio 22, 2026 — verificación en navegador real + `.env.local` creado**
- `.env.local` creado con las credenciales reales de Supabase del proyecto
  (mapeadas de `NEXT_PUBLIC_*` a `VITE_*`, que es lo que Vite expone al cliente)
- Verificado en Edge headless (Playwright, no solo build): Marketplace carga
  productos reales, marca Canchazo visible en Navbar/Footer, sin errores de consola
- Fix: `Card.tsx` pasaba `whileHover`/`transition` (props de Framer Motion) a
  un `<div>` plano cuando la tarjeta no era interactiva, generando warnings de
  React sobre atributos HTML desconocidos — ahora esas props solo se aplican
  cuando el componente realmente es `motion.div`

**Julio 22, 2026 — fix: página en blanco en local**
- El hard-fail de `supabase.ts` (agregado en la sesión de v1.0 para no exponer
  credenciales) lanzaba error a nivel de módulo cuando faltaba `.env.local` —
  ocurre antes de que React monte, así que el `ErrorBoundary` nunca lo veía y
  la página quedaba en blanco sin ningún mensaje
- Reemplazado por `isSupabaseConfigured` + `<SetupScreen />`: la app monta
  normalmente y muestra instrucciones claras en pantalla si faltan las
  variables de entorno, en vez de un `throw` silencioso
- Verificado en navegador headless (Edge vía Playwright): pantalla de
  configuración visible, cero errores de consola

**Julio 22, 2026 — v2.0 "Confianza y escala" (cierre): motor de brackets**
- Motor de eliminación simple puro en `src/app/lib/bracket.ts`, con siembra
  estándar (1v8, 4v5, 2v7, 3v6…) para que ningún bye quede enfrentado contra
  otro bye, y sin avances automáticos más allá de la ronda 1 — 11 tests
  cubriendo el caso exacto que se buscaba evitar (un bye "ganando" de más en
  ronda 2 antes de que su rival real esté decidido)
- Tabla `tournament_matches` (`supabase/sql/005_tournament_brackets.sql`,
  ejecutar después de 002-004) — la generación y el avance de ganadores viven
  en TypeScript probado, la tabla solo persiste el resultado
- `<Bracket />` compartido: solo-lectura en `TournamentDetailPage`, con
  control "Ganó" por partido en `OrganizerDashboardPage`
- **Bug preexistente corregido de paso:** `useMyTournaments` no unía
  `tournament_participants`, así que "Ver participantes" en el dashboard de
  organizador siempre mostraba "Sin inscritos aún" sin importar cuántas
  inscripciones reales hubiera. Necesario arreglarlo para poder generar el
  bracket con los participantes correctos.

**Julio 22, 2026 — v2.0 "Confianza y escala" (parcial)**
- Libro de liquidaciones a vendedores: tabla `payouts`, `order_items.payout_id`,
  RPCs `get_vendor_balance` / `generate_payout` / `mark_payout_paid`
  (`supabase/sql/004_payouts_and_verification.sql`, ejecutar después de 002 y 003)
- Tab "Liquidaciones" en el dashboard de vendedor: saldo pendiente (bruto,
  comisión, neto) + historial
- Nueva página **`/admin`** (rol admin): genera liquidaciones por vendedor,
  marca liquidaciones como pagadas, verifica/desverifica entrenadores — es la
  semilla de la consola de administración, no todavía multi-tenant
- Badge "Verificado" en `CoachesPage` y `CoachDetailPage`
- Enlace "Panel admin" en el menú de usuario, visible solo si el rol activo
  incluye `admin`
- **Alcance recortado a propósito:** las liquidaciones cubren solo vendedores
  del marketplace, porque son la única línea de negocio con comisión
  registrada (desde v1.5). Dueños de cancha quedan fuera hasta extender ese
  mismo tracking a las reservas.
- **Diferido explícitamente a un próximo turno:** el motor de brackets de
  torneos. Es un motor de emparejamiento con lógica no trivial (byes, avance de
  ganadores) — construirlo de prisa junto a dos features grandes ya entregadas
  arriesgaba bugs sutiles de bracket. Merece su propio pase con tests dedicados.

**Julio 22, 2026 — v1.5 "MVP de monetización"**
- Tabla `subscriptions` + función `has_pro_plan()` en Postgres
  (`supabase/sql/003_subscriptions_and_commission.sql`). **Requiere ejecutarse en
  Supabase, después de 002, antes de usar el plan Pro.**
- `create_order_with_items` ahora calcula comisión por línea (8% plan gratuito,
  3% con Pro) usando el plan del vendedor — sienta la base del libro de
  liquidaciones de v2.0
- Página `/pricing` con los 3 planes (Fan, Pro, Ciudad) y flujo de upgrade real
  contra el widget de Wompi existente
- `PlanStatus` (badge de plan + CTA de upgrade) en los 4 dashboards de negocio
  (vendedor, dueño de cancha, organizador, entrenador)
- Exportación a CSV en la pestaña de Estadísticas del dashboard de vendedor
  (incluye comisión por línea)
- Extraído `useWompiScript()` a un hook compartido — Checkout y Pricing ya no
  duplican la carga del script del widget
- **Explícitamente NO implementado en esta fase:** notificaciones por WhatsApp
  Business (requiere cuenta de Meta Business API que no existe todavía) y
  auto-renovación real de Pro (requiere tokenización/webhooks de Wompi). El
  cobro de Pro hoy es manual cada 30 días vía el mismo widget de pago — no hay
  cobro recurrente automático todavía. Ver AUDIT.md.

**Julio 21, 2026 — v1.0 "Cimiento" (transformación a producto)**
- Rebrand completo a **Canchazo**: nombre, wordmark/mark SVG, README de producto,
  meta tags, copy de Navbar/Footer/Login/Register/páginas legales y FAQ
- Removidos datos personales (teléfono/email del equipo) de páginas públicas;
  reemplazados por `hola@canchazo.co` y el flujo de `/contact`
- **Seguridad — blindaje de precio**: nueva función Postgres `create_order_with_items`
  (`supabase/sql/002_create_order_with_items.sql`) que recalcula el total desde el
  precio real en BD, valida y descuenta stock, y crea orden + items en una sola
  transacción — cierra la manipulación de precio del checkout Y la orfandad de
  órdenes en un solo cambio. **Requiere ejecutar el SQL en Supabase antes de usar
  el checkout actualizado.**
- **Seguridad — credenciales**: `supabase.ts` ya no tiene una URL/clave real como
  fallback hardcodeado (estaba embebido en el bundle de producción); ahora falla
  explícito si faltan las variables de entorno
- **Tests + CI**: Vitest configurado, 22 tests en `cartStore` y `utils` (lógica de
  dinero/stock), GitHub Actions corriendo typecheck + test + build en cada PR
- FAQ corregido: ya no dice que el multi-rol "está en desarrollo" (ya existe)
- AboutPage: reencuadre de "somos estudiantes" a lenguaje de equipo fundador;
  quitado el stat falso "100% Open Source" que contradice el modelo de negocio

**Julio 21, 2026**
- Cierre de la auditoría técnica de Mayo: verificados y resueltos los 8 issues
  críticos/medios de `AUDIT.md` que aún estaban abiertos (canvas context, orfandad
  de orden, feedback Wompi, filtro specialty server-side, try-catch notificaciones,
  duplicados en favoritos, resync de perfil, verificación de identidad en token refresh)
- Corregidos 3 errores de `tsc -b` preexistentes que impedían un build limpio
- `npm install` + `npm run build:check` verificados de punta a punta sin errores
- Variantes `success`/`info` agregadas a `Button` para paridad con `Badge`
- Documentado: RPC de atomicidad de órdenes, instalación de ESLint y code-splitting
  del bundle quedan como próximos pasos técnicos (ver arriba)

**Mayo 15, 2026**
- Auditoría técnica completa (ver AUDIT.md)
- Fixes: trigger reseñas, estrellas por click default 3, fallbacks imágenes
- Notificaciones realtime + auto-generación en eventos clave
- Vendor: pedidos recibidos + estadísticas Recharts + alerta stock
- Coach: solicitudes de sesión + dashboard
- CourtOwner: reservas recibidas + confirmar/cancelar
- Organizer: lista de participantes expandible
- Comunidad: imágenes en publicaciones
- Cancelar reserva propia desde Perfil
- Calendario: slots rojos después de reservar, validación de rangos

**Mayo 14, 2026**
- Sistema de roles múltiples completamente implementado
- RLS en 11 tablas con función `has_role()`
- Dashboards de 4 roles con CRUD completo
- Subida de imágenes desde dispositivo + recortador circular
- Carrito con límite de stock
- Comunidad con comentarios eliminables
- ScrollToTop, fixes de login, calendario de canchas
