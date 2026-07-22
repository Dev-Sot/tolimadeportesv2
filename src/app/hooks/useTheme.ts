import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  // Claro es el modo principal de la marca: se ignora la preferencia del
  // sistema operativo en la primera visita y solo se respeta lo que el
  // usuario elija manualmente (guardado en localStorage).
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as Theme;
      if (saved) return saved;
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return { theme, setTheme, toggleTheme };
}
