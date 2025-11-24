"use client";
import { useRef, useState } from "react";
import {
  Briefcase,
  Code,
  Cpu,
  GraduationCap,
  Heart,
  Home,
  Mail,
  Sparkles,
  Languages,
} from "lucide-react";
import type { ResumeData } from "@/types";
import { ResumeHeader } from "@/components/layout/ResumeHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { ResumeSection } from "@/components/ui/ResumeSection";
import { TagListSection } from "@/components/ui/TagListSection";
import { HighlightCard } from "@/components/resume/experience/HighlightCard";
import { ExperienceCard } from "@/components/resume/experience/ExperienceCard";
import { FaLinkedin } from "react-icons/fa";
import { CertificationsCard } from "../resume/CertificationsCard";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { downloadResumePdf } from "@/api/resume";
import { motion } from "framer-motion";

const emptyResume: ResumeData = {
  name: "",
  contact: {
    email: "",
    phone: "",
    linkedin: "",
    github: "",
    website: "",
  },
  personal_statement: "",
  experiences: [],
  education: [],
  certifications: [],
  technical_skills: {
    languages: [],
    programming: [],
    ai_ml: [],
    systems_and_infra: [],
    web: [],
  },
  skills: [],
  passions: [],
};

const normalizeResume = (value: ResumeData | null | undefined): ResumeData => {
  if (!value) return emptyResume;
  return {
    ...emptyResume,
    ...value,
    contact: { ...emptyResume.contact, ...(value.contact ?? {}) },
    experiences: Array.isArray(value.experiences) ? value.experiences : [],
    education: Array.isArray(value.education) ? value.education : [],
    certifications: Array.isArray(value.certifications)
      ? value.certifications
      : [],
    technical_skills: {
      ...emptyResume.technical_skills,
      ...(value.technical_skills ?? {}),
      languages: Array.isArray(value.technical_skills?.languages)
        ? value.technical_skills!.languages
        : [],
      programming: Array.isArray(value.technical_skills?.programming)
        ? value.technical_skills!.programming
        : [],
      ai_ml: Array.isArray(value.technical_skills?.ai_ml)
        ? value.technical_skills!.ai_ml
        : [],
      systems_and_infra: Array.isArray(
        value.technical_skills?.systems_and_infra,
      )
        ? value.technical_skills!.systems_and_infra
        : [],
      web: Array.isArray(value.technical_skills?.web)
        ? value.technical_skills!.web
        : [],
    },
    skills: Array.isArray(value.skills) ? value.skills : [],
    passions: Array.isArray(value.passions) ? value.passions : [],
  };
};

export default function Resume({
  resumeData,
}: {
  resumeData: ResumeData | null;
}) {
  const resumeRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const data = normalizeResume(resumeData);

  const onExportPdf = async () => {
    try {
      setDownloading(true);
      await downloadResumePdf();
    } catch (e) {
      console.error("Failed to export resume PDF", e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="text-slate-800 dark:text-slate-200 font-sans transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
        <ResumeHeader
          name={data.name ?? ""}
          personal_statement={data.personal_statement ?? ""}
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
              <span>{downloading ? "Exporting…" : "Export PDF"}</span>
            </Button>
          }
        />

        <motion.div
          className="mb-6 text-slate-600 dark:text-slate-400"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.25 }}
        >
          <p>{}</p>
        </motion.div>

        <div id="resume-content" ref={resumeRef}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <main className="lg:col-span-2 space-y-6">
              <GlassCard className="p-4 md:p-6" delay={0.08}>
                <ResumeSection icon={Cpu} title="Experience">
                  {data.experiences
                    ?.filter((exp) => !exp.hide)
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
                        Programming
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(data.technical_skills?.programming ?? []).map(
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
                        {(data.technical_skills?.ai_ml ?? []).map((it, i) => (
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
                        Systems &amp; Infra
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(data.technical_skills?.systems_and_infra ?? []).map(
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
                        Web
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(data.technical_skills?.web ?? []).map((it, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full text-xs bg-cyan-400/10 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300"
                          >
                            {it}
                          </span>
                        ))}
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
                      href={`mailto:${data.contact.email}`}
                      className="flex items-center hover:text-cyan-500 transition-colors"
                    >
                      <Mail size={14} className="mr-3 shrink-0" />
                      {data.contact.email}
                    </a>
                    <a
                      href={`https://linkedin.com/in/${data.contact.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center hover:text-cyan-500 transition-colors"
                    >
                      <FaLinkedin size={14} className="mr-3 shrink-0" />
                      linkedin.com/in/{data.contact.linkedin}
                    </a>
                    {data.contact.github && (
                      <a
                        href={`https://github.com/${data.contact.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center hover:text-cyan-500 transition-colors"
                      >
                        <Code size={14} className="mr-3 shrink-0" />
                        github.com/{data.contact.github}
                      </a>
                    )}
                    {data.contact.website && (
                      <a
                        href={data.contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center hover:text-cyan-500 transition-colors"
                      >
                        <Home size={14} className="mr-3 shrink-0" />
                        {data.contact.website}
                      </a>
                    )}
                  </div>
                </ResumeSection>
              </GlassCard>

              <GlassCard className="p-6" delay={0.32}>
                <ResumeSection icon={GraduationCap} title="Education">
                  {data.education.map((edu, i) => (
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
                icon={Languages}
                title="Languages"
                items={data.technical_skills?.languages ?? []}
                colorClass="bg-emerald-400/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
                delay={0.36}
              />

              <GlassCard className="p-6" delay={0.56}>
                <ResumeSection icon={Briefcase} title="Certifications">
                  <CertificationsCard certifications={data.certifications} />
                </ResumeSection>
              </GlassCard>

              <TagListSection
                icon={Sparkles}
                title="Core Skills"
                items={data.skills ?? []}
                colorClass="bg-amber-400/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"
                delay={0.6}
              />

              <TagListSection
                icon={Heart}
                title="Passions"
                items={data.passions ?? []}
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
