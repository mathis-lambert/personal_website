"use client";

import Image from "next/image";
import { ImagePlus, Loader2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { getMediaAssets, uploadMediaAsset } from "@/api/media";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { mediaAssetUrl, type MediaAsset } from "@/types/media";

export function MediaLibraryDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (asset: MediaAsset) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [alt, setAlt] = useState("");

  useEffect(() => {
    if (!open) return;
    void getMediaAssets()
      .then((assets) => {
        setItems(assets);
        setLoaded(true);
      })
      .catch((error) => toast.error((error as Error).message))
  }, [open]);

  const upload = async (file: File) => {
    setProgress(1);
    try {
      const asset = await uploadMediaAsset(file, alt, setProgress);
      setItems((current) => [asset, ...current]);
      onSelect(asset);
      onOpenChange(false);
      toast.success("Image optimized and uploaded");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[86vh] overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-line px-6 py-5">
          <DialogTitle className="font-display text-xl">Media library</DialogTitle>
          <DialogDescription>
            Drop in an image. The original is converted into responsive WebP variants.
          </DialogDescription>
        </DialogHeader>

        <div
          className="mx-6 mt-5 grid min-h-32 place-items-center rounded-4 border border-dashed border-line-strong bg-paper-sink/45 p-5 text-center transition-colors hover:border-brand"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const file = event.dataTransfer.files[0];
            if (file) void upload(file);
          }}
        >
          {progress != null ? (
            <div className="w-full max-w-sm space-y-3">
              <Loader2 className="mx-auto size-5 animate-spin text-brand" />
              <Progress value={progress} />
              <p className="t-meta">Optimizing and sending to the CDN…</p>
            </div>
          ) : (
            <div>
              <ImagePlus className="mx-auto mb-3 size-6 text-brand" />
              <p className="text-sm font-bold">Drop an image here</p>
              <p className="t-meta mt-1">JPEG, PNG, WebP or AVIF · 15 MB max</p>
              <Input
                value={alt}
                onChange={(event) => setAlt(event.target.value)}
                placeholder="Describe the image (recommended)"
                aria-label="Image description"
                className="mx-auto mt-4 max-w-sm bg-paper-lift text-left"
              />
              <Button className="mt-4" size="sm" onClick={() => inputRef.current?.click()}>
                <Upload /> Choose image
              </Button>
              <Input
                ref={inputRef}
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void upload(file);
                }}
              />
            </div>
          )}
        </div>

        <div className="min-h-0 overflow-y-auto px-6 pb-6 pt-5">
          {!loaded ? (
            <div className="grid h-32 place-items-center"><Loader2 className="animate-spin" /></div>
          ) : items.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {items.map((asset) => {
                const url = mediaAssetUrl(asset, 640);
                if (!url) return null;
                return (
                  <button
                    key={asset._id}
                    type="button"
                    onClick={() => { onSelect(asset); onOpenChange(false); }}
                    className="group overflow-hidden rounded-3 border border-line bg-paper-lift text-left transition hover:-translate-y-0.5 hover:border-brand hover:shadow-1"
                  >
                    <span className="relative block aspect-[4/3] bg-paper-sink">
                      <Image src={url} alt={asset.alt} fill sizes="220px" className="object-cover" />
                    </span>
                    <span className="block truncate px-3 py-2 t-meta text-ink-muted">
                      {asset.alt || asset.originalName}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-ink-muted">No images yet. Upload the first one above.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
