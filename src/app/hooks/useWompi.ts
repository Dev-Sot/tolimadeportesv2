import { useEffect, useState } from 'react';

declare global {
  interface Window {
    WidgetCheckout: any;
  }
}

export const WOMPI_PUBLIC_KEY = import.meta.env.VITE_WOMPI_PUBLIC_KEY as string;

/** Carga el script del widget de Wompi una sola vez por sesión de navegador,
 *  sin importar cuántas páginas lo usen (checkout, upgrade a Pro, etc.). */
export function useWompiScript() {
  // Lazy initializer: si el script ya estaba cargado de una visita anterior
  // en la misma sesión, lo sabemos antes del primer render, sin necesidad de
  // un setState síncrono dentro del effect.
  const [ready, setReady] = useState(() => Boolean(window.WidgetCheckout));

  useEffect(() => {
    if (ready) return;

    const existing = document.getElementById('wompi-script') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => setReady(true), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = 'wompi-script';
    script.src = 'https://checkout.wompi.co/widget.js';
    script.setAttribute('data-render', 'false');
    script.onload = () => setReady(true);
    script.onerror = () => console.warn('Wompi script failed to load');
    document.head.appendChild(script);
  }, [ready]);

  return ready;
}
