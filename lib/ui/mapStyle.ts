import type { StyleSpecification } from "maplibre-gl";

/**
 * A hand-written MapLibre style in the site palette.
 *
 * The previous version loaded OpenFreeMap's off-the-shelf "liberty" style and
 * pushed a CSS `filter: saturate() brightness()` over the canvas for dark mode.
 * That is not a dark map: it dims a light one, so labels go grey-on-grey and the
 * whole tile turns muddy. Styling the vector layers directly gives a real day
 * and night pair, drawn from the same tokens as the rest of the page.
 *
 * Tiles are OpenMapTiles schema, served free by OpenFreeMap (no key needed).
 */

type Palette = {
  ground: string;
  water: string;
  green: string;
  road: string;
  roadMinor: string;
  building: string;
  label: string;
  labelHalo: string;
};

const day: Palette = {
  ground: "#f0eeea",
  water: "#c3d9ea",
  green: "#dfe6d8",
  road: "#ffffff",
  roadMinor: "#f7f6f3",
  building: "#e4e1db",
  label: "#4a4a52",
  labelHalo: "#ffffff",
};

const night: Palette = {
  ground: "#191a1d",
  water: "#12232f",
  green: "#1c211c",
  road: "#2b2d31",
  roadMinor: "#232529",
  building: "#212327",
  label: "#9ea2ab",
  labelHalo: "#0f1012",
};

export function buildMapStyle(mode: "light" | "dark"): StyleSpecification {
  const c = mode === "dark" ? night : day;

  return {
    version: 8,
    // Glyphs are required for any text layer; OpenFreeMap serves them.
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    sources: {
      openmaptiles: {
        type: "vector",
        url: "https://tiles.openfreemap.org/planet",
      },
    },
    layers: [
      {
        id: "background",
        type: "background",
        paint: { "background-color": c.ground },
      },
      {
        id: "green",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "landcover",
        filter: ["in", "class", "wood", "grass", "scrub", "farmland"],
        paint: { "fill-color": c.green, "fill-opacity": 0.7 },
      },
      {
        id: "park",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "park",
        paint: { "fill-color": c.green, "fill-opacity": 0.6 },
      },
      {
        id: "water",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "water",
        filter: ["!=", "brunnel", "tunnel"],
        paint: { "fill-color": c.water },
      },
      {
        id: "building",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "building",
        minzoom: 13,
        paint: { "fill-color": c.building, "fill-opacity": 0.9 },
      },
      {
        id: "road-minor",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        filter: ["in", "class", "minor", "service", "track", "path"],
        minzoom: 12,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": c.roadMinor,
          "line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.5, 18, 6],
        },
      },
      {
        id: "road",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        filter: ["in", "class", "primary", "secondary", "tertiary", "trunk"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": c.road,
          "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.6, 18, 10],
        },
      },
      {
        id: "motorway",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        filter: ["==", "class", "motorway"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": c.road,
          "line-width": ["interpolate", ["linear"], ["zoom"], 6, 0.8, 18, 14],
        },
      },
      {
        id: "place-city",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "place",
        filter: ["in", "class", "city", "town"],
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 6, 10, 12, 14],
          "text-max-width": 8,
        },
        paint: {
          "text-color": c.label,
          "text-halo-color": c.labelHalo,
          "text-halo-width": 1.4,
        },
      },
      {
        id: "place-suburb",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "place",
        filter: ["in", "class", "suburb", "neighbourhood", "village"],
        minzoom: 11,
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 11,
          "text-max-width": 8,
        },
        paint: {
          "text-color": c.label,
          "text-halo-color": c.labelHalo,
          "text-halo-width": 1.2,
          "text-opacity": 0.85,
        },
      },
    ],
  } satisfies StyleSpecification;
}
