import {
  type ResumeLocale,
  getResumePdfFilename,
} from "@/lib/resume/localization";
import { fetchWithTimeout } from "./utils";

export async function exportResumePdf(options?: {
  locale?: ResumeLocale;
  signal?: AbortSignal;
  timeoutMs?: number;
}): Promise<Blob> {
  const params = new URLSearchParams();
  if (options?.locale) {
    params.set("lang", options.locale);
  }

  const url = params.size
    ? `/api/resume/export?${params.toString()}`
    : "/api/resume/export";

  const res = await fetchWithTimeout(url, {
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
  locale?: ResumeLocale;
  signal?: AbortSignal;
}): Promise<void> {
  const locale = options?.locale ?? "en";
  const blob = await exportResumePdf({
    locale,
    signal: options?.signal,
  });
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = options?.filename ?? getResumePdfFilename(locale);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    URL.revokeObjectURL(url);
  }
}
