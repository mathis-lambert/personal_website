import type { CSSProperties } from "react";

export type TimelineData = {
  title: string;
  company: string;
  date: string;
  description: string;
};

export type ClassNames = {
  root?: string;
  gradientTop?: string;
  gradientBottom?: string;
  motionDiv?: string;
  itemContainer?: string;
  line?: string;
  item?: string;
  dotContainerWrapper?: string;
  dotWrapper?: string;
  dotOuter?: string;
  dotInner?: string;
  dotConnector?: string;
  contentWrapper?: string;
  title?: string;
  company?: string;
  date?: string;
  description?: string;
  scrollHintContainer?: string;
  scrollHint?: string;
  scrollHintIcon?: string;
};

export type ScrollableTimelineProps<T extends TimelineData = TimelineData> = {
  data: T[];
  keyMappings?: Partial<Record<keyof TimelineData, keyof T>>;
  mobileBreakpoint?: number;
  scrollSpeed?: number;
  wheelSensitivity?: number;
  accentColor?: string;
  showScrollHint?: boolean;
  showGradients?: boolean;
  classNames?: ClassNames;
};

const defaultClassNames: Required<ClassNames> = {
  root: "group relative h-full w-full overflow-hidden",
  gradientTop:
    "pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-card to-transparent",
  gradientBottom:
    "pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-card to-transparent",
  motionDiv:
    "no-scrollbar h-full w-full overflow-y-auto overscroll-contain scroll-smooth touch-pan-y",
  itemContainer: "relative flex flex-col py-12",
  line:
    "absolute bottom-8 left-6 top-8 w-px bg-[var(--accent-color)]/55",
  item: "group/item relative w-full py-2 pl-14 pr-4",
  dotContainerWrapper:
    "absolute left-6 top-1/2 -translate-x-1/2 -translate-y-1/2",
  dotWrapper: "relative size-3",
  dotOuter:
    "absolute inset-0 rounded-full bg-[var(--accent-color)] opacity-30 transition-transform duration-200 group-hover/item:scale-150",
  dotInner:
    "relative size-3 rounded-full bg-[var(--accent-color)] ring-2 ring-card",
  dotConnector:
    "absolute left-8 top-1/2 h-px w-6 bg-gradient-to-r from-[var(--accent-color)] to-transparent opacity-50",
  contentWrapper:
    "-ml-3 rounded-2xl border border-foreground/8 bg-card/80 p-4 text-left shadow-sm transition-colors duration-200 group-hover/item:border-[var(--accent-color)]/40",
  title: "text-base font-bold text-foreground",
  company: "text-sm font-semibold text-muted-foreground",
  date: "mt-1 text-xs text-muted-foreground/75",
  description:
    "mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground",
  scrollHintContainer:
    "pointer-events-none absolute bottom-3 right-3 z-20 rounded-full bg-card/90 px-2.5 py-1 shadow-sm",
  scrollHint: "flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground",
  scrollHintIcon: "size-3",
};

const DEFAULT_ACCENT_COLOR = "oklch(68.5% 0.169 237.323)";

export function ScrollableTimeline<T extends TimelineData = TimelineData>({
  data,
  keyMappings = {
    title: "title",
    company: "company",
    date: "date",
    description: "description",
  },
  accentColor = DEFAULT_ACCENT_COLOR,
  showScrollHint = true,
  showGradients = true,
  classNames = {},
}: ScrollableTimelineProps<T>) {
  const styles = { ...defaultClassNames, ...classNames };
  const mappedData = data.map((item) => ({
    title: String(item[keyMappings.title ?? "title"] ?? ""),
    company: String(item[keyMappings.company ?? "company"] ?? ""),
    date: String(item[keyMappings.date ?? "date"] ?? ""),
    description: String(item[keyMappings.description ?? "description"] ?? ""),
  }));

  return (
    <div
      className={styles.root}
      style={{ "--accent-color": accentColor } as CSSProperties}
    >
      {showGradients && (
        <>
          <div className={styles.gradientTop} />
          <div className={styles.gradientBottom} />
        </>
      )}

      <div className={styles.motionDiv}>
        <div className={styles.itemContainer}>
          <div className={styles.line} />
          {mappedData.map((entry, index) => (
            <article
              key={`${entry.title}-${entry.company}-${index}`}
              className={styles.item}
            >
              <div className={styles.dotContainerWrapper} aria-hidden="true">
                <div className={styles.dotWrapper}>
                  <div className={styles.dotOuter} />
                  <div className={styles.dotInner} />
                </div>
              </div>
              <div className={styles.dotConnector} aria-hidden="true" />
              <div className={styles.contentWrapper}>
                <h3 className={styles.title}>{entry.title}</h3>
                <p className={styles.company}>{entry.company}</p>
                <p className={styles.date}>{entry.date}</p>
                {entry.description && (
                  <p className={styles.description}>{entry.description}</p>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>

      {showScrollHint && mappedData.length > 1 && (
        <div className={styles.scrollHintContainer}>
          <div className={styles.scrollHint}>
            <svg
              className={styles.scrollHintIcon}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="m8 10 4 4 4-4"
              />
            </svg>
            <span>Scroll</span>
          </div>
        </div>
      )}
    </div>
  );
}
