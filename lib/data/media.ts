import "server-only";

import { randomUUID } from "node:crypto";
import { ObjectId } from "mongodb";

import {
  getMediaAssetsCollection,
  type MediaAssetDocument,
} from "@/lib/db/collections";
import { processImage } from "@/lib/media/image";
import {
  deleteMediaObjects,
  mediaUrl,
  putMediaObject,
} from "@/lib/media/storage";
import type { MediaAsset } from "@/types/media";

const serialize = (doc: MediaAssetDocument | null): MediaAsset | null => {
  if (!doc?._id || !doc.createdAt || !doc.updatedAt) return null;
  return {
    _id: String(doc._id),
    originalName: doc.originalName,
    alt: doc.alt,
    format: "webp",
    variants: doc.variants,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
};

export const listMediaAssets = async (query = "", limit = 60) => {
  const collection = await getMediaAssetsCollection();
  const filter = query.trim()
    ? { $or: [
        { originalName: { $regex: query.trim(), $options: "i" } },
        { alt: { $regex: query.trim(), $options: "i" } },
      ] }
    : {};
  const docs = await collection
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(limit, 1), 100))
    .toArray();
  return docs.map(serialize).filter((asset): asset is MediaAsset => !!asset);
};

export const createMediaAsset = async (file: File, alt = "") => {
  const now = new Date();
  const id = randomUUID();
  const variants = await processImage(Buffer.from(await file.arrayBuffer()));
  const prefix = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${id}`;
  const uploadedKeys: string[] = [];

  try {
    const stored = [];
    for (const variant of variants) {
      const key = `${prefix}/${variant.width}.webp`;
      await putMediaObject(key, variant.buffer);
      uploadedKeys.push(key);
      stored.push({
        width: variant.width,
        height: variant.height,
        bytes: variant.bytes,
        key,
        url: mediaUrl(key),
      });
    }

    const collection = await getMediaAssetsCollection();
    const result = await collection.insertOne({
      originalName: file.name || "image",
      alt: alt.trim(),
      format: "webp",
      variants: stored,
      createdAt: now,
      updatedAt: now,
    });
    return serialize({
      _id: result.insertedId,
      originalName: file.name || "image",
      alt: alt.trim(),
      format: "webp",
      variants: stored,
      createdAt: now,
      updatedAt: now,
    })!;
  } catch (error) {
    await deleteMediaObjects(uploadedKeys).catch(() => undefined);
    throw error;
  }
};

export const updateMediaAssetAlt = async (id: string, alt: string) => {
  if (!ObjectId.isValid(id)) throw new Error("Invalid media id.");
  const collection = await getMediaAssetsCollection();
  const doc = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { alt: alt.trim(), updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!doc) throw new Error("Media not found.");
  return serialize(doc)!;
};

export const deleteMediaAsset = async (id: string) => {
  if (!ObjectId.isValid(id)) throw new Error("Invalid media id.");
  const collection = await getMediaAssetsCollection();
  const doc = await collection.findOne({ _id: new ObjectId(id) });
  if (!doc) throw new Error("Media not found.");
  await deleteMediaObjects(doc.variants.map((variant) => variant.key));
  await collection.deleteOne({ _id: doc._id });
};
