/**
 * Turning values into display strings.
 *
 * The locale, the UTC pin and the set of date shapes are policy. Kept here so a
 * card and the page it links to cannot format the same date differently.
 */

const DATE_STYLES = {
  /** Card meta rows: 12 Mar 2025 */
  short: { day: "numeric", month: "short", year: "numeric" },
  /** Detail page headers, where there is room: 12 March 2025 */
  long: { day: "numeric", month: "long", year: "numeric" },
  /** Project cards, where the exact day is noise: Mar 2025 */
  monthYear: { month: "short", year: "numeric" },
} satisfies Record<string, Intl.DateTimeFormatOptions>;

export type DateStyle = keyof typeof DATE_STYLES;

/**
 * `timeZone: "UTC"` in every style, deliberately.
 *
 * Content dates are stored as plain days with a midnight timestamp. Rendering
 * one in the reader's own zone moves a note published on the 1st back to the
 * 31st for everybody west of Greenwich.
 */
export const formatDate = (
  value: string | Date | undefined,
  style: DateStyle = "short",
): string => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    ...DATE_STYLES[style],
    timeZone: "UTC",
  });
};

/**
 * Admin tables: `2026-07-27 19:14:03`.
 *
 * Sortable as text, unambiguous across zones, and deliberately not localised:
 * these are log timestamps being read by one person who wants to correlate them
 * with a server, not a date being read by a visitor.
 */
export const formatTimestamp = (value?: string | Date): string => {
  if (!value) return "n/a";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "n/a";
  return date.toISOString().replace("T", " ").slice(0, 19);
};

/** A rate stored as 0..1, shown as a percentage: 0.0243 becomes "2.4%". */
export const formatPercent = (value: number): string =>
  `${(value * 100).toFixed(1)}%`;

/** Latency in milliseconds, rounded: "184 ms". */
export const formatDurationMs = (value: number): string =>
  `${Math.round(value)} ms`;
