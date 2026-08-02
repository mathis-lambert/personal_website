import {
  COVER_PALETTE,
  ROSE_SPOKES,
  clampText,
  coverInk,
  coverSeed,
  windRose,
  type CoverKind,
} from "@/lib/content/cover";

/**
 * The cover a project or note gets when there is no photograph.
 *
 * Rendered twice from this one tree: by React for cards, detail pages and the
 * admin preview, and by Satori for the 1200×630 share image. Satori reads
 * neither Tailwind classes nor `var()`, so everything here is inline styles in
 * a flexbox subset. Geometry is written once in the 1200×630 space below.
 */

const DESIGN_WIDTH = 1200;
const DESIGN_HEIGHT = 630;

const GEOMETRY = {
  full: {
    pad: 64,
    label: 21,
    dot: 13,
    title: 76,
    titleLimit: 74,
    titleWidth: 716,
    rail: 19,
    facts: 3,
    rose: 320,
  },
  /** Same drawing, type set larger against it: a faithful reduction of 19px mono is unreadable. */
  compact: {
    pad: 76,
    label: 38,
    dot: 22,
    title: 96,
    titleLimit: 34,
    titleWidth: 700,
    rail: 34,
    facts: 2,
    rose: 268,
  },
} as const;

const RULE = "rgba(20, 23, 29, 0.16)";
const GUIDE = "rgba(20, 23, 29, 0.10)";

const DISPLAY_FACE = '"Bricolage Grotesque", sans-serif';
const MONO_FACE = '"Martian Mono", monospace';

/**
 * Divs rather than an SVG. Each spoke is placed by its own centre and rotated
 * about it, the default origin — Satori's `transform-origin` support is partial.
 */
function WindRose({
  seed,
  ink,
  size,
  u,
}: {
  seed: number;
  ink: string;
  size: number;
  u: (n: number) => string | number;
}) {
  const spokes = windRose(seed);
  const centre = size / 2;
  const hub = size * 0.11;
  const reach = size * 0.39;
  const width = size * 0.024;

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexShrink: 0,
        width: u(size),
        height: u(size),
      }}
    >
      {[0.5, 0.13].map((ring) => (
        <div
          key={ring}
          style={{
            position: "absolute",
            left: u(centre - size * ring),
            top: u(centre - size * ring),
            width: u(size * ring * 2),
            height: u(size * ring * 2),
            borderRadius: u(size * ring),
            borderWidth: u(size * 0.005),
            borderStyle: "solid",
            borderColor: GUIDE,
          }}
        />
      ))}

      {spokes.map((value, index) => {
        const turn = (index / ROSE_SPOKES) * Math.PI * 2;
        const length = reach * value;
        const distance = hub + length / 2;
        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: u(centre + distance * Math.sin(turn) - width / 2),
              top: u(centre - distance * Math.cos(turn) - length / 2),
              width: u(width),
              height: u(length),
              borderRadius: u(width / 2),
              backgroundColor: ink,
              opacity: 0.26 + 0.64 * value,
              transform: `rotate(${((index / ROSE_SPOKES) * 360).toFixed(2)}deg)`,
            }}
          />
        );
      })}

      <div
        style={{
          position: "absolute",
          left: u(centre - size * 0.028),
          top: u(centre - size * 0.028),
          width: u(size * 0.056),
          height: u(size * 0.056),
          borderRadius: u(size * 0.028),
          backgroundColor: ink,
        }}
      />
    </div>
  );
}

/** Date first, then classification. Uppercased here so Satori measures what it draws. */
function coverFactsFor(details: string[], date: string | undefined, limit: number): string[] {
  const seen = new Set<string>();
  const facts: string[] = [];
  for (const value of [date, ...details]) {
    const fact = typeof value === "string" ? value.trim().toLocaleUpperCase() : "";
    if (!fact || seen.has(fact)) continue;
    seen.add(fact);
    facts.push(fact);
    if (facts.length === limit) break;
  }
  return facts;
}


export function EditorialCover({
  kind,
  title,
  date,
  details = [],
  seed,
  compact = false,
  fixed = false,
}: {
  kind: CoverKind;
  title: string;
  /** Already formatted by `formatDate` — this component does no date policy. */
  date?: string;
  /** Technologies for a project, tags for a note. */
  details?: string[];
  /** The slug, so the rose survives a title edit. */
  seed?: string;
  compact?: boolean;
  /** Literal pixels instead of container query units. Set only by the share image. */
  fixed?: boolean;
}) {
  const g = compact ? GEOMETRY.compact : GEOMETRY.full;
  // Scale by whichever axis is tighter, like `object-fit: contain`. Cards are a
  // fixed height in a column of variable width, so sizing off width alone makes
  // a wide card's type overrun the height and lose its last line.
  const u = fixed
    ? (n: number) => n
    : (n: number) =>
        `calc(${n} * min(${(100 / DESIGN_WIDTH).toFixed(5)}cqw, ${(100 / DESIGN_HEIGHT).toFixed(5)}cqh))`;

  const ink = coverInk(kind);
  const heading = clampText(title || "Untitled", g.titleLimit);
  const facts = coverFactsFor(details, date, g.facts);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        backgroundColor: COVER_PALETTE.paper,
        // `size`, not `inline-size`: the scale above queries both axes.
        ...(fixed ? null : { containerType: "size" }),
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: u(g.pad),
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: u(g.dot),
              height: u(g.dot),
              borderRadius: u(g.dot / 2),
              backgroundColor: ink,
              marginRight: u(g.label * 0.62),
            }}
          />
          <div
            style={{
              fontFamily: MONO_FACE,
              fontWeight: 700,
              fontSize: u(g.label),
              letterSpacing: u(g.label * 0.14),
              color: COVER_PALETTE.ink,
            }}
          >
            {kind === "note" ? "NOTE" : "PROJECT"}
          </div>
        </div>

        {/* Title and dial share a row, so neither can run into the other. */}
        <div
          style={{
            display: "flex",
            flexGrow: 1,
            // Clip rather than grow: an over-long title loses its last line
            // instead of pushing the rail off the frame.
            minHeight: 0,
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: u(g.pad * 0.35),
            paddingBottom: u(g.pad * 0.45),
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: DISPLAY_FACE,
              fontWeight: 600,
              fontSize: u(g.title),
              lineHeight: 0.97,
              letterSpacing: u(g.title * -0.032),
              color: COVER_PALETTE.ink,
              width: u(g.titleWidth),
            }}
          >
            {heading}
          </div>

          <WindRose seed={coverSeed(seed || title)} ink={ink} size={g.rose} u={u} />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ width: "100%", height: u(2), backgroundColor: RULE }} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: u(g.rail * 0.9),
              fontFamily: MONO_FACE,
              fontSize: u(g.rail),
              letterSpacing: u(g.rail * 0.1),
            }}
          >
            <div style={{ display: "flex", fontWeight: 500, color: COVER_PALETTE.inkMuted }}>
              {facts.join("   ·   ")}
            </div>
            <div style={{ display: "flex", fontWeight: 700, color: COVER_PALETTE.inkFaint }}>
              MATHIS LAMBERT
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}