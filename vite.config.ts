import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Don't fail on TypeScript errors during build
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress certain warnings that don't affect functionality
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        warn(warning);
      },
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['motion', 'lucide-react', 'sonner'],
          'data-vendor': ['zustand', '@tanstack/react-query', '@supabase/supabase-js'],
          'chart-vendor': ['recharts'],
        }
      }
    }
  },
  esbuild: {
    // esbuild handles TS transpilation — ignores type errors
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})
