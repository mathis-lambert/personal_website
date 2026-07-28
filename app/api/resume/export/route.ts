import { NextResponse, type NextRequest } from "next/server";

import { withApiAnalytics } from "@/lib/analytics/server";
import { getResume } from "@/lib/data/content";
import { buildResumePdf } from "@/lib/pdf/resume";
import {
  getResumeLocale,
  getResumePdfFilename,
  resolveResumeContent,
} from "@/lib/resume/localization";

const getHandler = async (req: NextRequest) => {
  const locale = getResumeLocale(req.nextUrl.searchParams.get("lang"));
  const resume = await getResume();
  const localizedResume = resolveResumeContent(resume, locale);
  const pdfBytes = await buildResumePdf(localizedResume, locale);

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${getResumePdfFilename(locale)}"`,
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
