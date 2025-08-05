import { useRef } from 'react';
import {
  Briefcase,
  Code,
  Cpu,
  GraduationCap,
  Heart,
  Home,
  Linkedin,
  Mail,
  Phone,
  Sparkles,
} from 'lucide-react';
import { useResume } from '@/hooks/useResume.ts';
import { ResumeHeader } from '@/components/layout/ResumeHeader.tsx';
import { GlassCard } from '@/components/ui/GlassCard.tsx';
import { ResumeSection } from '@/components/ui/ResumeSection.tsx';
import { TagListSection } from '@/components/ui/TagListSection.tsx';
import { HighlightCard } from '@/components/ui/experience/HighlightCard.tsx';
import { ExperienceCard } from '@/components/ui/experience/ExperienceCard.tsx';

export default function Resume() {
  const { resumeData, isLoading, handleAiInteraction } = useResume();
  const resumeRef = useRef<HTMLDivElement>(null);

  const handleExportPdf = async () => {
    // if (!resumeRef.current) return;
    // setIsLoading((prev) => ({ ...prev, pdf: true }));
    // try {
    //   await exportToPdf(resumeRef.current, 'Mathis_Lambert_Resume.pdf');
    // } catch (error) {
    //   console.error('Failed to export PDF:', error);
    // } finally {
    //   setIsLoading((prev) => ({ ...prev, pdf: false }));
    // }
    window.print();
  };

  return (
    <div className=" text-slate-800 dark:text-slate-200 font-sans transition-colors duration-500">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <ResumeHeader
          name={resumeData.name}
          onExportPdf={handleExportPdf}
          isPdfLoading={isLoading.pdf}
        />

        {/* The ref is now on a dedicated wrapper for more precise PDF capture */}
        <div id="resume-content" ref={resumeRef}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <main className="lg:col-span-2 space-y-8">
              <GlassCard delay={0.2} className="p-6">
                <ResumeSection
                  icon={Briefcase}
                  title="About Me"
                  actions={
                    <button
                      title="Rewrite Summary with AI"
                      onClick={() => handleAiInteraction('summary')}
                      disabled={isLoading.summary}
                      className="p-1.5 text-slate-500 hover:text-cyan-500 disabled:opacity-50 transition-colors"
                    >
                      <Sparkles size={16} />
                    </button>
                  }
                >
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
                    {isLoading.summary
                      ? 'The AI is thinking...'
                      : resumeData.summary}
                  </p>
                </ResumeSection>
              </GlassCard>

              <GlassCard delay={0.3} className="p-6">
                <ResumeSection icon={Cpu} title="Experience">
                  {resumeData.experiences.map((exp, i) =>
                    exp.highlight ? (
                      <HighlightCard
                        key={i}
                        experience={exp}
                        delay={0.4 + i * 0.1}
                      />
                    ) : (
                      <ExperienceCard
                        key={i}
                        experience={exp}
                        delay={0.4 + i * 0.1}
                      />
                    ),
                  )}
                </ResumeSection>
              </GlassCard>

              <TagListSection
                icon={Heart}
                title="Passions"
                items={resumeData.passions}
                colorClass="bg-rose-400/10 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300"
                delay={0.7}
              />
            </main>

            <aside className="lg:col-span-1 space-y-8 lg:sticky lg:top-8 self-start">
              <GlassCard delay={0.4} className="p-6">
                <ResumeSection icon={Home} title="Contact">
                  <div className="space-y-2 text-sm">
                    <a
                      href={`mailto:${resumeData.contact.email}`}
                      className="flex items-center hover:text-cyan-500 transition-colors"
                    >
                      <Mail size={14} className="mr-3 shrink-0" />
                      {resumeData.contact.email}
                    </a>
                    <a
                      href={`tel:${resumeData.contact.phone.replace(/\s/g, '')}`}
                      className="flex items-center hover:text-cyan-500 transition-colors"
                    >
                      <Phone size={14} className="mr-3 shrink-0" />
                      {resumeData.contact.phone}
                    </a>
                    <a
                      href={`https://linkedin.com/in/${resumeData.contact.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center hover:text-cyan-500 transition-colors"
                    >
                      <Linkedin size={14} className="mr-3 shrink-0" />
                      linkedin.com/in/{resumeData.contact.linkedin}
                    </a>
                  </div>
                </ResumeSection>
              </GlassCard>

              <GlassCard delay={0.8} className="p-6">
                <ResumeSection icon={GraduationCap} title="Education">
                  {resumeData.education.map((edu, i) => (
                    <div key={i} className="mb-3 last:mb-0">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                        {edu.institution}
                      </h3>
                      <p className="text-cyan-600 dark:text-cyan-400 text-sm">
                        {edu.degree}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-xs">
                        {edu.period}
                      </p>
                    </div>
                  ))}
                </ResumeSection>
              </GlassCard>

              <TagListSection
                icon={Code}
                title="Technologies"
                items={resumeData.technologies}
                colorClass="bg-cyan-400/10 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300"
                delay={0.5}
              />

              <TagListSection
                icon={Sparkles}
                title="Professional Skills"
                items={resumeData.skills}
                colorClass="bg-amber-400/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"
                delay={0.6}
              />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
