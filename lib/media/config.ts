import "server-only";

const required = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
};

export const MEDIA_LIMITS = {
  maxUploadBytes: 15 * 1024 * 1024,
  widths: [640, 1280, 2400],
  webpQuality: 82,
} as const;

export const getMediaEnv = () => ({
  bucket: required("MEDIA_S3_BUCKET"),
  region: process.env.MEDIA_S3_REGION?.trim() || "us-east-1",
  endpoint: required("MEDIA_S3_ENDPOINT"),
  forcePathStyle: process.env.MEDIA_S3_FORCE_PATH_STYLE !== "false",
  accessKeyId: required("MEDIA_S3_ACCESS_KEY_ID"),
  secretAccessKey: required("MEDIA_S3_SECRET_ACCESS_KEY"),
  publicBaseUrl: required("MEDIA_PUBLIC_BASE_URL").replace(/\/$/, ""),
});
