import type {
  Contact,
  Education,
  Experience,
  ResumeContent,
  ResumeData,
  TechnicalSkills,
  Certification,
} from "@/types/resume";

export type ResumeLocale = "en" | "fr";

type ResumeLabels = {
  exportPdf: string;
  exporting: string;
  language: string;
  english: string;
  french: string;
  experience: string;
  technicalSkills: string;
  programming: string;
  aiMl: string;
  systemsAndInfra: string;
  web: string;
  contact: string;
  education: string;
  languages: string;
  certifications: string;
  coreSkills: string;
  passions: string;
  interests: string;
  current: string;
};

const emptyContact = (): Contact => ({
  email: "",
  phone: "",
  linkedin: "",
  github: "",
  website: "",
});

const emptyTechnicalSkills = (): TechnicalSkills => ({
  languages: [],
  programming: [],
  ai_ml: [],
  systems_and_infra: [],
  web: [],
});

export const createEmptyResumeContent = (): ResumeContent => ({
  name: "",
  contact: emptyContact(),
  personal_statement: "",
  experiences: [],
  education: [],
  certifications: [],
  technical_skills: emptyTechnicalSkills(),
  skills: [],
  passions: [],
});

const fallbackArray = <T>(value: T[] | undefined, fallback: T[]): T[] =>
  Array.isArray(value) ? value : fallback;

export const getResumeLocale = (value: string | null | undefined): ResumeLocale =>
  value === "fr" ? "fr" : "en";

export const resolveResumeContent = (
  value: ResumeData | null | undefined,
  locale: ResumeLocale,
): ResumeContent => {
  const base: ResumeContent = value
    ? {
        name: value.name ?? "",
        contact: { ...emptyContact(), ...(value.contact ?? {}) },
        personal_statement: value.personal_statement ?? "",
        experiences: fallbackArray<Experience>(value.experiences, []),
        education: fallbackArray<Education>(value.education, []),
        certifications: fallbackArray<Certification>(value.certifications, []),
        technical_skills: {
          ...emptyTechnicalSkills(),
          ...(value.technical_skills ?? {}),
          languages: fallbackArray<string>(
            value.technical_skills?.languages,
            [],
          ),
          programming: fallbackArray<string>(
            value.technical_skills?.programming,
            [],
          ),
          ai_ml: fallbackArray<string>(value.technical_skills?.ai_ml, []),
          systems_and_infra: fallbackArray<string>(
            value.technical_skills?.systems_and_infra,
            [],
          ),
          web: fallbackArray<string>(value.technical_skills?.web, []),
        },
        skills: fallbackArray<string>(value.skills, []),
        passions: fallbackArray<string>(value.passions, []),
      }
    : createEmptyResumeContent();

  if (locale !== "fr") {
    return base;
  }

  const translated = value?.translations?.fr;
  if (!translated) {
    return base;
  }

  return {
    name: translated.name ?? base.name,
    contact: { ...base.contact, ...(translated.contact ?? {}) },
    personal_statement:
      translated.personal_statement ?? base.personal_statement,
    experiences: fallbackArray<Experience>(translated.experiences, base.experiences),
    education: fallbackArray<Education>(translated.education, base.education),
    certifications: fallbackArray<Certification>(
      translated.certifications,
      base.certifications,
    ),
    technical_skills: {
      ...base.technical_skills,
      ...(translated.technical_skills ?? {}),
      languages: fallbackArray<string>(
        translated.technical_skills?.languages,
        base.technical_skills.languages,
      ),
      programming: fallbackArray<string>(
        translated.technical_skills?.programming,
        base.technical_skills.programming,
      ),
      ai_ml: fallbackArray<string>(
        translated.technical_skills?.ai_ml,
        base.technical_skills.ai_ml,
      ),
      systems_and_infra: fallbackArray<string>(
        translated.technical_skills?.systems_and_infra,
        base.technical_skills.systems_and_infra,
      ),
      web: fallbackArray<string>(
        translated.technical_skills?.web,
        base.technical_skills.web,
      ),
    },
    skills: fallbackArray<string>(translated.skills, base.skills),
    passions: fallbackArray<string>(translated.passions, base.passions),
  };
};

export const resumeLabels: Record<ResumeLocale, ResumeLabels> = {
  en: {
    exportPdf: "Export PDF",
    exporting: "Exporting...",
    language: "Language",
    english: "English",
    french: "French",
    experience: "Experience",
    technicalSkills: "Technical Skills",
    programming: "Programming",
    aiMl: "AI / ML",
    systemsAndInfra: "Systems & Infra",
    web: "Web",
    contact: "Contact",
    education: "Education",
    languages: "Languages",
    certifications: "Certifications",
    coreSkills: "Core Skills",
    passions: "Passions",
    interests: "Interests",
    current: "Current",
  },
  fr: {
    exportPdf: "Exporter en PDF",
    exporting: "Export en cours...",
    language: "Langue",
    english: "Anglais",
    french: "Français",
    experience: "Expériences",
    technicalSkills: "Compétences techniques",
    programming: "Programmation",
    aiMl: "IA / ML",
    systemsAndInfra: "Systèmes et infra",
    web: "Web",
    contact: "Contact",
    education: "Formation",
    languages: "Langues",
    certifications: "Certifications",
    coreSkills: "Compétences clés",
    passions: "Passions",
    interests: "Centres d'intérêt",
    current: "Actuel",
  },
};

export const getResumePdfFilename = (locale: ResumeLocale): string =>
  locale === "fr"
    ? "mathis_lambert_cv_fr.pdf"
    : "mathis_lambert_resume_en.pdf";
