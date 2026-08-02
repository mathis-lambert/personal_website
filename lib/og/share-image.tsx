import "server-only";

import { ImageResponse } from "next/og";
import sharp from "sharp";

import { EditorialCover } from "@/components/content/EditorialCover";
import { COVER_PALETTE, clampText, coverInk, type CoverKind } from "@/lib/content/cover";
import { loadOgFonts } from "@/lib/og/fonts";

/**
 * The picture a shared link previews: the title over the cover photograph, or
 * the generated cover when there isn't one.
 */

export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 };
export const SHARE_IMAGE_CONTENT_TYPE = "image/png";

const { width, height } = SHARE_IMAGE_SIZE;

const RULE_ON_DARK = "rgba(255, 255, 255, 0.28)";

export type ShareImageInput = {
  kind: CoverKind;
  title: string;
  cover?: string;
  /** Already formatted for display. */
  date?: string;
  details?: string[];
  /** The slug, so the generated cover's rose survives a title edit. */
  seed?: string;
};

/**
 * Covers are stored as WebP, which Satori cannot decode — given a width and
 * height it draws nothing and leaves the overlay on an empty frame. Decode to
 * JPEG here, cropped to the frame. Undefined on any failure, so an unreachable
 * CDN costs the photograph rather than the whole preview.
 */
const loadPhoto = async (cover: string, base: string): Promise<string | undefined> => {
  try {
    const response = await fetch(new URL(cover, base), { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return undefined;
    const jpeg = await sharp(Buffer.from(await response.arrayBuffer()))
      .resize(width, height, { fit: "cover" })
      .jpeg({ quality: 82 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return undefined;
  }
};

export async function renderShareImage(
  { kind, title, cover, date, details = [], seed }: ShareImageInput,
  baseUrl: string,
): Promise<ImageResponse> {
  const [fonts, photo] = await Promise.all([
    loadOgFonts(),
    cover ? loadPhoto(cover, baseUrl) : undefined,
  ]);

  return new ImageResponse(
    photo ? (
      <PhotoShareCard
        kind={kind}
        title={title}
        photo={photo}
        date={date}
        details={details}
      />
    ) : (
      <EditorialCover
        fixed
        kind={kind}
        title={title}
        date={date}
        details={details}
        seed={seed}
      />
    ),
    { ...SHARE_IMAGE_SIZE, fonts },
  );
}

function PhotoShareCard({
  kind,
  title,
  photo,
  date,
  details,
}: {
  kind: CoverKind;
  title: string;
  photo: string;
  date?: string;
  details: string[];
}) {
  const ink = coverInk(kind);
  const heading = clampText(title || "Untitled", 84);
  const facts = [date, ...details]
    .map((value) => (typeof value === "string" ? value.trim().toLocaleUpperCase() : ""))
    .filter((value, index, all) => value && all.indexOf(value) === index)
    .slice(0, 3);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width,
        height,
        backgroundColor: COVER_PALETTE.ink,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- no next/image inside ImageResponse */}
      <img src={photo} alt="" width={width} height={height} style={{ objectFit: "cover" }} />

      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          display: "flex",
          width,
          height: 380,
          backgroundImage:
            "linear-gradient(to top, rgba(10,12,16,0.95) 0%, rgba(10,12,16,0.88) 38%, rgba(10,12,16,0.55) 70%, rgba(10,12,16,0) 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          width,
          padding: 64,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", paddingBottom: 22 }}>
          <div
            style={{
              width: 13,
              height: 13,
              borderRadius: 7,
              backgroundColor: ink,
              marginRight: 13,
            }}
          />
          <div
            style={{
              fontFamily: '"Martian Mono", monospace',
              fontWeight: 700,
              fontSize: 21,
              letterSpacing: 3,
              color: "#ffffff",
            }}
          >
            {kind === "note" ? "NOTE" : "PROJECT"}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontFamily: '"Bricolage Grotesque", sans-serif',
            fontWeight: 600,
            fontSize: 68,
            lineHeight: 0.99,
            letterSpacing: -2.2,
            color: "#ffffff",
            width: 940,
            paddingBottom: 30,
          }}
        >
          {heading}
        </div>

        <div style={{ width: "100%", height: 2, backgroundColor: RULE_ON_DARK }} />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 18,
            fontFamily: '"Martian Mono", monospace',
            fontSize: 19,
            letterSpacing: 1.9,
          }}
        >
          <div style={{ display: "flex", fontWeight: 500, color: "rgba(255,255,255,0.82)" }}>
            {facts.join("   ·   ")}
          </div>
          <div style={{ display: "flex", fontWeight: 700, color: "rgba(255,255,255,0.62)" }}>
            MATHIS LAMBERT
          </div>
        </div>
      </div>
    </div>
  );
}
