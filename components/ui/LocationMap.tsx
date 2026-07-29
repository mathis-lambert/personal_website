"use client";

import { MapPin } from "lucide-react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";

import { useTheme } from "@/components/theme-provider";
import { buildMapStyle } from "@/lib/ui/mapStyle";

const MARSEILLE: [number, number] = [5.3698, 43.2965];

/**
 * The frame is a bounding box, not a centre and a zoom.
 *
 * A fixed centre only frames correctly at one aspect ratio. The card is wide on
 * a desktop and narrow on a phone, and at the same zoom the narrow one cropped
 * the south-east away — taking Marseille, the only thing the map is for, off
 * screen. Fitting a box makes the framing a consequence of the container
 * instead: whatever its shape, everything in the box stays visible.
 *
 * The box is mainland France, stretched south and east so the pin sits inside
 * the frame rather than against its corner.
 */
const FRAME: [[number, number], [number, number]] = [
  [-6.1, 40.4],
  [11.3, 51.4],
];

/**
 * Lazily mounted map, styled from the site palette in both themes.
 *
 * The style is rebuilt and swapped when the theme changes, rather than dimming a
 * light map with a CSS filter — that approach left labels grey-on-grey and the
 * tiles muddy. Swapping the style keeps the camera, so the view does not jump.
 */
export function LocationMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const resizeRef = useRef<ResizeObserver | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  const { resolvedTheme } = useTheme();
  const mode = resolvedTheme === "dark" ? "dark" : "light";

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    const initialise = async () => {
      if (cancelled || mapRef.current) return;

      try {
        const maplibregl = (await import("maplibre-gl")).default;
        if (cancelled) return;

        const map = new maplibregl.Map({
          container,
          style: buildMapStyle(mode),
          bounds: FRAME,
          fitBoundsOptions: { padding: 16, animate: false },
          attributionControl: false,
          // Every interaction off: this is a static illustration, and a map you
          // can drag but not zoom is worse than one you cannot touch at all.
          interactive: false,
        });

        mapRef.current = map;
        map.addControl(
          new maplibregl.AttributionControl({
            compact: true,
            customAttribution:
              '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OSM</a>',
          }),
          "bottom-right",
        );

        // It renders expanded and collapses on the first pan or zoom, neither
        // of which can happen on a non-interactive map.
        container
          .querySelector(".maplibregl-ctrl-attrib")
          ?.classList.remove("maplibregl-compact-show");

        const pin = document.createElement("div");
        pin.className = "map-pin";
        pin.innerHTML =
          '<span class="map-pin-halo"></span><span class="map-pin-core"></span>';

        new maplibregl.Marker({ element: pin, anchor: "center" })
          .setLngLat(MARSEILLE)
          .addTo(map);

        map.once("load", () => {
          if (!cancelled) setStatus("ready");
        });

        // Re-fit on resize. MapLibre does not reflow on its own, and without
        // this a phone rotated to landscape keeps the portrait framing.
        const observer = new ResizeObserver(() => {
          map.resize();
          map.fitBounds(FRAME, { padding: 16, animate: false });
        });
        observer.observe(container);
        resizeRef.current = observer;
      } catch {
        if (!cancelled) setStatus("unavailable");
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          observer.disconnect();
          void initialise();
        }
      },
      { rootMargin: "320px" },
    );

    observer.observe(container);

    return () => {
      cancelled = true;
      observer.disconnect();
      resizeRef.current?.disconnect();
      resizeRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // `mode` is read on first paint only; theme changes are handled below so a
    // toggle never tears down and refetches the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(buildMapStyle(mode));
  }, [mode]);

  return (
    <div className="map-frame absolute inset-0 bg-paper-sink">
      <div
        ref={containerRef}
        className="absolute inset-0"
        role="img"
        aria-label="Map centred on Marseille, France"
      />

      {status !== "ready" ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-paper-sink">
          <div className="flex flex-col items-center gap-2.5 text-ink-faint">
            <MapPin className="size-5" />
            <span className="t-eyebrow">
              {status === "unavailable" ? "Map unavailable" : "Loading map"}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
