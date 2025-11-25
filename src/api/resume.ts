import { fetchWithTimeout } from "./utils";

export async function exportResumePdf(options?: {
  signal?: AbortSignal;
  timeoutMs?: number;
}): Promise<Blob> {
  const res = await fetchWithTimeout(`/api/resume/export`, {
    method: "GET",
    signal: options?.signal,
    timeoutMs: options?.timeoutMs ?? 20000,
    headers: { Accept: "application/pdf" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Resume PDF export failed: ${res.status}${text ? ` - ${text}` : ""}`,
    );
  }
  return res.blob();
}

export async function downloadResumePdf(options?: {
  filename?: string;
  signal?: AbortSignal;
}): Promise<void> {
  const blob = await exportResumePdf({ signal: options?.signal });
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = options?.filename ?? "mathis_lambert_resume.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    URL.revokeObjectURL(url);
  }
}
