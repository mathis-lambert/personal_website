import type { CSSProperties } from "react";

/**
 * The site's background: three blobs of ink on CSS keyframes, drifting under
 * every page.
 *
 * Two rules keep it from becoming a stain. It is `fixed` to the viewport, never
 * anchored in the page container, which is narrower than the window and so puts
 * a visible rectangle edge in frame. And it runs near a tenth opacity, weighted
 * toward the corners, because text lives in the middle.
 */
const blobs: CSSProperties[] = [
  {
    top: "-16%",
    right: "-8%",
    width: "46vw",
    height: "46vw",
    background: "var(--ink-coral)",
    "--blob-opacity": 0.11,
    "--blob-duration": "68s",
    "--blob-x": "4vw",
    "--blob-y": "4vh",
    "--blob-scale": 1.14,
  } as CSSProperties,
  {
    top: "34%",
    left: "-16%",
    width: "42vw",
    height: "42vw",
    background: "var(--ink-turquoise)",
    "--blob-opacity": 0.1,
    "--blob-duration": "84s",
    "--blob-delay": "-22s",
    "--blob-x": "3vw",
    "--blob-y": "-5vh",
    "--blob-scale": 1.18,
  } as CSSProperties,
  {
    bottom: "-24%",
    right: "16%",
    width: "40vw",
    height: "40vw",
    background: "var(--ink-saffron)",
    "--blob-opacity": 0.12,
    "--blob-duration": "76s",
    "--blob-delay": "-46s",
    "--blob-x": "-3vw",
    "--blob-y": "-4vh",
    "--blob-scale": 1.12,
  } as CSSProperties,
];

export function AmbientField() {
  return (
    <div className="ambient" aria-hidden="true">
      {blobs.map((style, index) => (
        <span key={index} className="ambient-blob" style={style} />
      ))}
    </div>
  );
}
