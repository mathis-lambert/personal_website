import type { MediaAsset } from "@/types/media";

const responseError = async (response: Response) => {
  const body = (await response.json().catch(() => null)) as { detail?: string } | null;
  return new Error(body?.detail || `Media request failed (${response.status}).`);
};

export const getMediaAssets = async (): Promise<MediaAsset[]> => {
  const response = await fetch("/api/admin/media", { credentials: "same-origin" });
  if (!response.ok) throw await responseError(response);
  return ((await response.json()) as { items: MediaAsset[] }).items;
};

export const uploadMediaAsset = (
  file: File,
  alt: string,
  onProgress: (progress: number) => void,
): Promise<MediaAsset> =>
  new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/admin/media");
    request.withCredentials = true;
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress((event.loaded / event.total) * 100);
    };
    request.onerror = () => reject(new Error("The upload was interrupted."));
    request.onload = () => {
      let body: { item?: MediaAsset; detail?: string } = {};
      try {
        body = JSON.parse(request.responseText || "{}") as typeof body;
      } catch {
        reject(new Error(`Upload failed (${request.status}).`));
        return;
      }
      if (request.status >= 200 && request.status < 300 && body.item) {
        onProgress(100);
        resolve(body.item);
      } else {
        reject(new Error(body.detail || `Upload failed (${request.status}).`));
      }
    };
    const data = new FormData();
    data.set("file", file);
    data.set("alt", alt);
    request.send(data);
  });
