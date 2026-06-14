import { useEffect, useState } from 'react';

/**
 * Light/dark theme handling for the @gem/design system (darkMode: 'class').
 * The `dark` class lives on <html>; an inline script in index.html applies the
 * persisted/preferred theme before paint to avoid a flash of the wrong theme.
 */
export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'cot-theme';

export function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  // Default to light; users opt into dark via the toggle (persisted).
  return 'light';
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  // Keep the mobile browser chrome (address/status bar) in sync with the theme.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#1a1a1a' : '#ffffff');
}

/** Stateful theme controller — owns the toggle and persists the choice. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return { theme, setTheme, toggleTheme };
}

/**
 * Read-only subscriber to the current theme. Used by surfaces (e.g. the chart)
 * that must re-read CSS variables when the theme changes but don't own the toggle.
 */
export function useThemeObserver(): Theme {
  const [theme, setTheme] = useState<Theme>(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light'
  );

  useEffect(() => {
    const read = () =>
      setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return theme;
}
