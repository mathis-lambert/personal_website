import { useRef, useState } from 'react';
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
import { HighlightCard } from '@/components/resume/experience/HighlightCard';
import { ExperienceCard } from '@/components/resume/experience/ExperienceCard';
import { FaLinkedin } from 'react-icons/fa';
import { CertificationsCard } from '../resume/CertificationsCard';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { downloadResumePdf } from '@/api/resume';
import { motion } from 'framer-motion';

export default function Resume() {
  const { resumeData } = useResume();
  const resumeRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const onExportPdf = async () => {
    try {
      setDownloading(true);
      await downloadResumePdf();
    } catch (e) {
      console.error('Failed to export resume PDF', e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="text-slate-800 dark:text-slate-200 font-sans transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
        <ResumeHeader
          name={resumeData?.name ?? ''}
          personal_statement={resumeData?.personal_statement ?? ''}
          actions={
            <Button
              variant="outline"
              className="group bg-white/50 dark:bg-black/50 hover:bg-white/70 dark:hover:bg-black/70 backdrop-blur border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              size="sm"
              onClick={onExportPdf}
              aria-busy={downloading}
              disabled={downloading}
            >
              {downloading ? (
                <Loader2 className="animate-spin text-cyan-600 dark:text-cyan-400" />
              ) : (
                <Download className="text-cyan-600 dark:text-cyan-400 transition-transform duration-200 group-hover:rotate-[-12deg]" />
              )}
              <span>{downloading ? 'Exporting…' : 'Export PDF'}</span>
            </Button>
          }
        />

        <motion.div
          className="mb-6 text-slate-600 dark:text-slate-400"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.3, ease: 'easeOut', delay: 0.25 }}
        >
          <p>{}</p>
        </motion.div>

        <div id="resume-content" ref={resumeRef}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <main className="lg:col-span-2 space-y-6">
              <GlassCard className="p-4 md:p-6" delay={0.08}>
                <ResumeSection icon={Cpu} title="Experience">
                  {resumeData?.experiences
                    .filter((exp) => !exp.hide)
                    .map((exp, i) => {
                      const Component = exp.highlight
                        ? HighlightCard
                        : ExperienceCard;
                      return (
                        <Component key={i} experience={exp} delay={0.05 * i} />
                      );
                    })}
                </ResumeSection>
              </GlassCard>

              {/* Compact Technical Skills in one card */}
              <GlassCard className="p-6" delay={0.18}>
                <ResumeSection icon={Code} title="Technical Skills">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                        Languages
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(resumeData?.technical_skills?.languages ?? []).map(
                          (it, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-full text-xs bg-cyan-400/10 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300"
                            >
                              {it}
                            </span>
                          ),
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                        AI / ML
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(resumeData?.technical_skills?.ai_ml ?? []).map(
                          (it, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-full text-xs bg-cyan-400/10 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300"
                            >
                              {it}
                            </span>
                          ),
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                        Systems &amp; Infra
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(
                          resumeData?.technical_skills?.systems_and_infra ?? []
                        ).map((it, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full text-xs bg-cyan-400/10 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300"
                          >
                            {it}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                        Web
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(resumeData?.technical_skills?.web ?? []).map(
                          (it, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-full text-xs bg-cyan-400/10 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300"
                            >
                              {it}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </ResumeSection>
              </GlassCard>
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
                    {resumeData?.contact.github && (
                      <a
                        href={`https://github.com/${resumeData.contact.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center hover:text-cyan-500 transition-colors"
                      >
                        <Code size={14} className="mr-3 shrink-0" />
                        github.com/{resumeData.contact.github}
                      </a>
                    )}
                    {resumeData?.contact.website && (
                      <a
                        href={resumeData.contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center hover:text-cyan-500 transition-colors"
                      >
                        <Home size={14} className="mr-3 shrink-0" />
                        {resumeData.contact.website}
                      </a>
                    )}
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

              <GlassCard className="p-6" delay={0.56}>
                <ResumeSection icon={Briefcase} title="Certifications">
                  <CertificationsCard
                    certifications={resumeData?.certifications}
                  />
                </ResumeSection>
              </GlassCard>

              <TagListSection
                icon={Sparkles}
                title="Core Skills"
                items={resumeData?.skills ?? []}
                colorClass="bg-amber-400/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"
                delay={0.6}
              />

              <TagListSection
                icon={Heart}
                title="Passions"
                items={resumeData?.passions ?? []}
                colorClass="bg-rose-400/10 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300"
                delay={0.64}
              />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
