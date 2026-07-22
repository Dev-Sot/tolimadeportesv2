# Contribuir a Canchazo

## Antes de empezar

```bash
npm install
cp .env.example .env.local   # completa con tu propia instancia de Supabase
npm run dev
```

## Flujo de trabajo

1. Crea una rama descriptiva: `fix/checkout-total`, `feat/tournament-brackets`
2. Antes de abrir un PR, corre localmente:
   ```bash
   npm run typecheck
   npm run test
   npm run build
   ```
3. Describe en el PR **qué** cambia y **por qué** — no solo el diff

## Convenciones

- TypeScript estricto: evita `any` salvo que sea estrictamente necesario
- Componentes de UI viven en `src/app/components/ui`; lógica de datos, en `src/app/hooks`
- Los hooks de Supabase (`useSupabase.ts`) siguen el patrón: `throw` en mutations,
  `return []` / `return null` en queries fallidas
- No commitees credenciales reales — `.env.local` está en `.gitignore` por una razón

## Reportar bugs

Abre un issue con: pasos para reproducir, comportamiento esperado vs. real, y
capturas si aplica. Para vulnerabilidades de seguridad, sigue [SECURITY.md](./SECURITY.md)
en lugar de abrir un issue público.
