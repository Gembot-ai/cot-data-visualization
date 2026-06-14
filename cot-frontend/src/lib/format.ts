/**
 * Shared formatting helpers — one place for number / percent / date / price
 * formatting so the UI is consistent and we avoid scattered toLocaleString()
 * calls and string concatenation.
 */

/** Thousands-separated integer/number, e.g. 1234567 -> "1,234,567". */
export function formatNumber(value: number | string, options?: Intl.NumberFormatOptions): string {
  return Number(value).toLocaleString('en-US', options);
}

/** Signed number with an explicit leading "+", e.g. 42 -> "+42", -42 -> "-42". */
export function formatSigned(value: number | string): string {
  const n = Number(value);
  return `${n >= 0 ? '+' : ''}${formatNumber(n)}`;
}

/** Percentage with fixed decimals, e.g. 12.345 -> "12.3%". */
export function formatPercent(value: number, fractionDigits = 1): string {
  return `${value.toFixed(fractionDigits)}%`;
}

/** Price with two decimals, e.g. 243.4 -> "243.40". */
export function formatPrice(value: number): string {
  return formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Locale date, defaulting to "Jun 2, 2026". */
export function formatDate(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
): string {
  return new Date(value).toLocaleDateString('en-US', options);
}

/** Compact axis tick, e.g. 1_500_000 -> "1.5M", 15_000 -> "15K". */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  return `${(value / 1000).toFixed(0)}K`;
}
