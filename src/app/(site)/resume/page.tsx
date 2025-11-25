import { getResume } from "@/lib/data/content";
import { ResumePageContent } from "@/components/resume/ResumePageContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Resume - Mathis Lambert",
  description: "Professional experience and skills of Mathis Lambert.",
};

export default async function ResumePage() {
  const resume = await getResume();
  return <ResumePageContent resume={resume} />;
}
