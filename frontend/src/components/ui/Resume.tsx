import { useRef } from 'react';
import {
  Briefcase,
  Code,
  Cpu,
  GraduationCap,
  Heart,
  Home,
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
import { FaLinkedin } from 'react-icons/fa';

export default function Resume() {
  const { resumeData } = useResume();
  const resumeRef = useRef<HTMLDivElement>(null);

  return (
    <div className="text-slate-800 dark:text-slate-200 font-sans transition-colors duration-500">
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <ResumeHeader name={resumeData?.name ?? ''} />

        <div id="resume-content" ref={resumeRef}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <main className="lg:col-span-2 space-y-6">
              <GlassCard className="p-6" delay={0}>
                <ResumeSection
                  icon={Briefcase}
                  title="About Me"
                >
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[15px] sm:text-base">
                    {resumeData?.summary}
                  </p>
                </ResumeSection>
              </GlassCard>

              <GlassCard className="p-6" delay={0.08}>
                <ResumeSection icon={Cpu} title="Experience">
                  {resumeData?.experiences.map((exp, i) =>
                    exp.highlight ? (
                      <HighlightCard
                        key={i}
                        experience={exp}
                        delay={0.05 * i}
                      />
                    ) : (
                      <ExperienceCard
                        key={i}
                        experience={exp}
                        delay={0.05 * i}
                      />
                    ),
                  )}
                </ResumeSection>
              </GlassCard>

              <TagListSection
                icon={Heart}
                title="Passions"
                items={resumeData?.passions ?? []}
                colorClass="bg-rose-400/10 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300"
                delay={0.16}
              />
            </main>

            <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-8 self-start">
              <GlassCard className="p-6" delay={0.24}>
                <ResumeSection icon={Home} title="Contact">
                  <div className="space-y-2 text-sm">
                    <a
                      href={`mailto:${resumeData?.contact.email}`}
                      className="flex items-center hover:text-cyan-500 transition-colors"
                    >
                      <Mail size={14} className="mr-3 shrink-0" />
                      {resumeData?.contact.email}
                    </a>
                    <a
                      href={`tel:${resumeData?.contact.phone.replace(/\s/g, '')}`}
                      className="flex items-center hover:text-cyan-500 transition-colors"
                    >
                      <Phone size={14} className="mr-3 shrink-0" />
                      {resumeData?.contact.phone}
                    </a>
                    <a
                      href={`https://linkedin.com/in/${resumeData?.contact.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center hover:text-cyan-500 transition-colors"
                    >
                      <FaLinkedin size={14} className="mr-3 shrink-0" />
                      linkedin.com/in/{resumeData?.contact.linkedin}
                    </a>
                  </div>
                </ResumeSection>
              </GlassCard>

              <GlassCard className="p-6" delay={0.32}>
                <ResumeSection icon={GraduationCap} title="Education">
                  {resumeData?.education.map((edu, i) => (
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
                items={resumeData?.technologies ?? []}
                colorClass="bg-cyan-400/10 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300"
                delay={0.4}
              />

              <TagListSection
                icon={Sparkles}
                title="Professional Skills"
                items={resumeData?.skills ?? []}
                colorClass="bg-amber-400/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"
                delay={0.48}
              />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
