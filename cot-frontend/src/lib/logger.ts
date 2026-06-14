/**
 * Lightweight client logger — a single place to route/gate console output so we
 * don't scatter raw `console.*` calls across the app. Quiet in production builds.
 */
const isDev = import.meta.env.DEV;

export const logger = {
  error: (...args: unknown[]): void => { if (isDev) console.error(...args); },
  warn: (...args: unknown[]): void => { if (isDev) console.warn(...args); },
  info: (...args: unknown[]): void => { if (isDev) console.info(...args); },
};
