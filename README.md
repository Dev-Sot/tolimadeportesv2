# Tolima Deportes 🏆

Plataforma deportiva SaaS para el Tolima, Colombia. Marketplace, canchas, torneos, entrenadores y comunidad en un solo lugar.

## 🚀 Stack

- **React 18** + **TypeScript** + **Vite 6**
- **Tailwind CSS v4** + **Motion** (animaciones)
- **Zustand** (estado) + **React Query** (data fetching)
- **Supabase** (base de datos + auth)
- **Wompi** (pagos Colombia)
- **Vercel** (deploy)

## ⚡ Inicio rápido

```bash
# 1. Instalar dependencias
npm install

# 2. El .env.local ya está incluido con las credenciales reales
# Si necesitas cambiarlo, edita .env.local:
#   VITE_SUPABASE_URL=https://dqsshdzgbhiiaykaicdq.supabase.co
#   VITE_SUPABASE_ANON_KEY=sb_publishable_602zteSqODDubUD1gZiYyg_bJLIwI68

# 3. Correr en desarrollo
npm run dev   # → http://localhost:5173

# 4. Build para producción
npm run build

# 5. Preview del build
npm run preview
```

## 🗄️ Supabase — Setup inicial

1. Abre el SQL Editor en https://supabase.com/dashboard/project/dqsshdzgbhiiaykaicdq
2. Copia y pega el contenido de `supabase_tolima_sports.sql`
3. Haz clic en **Run** — crea todas las tablas, RLS, triggers y datos de demostración

## 🔑 Cuentas demo (crear en Supabase Auth)

Ve a **Authentication → Users → Add user** y crea:

| Email | Contraseña | Rol |
|---|---|---|
| cliente@tolima.com | client123 | customer |
| vendedor@tolima.com | vendor123 | vendor |
| admin@tolima.com | admin123 | admin |
| organizador@tolima.com | org123 | organizer |
| cancha@tolima.com | court123 | court_owner |
| coach@tolima.com | coach123 | coach |

## 🌐 Deploy en Vercel

1. Sube el proyecto a GitHub (**sin** el `.env.local`)
2. Importa en [vercel.com](https://vercel.com) → Framework: **Vite**
3. En **Environment Variables** agrega:
   ```
   VITE_SUPABASE_URL = https://dqsshdzgbhiiaykaicdq.supabase.co
   VITE_SUPABASE_ANON_KEY = sb_publishable_602zteSqODDubUD1gZiYyg_bJLIwI68
   VITE_WOMPI_PUBLIC_KEY = pub_test_... (cuando lo tengas)
   ```
4. Deploy ✅

## 💳 Wompi — Pagos Colombia

1. Crea cuenta en [dashboard.wompi.co](https://dashboard.wompi.co)
2. Ve a Configuración → Llaves de API
3. Copia la **llave pública** (`pub_test_...` para pruebas, `pub_prod_...` para producción)
4. Agrégala al `.env.local` como `VITE_WOMPI_PUBLIC_KEY`

## 📁 Estructura

```
src/
├── app/
│   ├── components/
│   │   ├── ui/          # Button, Card, Badge, Input, ThemeToggle
│   │   ├── layout/      # Navbar, Footer
│   │   ├── marketplace/ # ProductCard
│   │   └── shared/      # ReviewSection, ErrorBoundary
│   ├── pages/           # 23 páginas completas
│   ├── stores/          # authStore, cartStore (Zustand)
│   ├── hooks/           # useSupabase (todos los hooks de datos)
│   ├── lib/             # supabase.ts, utils.ts, mockData.ts
│   └── types/           # TypeScript types
└── styles/
    ├── theme.css        # CSS variables + dark mode
    └── index.css        # Entry point
```

## 👥 Equipo

| Nombre | Rol | GitHub |
|---|---|---|
| Nelson Garzón | Tech Lead & Full Stack | [@Dev-Sot](https://github.com/Dev-Sot) |
| Misael Gallo | Frontend & UI/UX | [@Milan32555](https://github.com/Milan32555) |
| Alejandro Marín | Backend & DevOps | [@AlejoM09](https://github.com/AlejoM09) |

**Universidad de Ibagué · Ingeniería de Sistemas · 2026**  
📧 sotelo.dev1@gmail.com · 📞 +57 320 818 4980
