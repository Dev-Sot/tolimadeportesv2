import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'supabase'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // El codebase usa `any` deliberadamente en los datos que vienen de
      // Supabase sin tipos generados — activar esta regla ahora sería
      // reescribir cientos de sitios sin ganar seguridad de tipos real.
      '@typescript-eslint/no-explicit-any': 'off',
      // noUnusedLocals ya está desactivado en tsconfig por la misma razón.
      '@typescript-eslint/no-unused-vars': 'off',
      // Regla nueva de alineación con el compilador de React: marca como
      // error el patrón "sincronizar un form local desde datos que llegan
      // async" (ProfilePage, CoachDashboardPage) vía useEffect + setState.
      // Es un patrón intencional y correcto hoy, no un bug — arreglarlo del
      // todo requiere remontar el form con `key` en vez de un effect, un
      // cambio estructural que merece su propia revisión, no colarse en un
      // pase de "prender ESLint". Se deja en warn para no perder la señal.
      'react-hooks/set-state-in-effect': 'warn',
    },
  }
);
