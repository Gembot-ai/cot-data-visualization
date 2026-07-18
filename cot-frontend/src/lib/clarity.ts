/**
 * Microsoft Clarity — session recordings + heatmaps.
 *
 * No-op unless VITE_CLARITY_PROJECT_ID is set at build time. The project id is
 * not a secret (it ships in client JS on every page), but we read it from env so
 * it stays out of source and is easy to change per environment.
 *
 * The tag is injected here (bundled, served from our own origin) rather than as
 * an inline <script> so it complies with our CSP (script-src 'self' + clarity.ms).
 */
export function initClarity(projectId: string): void {
  if (typeof window === 'undefined' || !projectId) return;

  (function (c: any, l: Document, a: string, r: string, i: string) {
    c[a] = c[a] || function (...args: unknown[]) {
      (c[a].q = c[a].q || []).push(args);
    };
    const t = l.createElement(r) as HTMLScriptElement;
    t.async = true;
    t.src = 'https://www.clarity.ms/tag/' + i;
    const y = l.getElementsByTagName(r)[0];
    y.parentNode?.insertBefore(t, y);
  })(window, document, 'clarity', 'script', projectId);
}
