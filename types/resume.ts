export interface Contact {
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  website: string;
}

export interface Experience {
  role: string;
  position?: string;
  company: string;
  logo?: string;
  period: string;
  location: string;
  current?: boolean;
  highlight?: boolean;
  hide?: boolean;
  description: string[];
}

export interface Education {
  institution: string;
  degree: string;
  location?: string;
  description?: string;
  period: string;
}

export interface Certification {
  provider: string;
  title: string;
  issued_date: string | null;
  status: "issued" | "in progress" | "stopped" | "starting";
  description?: string;
}

export interface TechnicalSkills {
  languages: string[];
  programming: string[];
  ai_ml: string[];
  systems_and_infra: string[];
  web: string[];
}

export interface ResumeContent {
  name: string;
  contact: Contact;
  personal_statement: string;
  experiences: Experience[];
  education: Education[];
  certifications: Certification[];
  technical_skills: TechnicalSkills;
  skills: string[];
  passions: string[];
}

interface ResumeTranslations {
  fr?: Partial<ResumeContent>;
}

export interface ResumeData extends ResumeContent {
  translations?: ResumeTranslations;
}
