import {
  type ResumeLocale,
  getResumePdfFilename,
} from "@/lib/resume/localization";
import { fetchWithTimeout } from "./utils";

/** Fetch the PDF and hand it to the browser as a download. */
export async function downloadResumePdf(options?: {
  filename?: string;
  locale?: ResumeLocale;
  signal?: AbortSignal;
}): Promise<void> {
  const locale = options?.locale ?? "en";

  const res = await fetchWithTimeout(`/api/resume/export?lang=${locale}`, {
    method: "GET",
    signal: options?.signal,
    timeoutMs: 20_000,
    headers: { Accept: "application/pdf" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Resume PDF export failed: ${res.status}${text ? ` - ${text}` : ""}`,
    );
  }

  const url = URL.createObjectURL(await res.blob());
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
