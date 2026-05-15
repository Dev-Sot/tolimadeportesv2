# Roadmap — Tolima Deportes v2

Estado actual del proyecto y dirección de desarrollo.
Universidad de Ibagué · Ingeniería de Sistemas · 2026

---

## Estado actual — Mayo 2026

### Completado

#### Infraestructura
- [x] Proyecto React 18 + TypeScript + Vite configurado
- [x] Supabase conectado (Auth + DB + Storage + RLS)
- [x] Zustand (authStore + cartStore) con persistencia localStorage
- [x] TanStack React Query para data fetching
- [x] Tailwind CSS v4 + Radix UI
- [x] Modo claro/oscuro
- [x] ScrollToTop en cada navegación
- [x] ErrorBoundary global

#### Autenticación
- [x] Registro con selección de rol inicial
- [x] Login con toggle mostrar/ocultar contraseña
- [x] Recuperación de contraseña por email (Supabase Auth)
- [x] Sesión persistida en localStorage
- [x] Sincronización automática con `onAuthStateChange`

#### Sistema de roles múltiples
- [x] Un usuario puede tener N roles simultáneos
- [x] `activeRole` — perfil activo seleccionable
- [x] Selector en Dashboard
- [x] Switcher rápido en Navbar
- [x] Gestión de roles con toggles en Perfil
- [x] `RoleRoute` verifica array de roles

#### Seguridad
- [x] RLS activado en 11 tablas
- [x] Función `has_role()` en Supabase
- [x] Storage bucket `images` con políticas por usuario

#### Marketplace
- [x] Listado de productos con filtros
- [x] Detalle de producto
- [x] Carrito con límite de stock
- [x] Botón "Agregado" permanente por estado del carrito
- [x] Checkout (ruta protegida)

#### Canchas
- [x] Listado y detalle de canchas
- [x] Reservas con selector de hora
- [x] Dashboard dueño: CRUD + stats

#### Torneos
- [x] Listado y detalle de torneos
- [x] Inscripción a torneos
- [x] Dashboard organizador: CRUD + stats + edit/delete

#### Entrenadores
- [x] Listado y detalle de entrenadores
- [x] Dashboard entrenador: perfil con especialidades, tarifa, certificaciones

#### Comunidad
- [x] Feed de publicaciones
- [x] Comentarios con eliminar propio
- [x] Likes con actualización optimista
- [x] Filtro por tema deportivo

#### Perfil de usuario
- [x] Tabs: Resumen, Pedidos, Reservas, Notificaciones, Configuración
- [x] Edición de datos personales
- [x] Subida de foto con recortador circular
- [x] Gestión de roles con toggles

#### Imágenes
- [x] Subida desde dispositivo a Supabase Storage
- [x] Recortador circular para foto de perfil (react-easy-crop)
- [x] Previews en tiempo real
- [x] Fallback por URL

---

## En progreso

- [ ] Verificar que perfil de entrenador aparece en `/coaches` al publicarse
- [ ] Configurar URL de redirect para reset de contraseña en Supabase dashboard
- [ ] Políticas RLS para tabla `coaches` INSERT/UPDATE

---

## Próximas funcionalidades — Prioridad Alta

### Checkout y pagos
- [ ] Flujo de checkout completo (dirección, método de pago)
- [ ] Integración pasarela de pago (PSE / Wompi para Colombia)
- [ ] Confirmación de orden por email
- [ ] Estado de orden en tiempo real

### Notificaciones
- [ ] Centro de notificaciones funcional
- [ ] Notificaciones en tiempo real (Supabase Realtime)
- [ ] Notificaciones push (PWA)

### Vendedor
- [ ] Gestión de órdenes recibidas en VendorDashboard
- [ ] Estadísticas de ventas con gráficas (Recharts)
- [ ] Control de inventario con alertas de stock bajo

### Entrenador
- [ ] Solicitudes de sesión de atletas
- [ ] Calendario de disponibilidad
- [ ] Sistema de reseñas para entrenadores

---

## Próximas funcionalidades — Prioridad Media

### Canchas
- [ ] Vista de reservas del día para dueños
- [ ] Confirmación/rechazo de reservas
- [ ] Disponibilidad por horario configurable

### Torneos
- [ ] Lista de participantes inscritos
- [ ] Bracket/fixture del torneo
- [ ] Resultados en tiempo real

### Comunidad
- [ ] Compartir publicaciones
- [ ] Menciones de usuarios (@usuario)
- [ ] Subida de imágenes en publicaciones

### Búsqueda global
- [ ] Buscador unificado (productos, canchas, torneos, entrenadores)
- [ ] Filtros avanzados por ubicación y precio
- [ ] Resultados con mapa (Leaflet o Google Maps)

---

## Próximas funcionalidades — Prioridad Baja

### Técnico
- [ ] Tests unitarios (Vitest)
- [ ] Tests E2E (Playwright)
- [ ] CI/CD con GitHub Actions
- [ ] PWA (installable, offline básico)
- [ ] SEO (React Helmet / meta tags)

### UX / Diseño
- [ ] Onboarding para nuevos usuarios (tour guiado)
- [ ] Página 404 personalizada
- [ ] Skeleton loaders en todas las páginas
- [ ] Animaciones de transición entre páginas
- [ ] Soporte accesibilidad WCAG 2.1

### Negocio
- [ ] Dashboard admin con métricas globales
- [ ] Sistema de comisiones para vendedores
- [ ] Verificación de identidad para entrenadores
- [ ] Blog con CMS
- [ ] Landing page con SEO

---

## Arquitectura actual

```
src/app/
├── pages/          27 páginas
├── components/
│   ├── layout/     Navbar, Footer
│   ├── ui/         Button, Card, Input, Badge, ThemeToggle
│   ├── shared/     ErrorBoundary, ReviewSection, ImageUpload
│   └── marketplace/ ProductCard
├── stores/         authStore (roles + activeRole), cartStore
├── hooks/          useSupabase (40+ hooks), useTheme
├── lib/            supabase client, utils, mockData
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
| Backend | Supabase (Auth + DB + Storage + RLS) |
| Recorte imágenes | react-easy-crop |
| Animaciones | Motion |
| Validación | Zod |
| Toasts | Sonner |
| Iconos | Lucide React |
| Build | Vite 6 |

---

## Notas de sesión

**Mayo 2026**
- Sistema de roles múltiples implementado completamente
- RLS configurado en producción
- Dashboards de los 4 roles con CRUD completo
- Subida de imágenes desde dispositivo operativa
- Recortador circular para avatar funcionando
- Carrito con control de stock
- Comunidad con comentarios eliminables
