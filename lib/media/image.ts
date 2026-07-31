import "server-only";

import sharp from "sharp";

import { MEDIA_LIMITS } from "@/lib/media/config";

const acceptedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export type ProcessedVariant = {
  width: number;
  height: number;
  bytes: number;
  buffer: Buffer;
};

export const validateImageUpload = (file: File) => {
  if (!acceptedTypes.has(file.type)) {
    throw new Error("Use a JPEG, PNG, WebP or AVIF image.");
  }
  if (file.size <= 0 || file.size > MEDIA_LIMITS.maxUploadBytes) {
    throw new Error("Images must be smaller than 15 MB.");
  }
};

export const processImage = async (input: Buffer): Promise<ProcessedVariant[]> => {
  const source = sharp(input, { limitInputPixels: 40_000_000 }).rotate();
  const metadata = await source.metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error("The image dimensions could not be read.");
  }

  const sourceWidth = metadata.autoOrient?.width ?? metadata.width;
  const requested = [
    ...MEDIA_LIMITS.widths.filter((width) => width < sourceWidth),
    Math.min(sourceWidth, MEDIA_LIMITS.widths.at(-1)!),
  ];
  const widths = [...new Set(requested)].sort((a, b) => a - b);

  return Promise.all(
    widths.map(async (width) => {
      const { data, info } = await source
        .clone()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: MEDIA_LIMITS.webpQuality, effort: 5 })
        .toBuffer({ resolveWithObject: true });
      return {
        width: info.width,
        height: info.height,
        bytes: info.size,
        buffer: data,
      };
    }),
  );
};
