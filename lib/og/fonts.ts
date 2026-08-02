import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Static TrueType of the two faces `globals.css` loads as variable woff2, which
 * Satori can read neither of. Under `public/` because the Dockerfile already
 * copies that directory into the runtime image; nothing requests them over HTTP.
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
