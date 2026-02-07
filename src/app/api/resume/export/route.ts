import { NextResponse } from "next/server";

import { withApiAnalytics } from "@/lib/analytics/server";
import { getResume } from "@/lib/data/content";
import { buildResumePdf } from "@/lib/pdf/resume";

const getHandler = async () => {
  const resume = await getResume();
  const pdfBytes = await buildResumePdf(resume);

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="mathis_lambert_resume.pdf"',
    },
  });
};

export const GET = withApiAnalytics(
  {
    route: "/api/resume/export",
    actorType: "public",
    captureRequestBody: false,
  },
  getHandler,
);
