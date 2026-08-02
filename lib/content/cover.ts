/**
 * Geometry and palette for the generated cover, shared by the browser and by
 * Satori. Plain data and arithmetic only — no JSX, no React, no Node builtins.
 */

export type CoverKind = "project" | "note";

/** The `globals.css` palette, converted once: Satori resolves neither `oklch()` nor `var()`. */
export const COVER_PALETTE = {
  paper: "#f8f7f5",
  ink: "#14171d",
  inkMuted: "#54575d",
  inkFaint: "#82858a",
  azure: "#006dcb",
  coral: "#d8334c",
} as const;

export const coverInk = (kind: CoverKind): string =>
  kind === "note" ? COVER_PALETTE.azure : COVER_PALETTE.coral;

/** FNV-1a, 32-bit. */
export const coverSeed = (value: string): number => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
};

/** Mulberry32, so a slug always draws the same rose. */
const randomFrom = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const ROSE_SPOKES = 32;

/**
 * Spoke lengths, each 0..1. A seal, not a chart: it plots nothing, it just
 * makes two coverless posts distinguishable at thumbnail size. Narrow gaussian
 * lobes rather than noise — wide ones overlap into the same sunburst every time.
 */
export const windRose = (seed: number): number[] => {
  const random = randomFrom(seed);
  const lobes = Array.from({ length: 3 + Math.floor(random() * 2) }, () => ({
    bearing: random() * Math.PI * 2,
    spread: 0.26 + random() * 0.4,
    weight: 0.4 + random() * 0.6,
  }));

  const raw = Array.from({ length: ROSE_SPOKES }, (_, index) => {
    const angle = (index / ROSE_SPOKES) * Math.PI * 2;
    const lobed = lobes.reduce((total, lobe) => {
      // Shortest way round the circle, so a lobe at 350° still lifts 10°.
      let delta = Math.abs(angle - lobe.bearing) % (Math.PI * 2);
      if (delta > Math.PI) delta = Math.PI * 2 - delta;
      return total + lobe.weight * Math.exp(-(delta * delta) / (2 * lobe.spread * lobe.spread));
    }, 0);
    return lobed + random() * 0.06;
  });

  const peak = Math.max(...raw);
  // Shortest spoke stays about a third of the longest, or the quiet bearings
  // shrink to beads round the hub and the dial reads as broken.
  return raw.map((value) => 0.34 + 0.66 * (value / peak));
};

/**
 * Clamped in JS rather than with `line-clamp`, whose Satori support is partial:
 * this is the only way the card and the share image break in the same place.
 */
export const clampText = (value: string, limit: number): string => {
  const text = value.trim();
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
};
