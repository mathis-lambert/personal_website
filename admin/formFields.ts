/**
 * Reading a submitted admin form.
 *
 * Replaces seventy-odd hand-written `String(fd.get("title") || "")` reads and
 * two copies of a CSV splitter. Two screens used to trim on update but not on
 * create, so the same form produced different data depending on the button.
 * Everything is trimmed once, here.
 */
export const readForm = (form: HTMLFormElement) => {
  const data = new FormData(form);
  const raw = (key: string) => String(data.get(key) ?? "").trim();

  return {
    /** Required text. Empty string when the field is absent or blank. */
    text: raw,

    /**
     * Optional text: `undefined` when blank, so the key is omitted from the
     * payload rather than saved as an empty string.
     */
    optional: (key: string): string | undefined => raw(key) || undefined,

    /** Required text with a fallback for when the field is left blank. */
    textOr: (key: string, fallback: string) => raw(key) || fallback,

    /** Comma-separated list. Trimmed, with blanks dropped. */
    list: (key: string): string[] =>
      raw(key)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),

    /** Checkbox. Browsers submit "on" when ticked and nothing at all when not. */
    flag: (key: string) => data.get(key) === "on",
  };
};
