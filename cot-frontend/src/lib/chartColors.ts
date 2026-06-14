/**
 * Brand chart palette, read live from the @gem/design CSS variables so charts
 * follow the active light/dark theme. The preset defines --chart-1…12 plus the
 * semantic tokens (--card, --border, --foreground, …) for both themes.
 */

/** Read a CSS custom property off <html>. */
export function cssVar(name: string, fallback = ''): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/** One of the 12 brand chart-series colors (--chart-1 … --chart-12). */
export function chartColor(n: number): string {
  return cssVar(`--chart-${n}`);
}

/** Apply an alpha channel to a CSS color, handling the hsl()/hex forms the tokens use. */
export function withAlpha(color: string, alpha: number): string {
  const c = color.trim();
  if (c.startsWith('hsl(')) {
    // hsl(145, 85%, 50%) -> hsla(145, 85%, 50%, 0.7)
    return c.replace(/^hsl\(/, 'hsla(').replace(/\)$/, `, ${alpha})`);
  }
  if (c.startsWith('#')) {
    const hex = c.slice(1);
    const full = hex.length === 3 ? hex.split('').map((x) => x + x).join('') : hex;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return c;
}
