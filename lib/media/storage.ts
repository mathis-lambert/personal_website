import "server-only";

import { DeleteObjectsCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { getMediaEnv } from "@/lib/media/config";

let client: S3Client | null = null;

const getClient = () => {
  if (client) return client;
  const env = getMediaEnv();
  client = new S3Client({
    region: env.region,
    endpoint: env.endpoint,
    forcePathStyle: env.forcePathStyle,
    credentials: {
      accessKeyId: env.accessKeyId,
      secretAccessKey: env.secretAccessKey,
    },
  });
  return client;
};

export const mediaUrl = (key: string) =>
  `${getMediaEnv().publicBaseUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;

export const putMediaObject = async (key: string, body: Buffer) => {
  const env = getMediaEnv();
  await getClient().send(
    new PutObjectCommand({
      Bucket: env.bucket,
      Key: key,
      Body: body,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
};

export const deleteMediaObjects = async (keys: string[]) => {
  if (!keys.length) return;
  const env = getMediaEnv();
  await getClient().send(
    new DeleteObjectsCommand({
      Bucket: env.bucket,
      Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
    }),
  );
};
