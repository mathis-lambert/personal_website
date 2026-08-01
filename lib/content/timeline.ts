/**
 * Turning "Sept. 2024 - Present" into a bar on a shared axis.
 *
 * Dates are free-form strings typed into the admin, so every step here can fail
 * and says so rather than guessing. A group renders bars only when all of its
 * entries parse: a shared axis drawn from half the data is a chart that lies.
 */

const MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

const ONGOING = /^(present|current|now|today|ongoing)$/;

/** Months since year zero, so a span is plain subtraction. */
function toMonths(token: string, nowMonths: number): number | null {
  const text = token.trim().toLowerCase().replace(/\./g, "");
  if (!text) return null;
  if (ONGOING.test(text)) return nowMonths;

  const parts = text.match(/^([a-z]+)\s+(\d{4})$/);
  if (!parts) {
    const year = text.match(/^(\d{4})$/);
    return year ? Number(year[1]) * 12 : null;
  }

  // "Sept" and "Sep" both truncate to the same key.
  const month = MONTHS.indexOf(parts[1]!.slice(0, 3));
  return month < 0 ? null : Number(parts[2]) * 12 + month;
}

type TimelineBar = {
  /** Percent of the group's axis. */
  left: number;
  width: number;
  ongoing: boolean;
};

export type Timeline = {
  bars: TimelineBar[];
  /** The calendar years the axis runs between, for its scale. */
  from: number;
  to: number;
};

/** Below this a two-month stint would round away to nothing. */
const MIN_WIDTH = 6;

export function toTimeline(dates: string[], now = new Date()): Timeline | null {
  if (dates.length === 0) return null;
  const nowMonths = now.getFullYear() * 12 + now.getMonth();

  const spans = dates.map((date) => {
    const halves = date.split(/\s*[-–—]\s*/);
    if (halves.length !== 2) return null;
    const start = toMonths(halves[0]!, nowMonths);
    const end = toMonths(halves[1]!, nowMonths);
    if (start === null || end === null || end < start) return null;
    return {
      start,
      end,
      ongoing: ONGOING.test(halves[1]!.trim().toLowerCase()),
    };
  });

  if (spans.some((span) => span === null)) return null;
  const found = spans as NonNullable<(typeof spans)[number]>[];

  const first = Math.min(...found.map((span) => span.start));
  const last = Math.max(...found.map((span) => span.end));
  const axis = last - first;
  if (axis <= 0) return null;

  return {
    from: Math.floor(first / 12),
    to: Math.floor(last / 12),
    bars: found.map((span) => {
      const width = Math.max(MIN_WIDTH, ((span.end - span.start) / axis) * 100);
      const left = Math.min(100 - width, ((span.start - first) / axis) * 100);
      return { left, width, ongoing: span.ongoing };
    }),
  };
}
