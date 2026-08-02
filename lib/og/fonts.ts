import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Static TrueType instances of the two faces `globals.css` loads as variable
 * woff2 — Satori can read neither woff2 nor a variable axis. Same family names,
 * so `EditorialCover` names one font stack and both renderers resolve it.
 *
 * They sit under `public/` because the Dockerfile copies that directory into
 * the runtime image wholesale; anywhere else and the standalone build would
 * have to be told to trace them. Nothing requests them over HTTP.
 */
const FACES = [
  { file: "bricolage-grotesque-latin-600-normal.ttf", name: "Bricolage Grotesque", weight: 600 },
  { file: "martian-mono-latin-500-normal.ttf", name: "Martian Mono", weight: 500 },
  { file: "martian-mono-latin-700-normal.ttf", name: "Martian Mono", weight: 700 },
] as const;

export type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 500 | 600 | 700;
  style: "normal";
};

let cached: Promise<OgFont[]> | undefined;

export function loadOgFonts(): Promise<OgFont[]> {
  cached ??= Promise.all(
    FACES.map(async (face) => {
      const data = await readFile(join(process.cwd(), "public", "fonts", face.file));
      return {
        name: face.name,
        data: data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer,
        weight: face.weight,
        style: "normal" as const,
      };
    }),
  );
  return cached;
}
