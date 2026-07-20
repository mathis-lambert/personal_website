"use client";

import type { Map as MapLibreMap } from "maplibre-gl";
import { MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const MARSEILLE: [number, number] = [5.3698, 43.2965];
const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export function LocationMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    const initialiseMap = async () => {
      if (cancelled || mapRef.current) return;

      try {
        const maplibregl = (await import("maplibre-gl")).default;
        if (cancelled) return;

        const map = new maplibregl.Map({
          container,
          style: MAP_STYLE,
          center: MARSEILLE,
          zoom: 10.8,
          pitch: 36,
          bearing: -12,
          attributionControl: false,
          scrollZoom: false,
          maxZoom: 16,
          minZoom: 7,
        });

        mapRef.current = map;
        map.addControl(
          new maplibregl.NavigationControl({
            showCompass: false,
            visualizePitch: false,
          }),
          "top-right",
        );
        map.addControl(
          new maplibregl.AttributionControl({ compact: true }),
          "bottom-right",
        );

        const markerElement = document.createElement("button");
        markerElement.type = "button";
        markerElement.className = "location-map-marker";
        markerElement.setAttribute("aria-label", "Mathis is based in Marseille");
        const markerCore = document.createElement("span");
        markerCore.className = "location-map-marker-core";
        const markerLabel = document.createElement("span");
        markerLabel.className = "location-map-marker-label";
        markerLabel.textContent = "ML";
        markerCore.append(markerLabel);
        markerElement.append(markerCore);

        const popup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: true,
          offset: 22,
          className: "location-map-popup",
        }).setText("Based in Marseille");

        new maplibregl.Marker({ element: markerElement, anchor: "bottom" })
          .setLngLat(MARSEILLE)
          .setPopup(popup)
          .addTo(map);

        map.once("load", () => {
          if (!cancelled) setStatus("ready");
        });
      } catch {
        if (!cancelled) setStatus("unavailable");
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          observer.disconnect();
          void initialiseMap();
        }
      },
      { rootMargin: "320px" },
    );

    observer.observe(container);

    return () => {
      cancelled = true;
      observer.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="location-map relative h-full w-full overflow-hidden bg-[#cfe0df]">
      <div
        ref={containerRef}
        className="absolute inset-0"
        role="region"
        aria-label="Interactive map centered on Marseille, France"
      />

      {status !== "ready" && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_42%_38%,rgba(255,255,255,0.85),rgba(197,219,219,0.88))]">
          <div className="flex flex-col items-center gap-2 text-[#14373c]">
            <span className="grid size-11 place-items-center rounded-full bg-[#ef6c4d] text-white shadow-lg">
              <MapPin className="size-5" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.16em]">
              {status === "unavailable" ? "Map unavailable" : "Loading map"}
            </span>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-3 left-3 z-10 max-w-[72%] rounded-2xl border border-white/70 bg-[#fffaf0]/92 px-4 py-3 text-[#14373c] shadow-lg backdrop-blur-md">
        <p className="font-display text-xl font-semibold leading-none">
          Marseille
        </p>
        <p className="mt-1 text-[9px] font-black uppercase tracking-[0.13em] text-[#49646a]">
          South of France · drag to explore
        </p>
      </div>
    </div>
  );
}
