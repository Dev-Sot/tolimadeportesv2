<div align="center">

# Canchazo

**El sistema operativo del deporte local.**
Marketplace, reservas de cancha, torneos, entrenadores y comunidad en una sola plataforma.

[![CI](https://github.com/Dev-Sot/canchazo/actions/workflows/ci.yml/badge.svg)](https://github.com/Dev-Sot/canchazo/actions/workflows/ci.yml)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-informational)

</div>

---

## Descripción

El ecosistema deportivo de una ciudad intermedia colombiana vive repartido entre
grupos de WhatsApp, cuadernos de reservas y carteleras físicas. No falta
demanda — falta un sistema que la organice.

**Canchazo** le da a vendedores de equipamiento, dueños de cancha, organizadores
de torneos y entrenadores un solo lugar para vender, reservar y cobrar — y a los
deportistas, un solo lugar para encontrarlos. Es un marketplace de dos lados:
el usuario final siempre es gratis; el negocio que vende a través de la
plataforma paga una suscripción o una comisión por transacción.

## Características principales

- 🛒 **Marketplace** con carrito, filtros, y checkout multi-método (Wompi,
  PSE, contraentrega) — el total se recalcula en una función de Postgres,
  nunca se confía en lo que envía el navegador
- 📅 **Reservas de cancha** con calendario en tiempo real; la disponibilidad
  se valida en servidor dentro de una transacción para que dos personas no
  puedan reservar el mismo horario
- 🏆 **Torneos** con motor de brackets de eliminación simple propio (siembra
  estándar, sin byes enfrentados entre sí, sin avances prematuros) — probado
  con tests unitarios dedicados
- 🧑‍🏫 **Entrenadores** con perfil, solicitudes de sesión e insignia de
  verificación administrada desde el panel admin
- 💬 **Comunidad** con publicaciones, imágenes, comentarios y likes
- 👥 **Roles múltiples por cuenta** — un mismo usuario puede ser cliente,
  vendedor y dueño de cancha a la vez, sin cuentas separadas
- 💳 **Plan Pro** con comisión reducida (3% vs. 8%) y página de precios
- 💰 **Liquidaciones a vendedores** — libro de pagos con saldo pendiente,
  generación de liquidación y marcado como pagada desde el panel admin
- 🔔 Notificaciones en tiempo real vía Supabase Realtime
- 🌗 Modo claro/oscuro, diseño responsive, accesibilidad (roles ARIA, foco
  visible, skip-nav)
- ✅ Tests automatizados (Vitest), lint (ESLint) y CI (GitHub Actions) en cada
  cambio

## Screenshots

<!-- TODO: agregar capturas reales antes de publicar -->

| Marketplace | Checkout | Dashboard de vendedor |
|---|---|---|
| _(pendiente)_ | _(pendiente)_ | _(pendiente)_ |

| Reserva de cancha | Bracket de torneo | Panel admin |
|---|---|---|
| _(pendiente)_ | _(pendiente)_ | _(pendiente)_ |

## Tecnologías utilizadas

**Frontend:**
React 18 · TypeScript · Vite 6 · Tailwind CSS v4 · Zustand · TanStack Query ·
React Router v7 · Motion · Radix UI · Recharts · Lucide Icons · Sonner

**Backend:**
Supabase (Auth + Storage + Realtime + Edge Functions en Deno) · Funciones
`PL/pgSQL` para la lógica crítica de dinero (precio, stock, comisión,
liquidaciones) — corren en el servidor, no en el navegador

**Base de datos:**
PostgreSQL (vía Supabase) con Row Level Security en cada tabla sensible

**Herramientas:**
Vitest + Testing Library · ESLint (flat config) · GitHub Actions · Vercel ·
Wompi (pasarela de pagos colombiana)

## Arquitectura

```
src/
├── app/
│   ├── components/
│   │   ├── ui/          # Button, Card, Badge, Input, ThemeToggle
│   │   ├── layout/       # Navbar, Footer
│   │   ├── marketplace/  # ProductCard
│   │   └── shared/       # Logo, Bracket, PlanStatus, ImageUpload, ErrorBoundary...
│   ├── pages/            # Una página por ruta (lazy-loaded)
│   ├── stores/           # authStore, cartStore (Zustand)
│   ├── hooks/            # useSupabase.ts — toda la capa de datos
│   ├── lib/              # supabase.ts, utils.ts, bracket.ts (motor puro)
│   └── types/            # TypeScript types
├── test/                 # setup de Vitest
└── styles/               # theme.css (dark mode), index.css

supabase/
├── sql/                  # migraciones numeradas (002 → 007)
└── functions/            # Edge Functions (Deno) — ej. wompi-webhook
```

**Decisiones clave:**

- **Estado de servidor vs. cliente separado**: TanStack Query para todo lo que
  viene de Supabase, Zustand solo para estado verdaderamente local (sesión,
  carrito).
- **La plata nunca se confía del navegador**: crear una orden, reservar una
  cancha o activar el plan Pro pasa por una función de Postgres (`SECURITY
  DEFINER`) que recalcula el precio real, valida stock/disponibilidad y hace
  todo en una sola transacción — no dos inserts separados desde el cliente.
- **El motor de brackets es una función pura** (`lib/bracket.ts`) sin ninguna
  dependencia de React ni de Supabase, con su propia suite de tests. La base
  de datos solo persiste lo que esa función calcula.
- **Code-splitting por ruta** con `React.lazy` — cada página es su propio
  chunk; el bundle inicial no carga los 28 dashboards de una vez.

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/Dev-Sot/canchazo.git
cd canchazo

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# completa .env.local con tus propias credenciales (ver sección de abajo)

# 4. Crear un proyecto en supabase.com y ejecutar, EN ORDEN, cada archivo de:
#    supabase/sql/002_create_order_with_items.sql
#    supabase/sql/003_subscriptions_and_commission.sql
#    supabase/sql/004_payouts_and_verification.sql
#    supabase/sql/005_tournament_brackets.sql
#    supabase/sql/006_reservation_integrity.sql
#    supabase/sql/007_payment_events.sql

# 5. Correr en desarrollo
npm run dev   # → http://localhost:5173
```

## Variables de entorno

```bash
# .env.example

# ── Supabase (obligatorio) ──────────────────────────────────────────────────
# Project Settings → API en supabase.com/dashboard
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ── Wompi — pasarela de pagos colombiana (opcional para desarrollo) ─────────
# dashboard.wompi.co → Configuración → Llaves de API
VITE_WOMPI_PUBLIC_KEY=pub_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ── App (opcional) ──────────────────────────────────────────────────────────
VITE_APP_NAME=Canchazo
VITE_APP_URL=http://localhost:5173
```

> Sin `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` la app muestra una pantalla
> de configuración en vez de una página en blanco — nunca falla en silencio.

## Uso

```bash
npm run dev          # servidor de desarrollo
npm run build        # build de producción
npm run preview       # sirve el build localmente
npm run test          # corre la suite de Vitest
npm run lint           # ESLint
npm run typecheck      # tsc -b
npm run build:check    # typecheck + build, todo en uno
```

**Cuentas demo** (créalas en tu propio Supabase Auth → Users → Add user):

| Email | Rol |
|---|---|
| cliente@canchazo.co | customer |
| vendedor@canchazo.co | vendor |
| admin@canchazo.co | admin |
| organizador@canchazo.co | organizer |
| cancha@canchazo.co | court_owner |
| coach@canchazo.co | coach |

## Roadmap

- [ ] Desplegar y probar el webhook de Wompi (`supabase/functions/wompi-webhook`)
      contra su sandbox real antes de confiar en la verificación de firma
- [ ] Reconciliación automática de órdenes a partir de `payment_events`
- [ ] Cobro real (Wompi) en el momento de reservar cancha / inscribirse a
      torneo — prerrequisito para extender comisión y liquidaciones ahí
- [ ] Cobro recurrente real del plan Pro (tokenización de Wompi)
- [ ] Notificaciones por WhatsApp Business
- [ ] Licenciamiento de ciudad / marca blanca (multi-tenant)
- [ ] App móvil (React Native / Expo) reutilizando los hooks existentes
- [ ] API pública para integraciones de terceros

Detalle completo de decisiones y auditoría técnica en [AUDIT.md](./AUDIT.md) y
[ROADMAP.md](./ROADMAP.md). Para contribuir, ver [CONTRIBUTING.md](./CONTRIBUTING.md);
para reportar una vulnerabilidad, ver [SECURITY.md](./SECURITY.md).

## Autor

**Dev-Sot** — [github.com/Dev-Sot](https://github.com/Dev-Sot)

## Licencia

MIT — ver [LICENSE](./LICENSE).
