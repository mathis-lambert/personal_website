export type MediaVariant = {
  width: number;
  height: number;
  bytes: number;
  key: string;
  url: string;
};

export type MediaAsset = {
  _id: string;
  originalName: string;
  alt: string;
  format: "webp";
  variants: MediaVariant[];
  createdAt: string;
  updatedAt: string;
};

export const mediaAssetUrl = (asset: MediaAsset, preferredWidth = 1280) => {
  return (
    asset.variants.find((variant) => variant.width >= preferredWidth) ??
    asset.variants.at(-1)
  )?.url;
};
