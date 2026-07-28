/**
 * Sorting and filtering shared by the project list and the note list.
 *
 * One option list, so the label on the alphabetical sort cannot drift between
 * the two pages and the select's own fallback again.
 */

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "a-z", label: "A → Z" },
  { value: "z-a", label: "Z → A" },
  { value: "featured", label: "Featured first" },
] as const;

export type SortOrder = (typeof SORT_OPTIONS)[number]["value"];

/** The least a document needs to be sortable by every order above. */
export type Sortable = {
  title: string;
  date: string;
  isFeatured?: boolean;
};

/**
 * Epoch for anything missing or unparseable, so undated documents land at the
 * end of a newest-first list every time. Comparing `NaN` instead leaves the
 * order up to the engine's sort implementation.
 */
const timeOf = (value?: string): number => {
  const time = new Date(value ?? "").getTime();
  return Number.isNaN(time) ? 0 : time;
};

export const byNewest = (a: { date?: string }, b: { date?: string }): number =>
  timeOf(b.date) - timeOf(a.date);

export const sortContent = <T extends Sortable>(
  items: T[],
  order: SortOrder,
): T[] =>
  [...items].sort((a, b) => {
    switch (order) {
      case "oldest":
        return -byNewest(a, b);
      case "a-z":
        return a.title.localeCompare(b.title);
      case "z-a":
        return b.title.localeCompare(a.title);
      case "featured":
        return Number(b.isFeatured) - Number(a.isFeatured) || byNewest(a, b);
      default:
        return byNewest(a, b);
    }
  });

/** Distinct values, alphabetical: every filter facet on both list pages. */
export const uniqueSorted = (values: string[]): string[] =>
  Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));

/**
 * Case-insensitive substring match across a document's searchable fields.
 *
 * An empty needle matches everything, so callers can pass the query straight
 * through instead of guarding the search themselves.
 */
export const matchesQuery = (
  fields: (string | undefined | null)[],
  needle: string,
): boolean =>
  !needle ||
  fields.some((field) => field && field.toLowerCase().includes(needle));
