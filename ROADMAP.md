# Roadmap — Tolima Deportes v2

Estado actual del proyecto y dirección de desarrollo.
Universidad de Ibagué · Ingeniería de Sistemas · 2026

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

## Bugs de auditoría — Pendiente fix

> Ver `AUDIT.md` para detalle completo

- [ ] `clearCart()` mover a `onSuccess` en CheckoutPage (**alta prioridad**)
- [ ] Validar canvas context en ImageUpload (`getContext('2d')`)
- [ ] Deshabilitar botón Wompi mientras el widget carga
- [ ] Manejar cancelación de Wompi con feedback
- [ ] Resincronizar form de perfil cuando `user` cambia
- [ ] Simplificar `useCreateProduct` (quitar AbortController)
- [ ] Filtro specialty coaches → server-side
- [ ] Configurar URL redirect reset contraseña en Supabase dashboard

---

## Próximo — Prioridad Alta

### Fixes de auditoría críticos
- [ ] Checkout: `clearCart` después de confirmar, no antes
- [ ] Wompi: feedback de cancelación + deshabilitar botón mientras carga

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
