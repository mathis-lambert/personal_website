import { getResume } from "@/lib/data/content";
import { ResumePageContent } from "@/components/resume/ResumePageContent";
import { getResumeLocale } from "@/lib/resume/localization";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Resume - Mathis Lambert",
  description: "Professional experience and skills of Mathis Lambert.",
};

export default async function ResumePage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string }>;
}) {
  const resume = await getResume();
  const resolvedSearchParams = await searchParams;
  const initialLocale = getResumeLocale(resolvedSearchParams?.lang);

  return <ResumePageContent resume={resume} initialLocale={initialLocale} />;
}
