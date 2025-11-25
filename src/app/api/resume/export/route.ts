import { NextResponse } from "next/server";

import { getResume } from "@/lib/data/content";
import { logEvent } from "@/lib/data/events";
import { buildResumePdf } from "@/lib/pdf/resume";

export async function GET() {
  const resume = await getResume();
  const pdfBytes = await buildResumePdf(resume);

  await logEvent("resume_export", {});

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="mathis_lambert_resume.pdf"',
    },
  });
}
