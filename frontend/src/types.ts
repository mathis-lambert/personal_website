import { LucideIcon } from 'lucide-react';

export interface Contact {
  email: string;
  phone: string;
  linkedin: string;
  website: string;
}

export interface Experience {
  role: string;
  company: string;
  period: string;
  location: string;
  isCurrent?: boolean;
  highlight?: boolean;
  description: string[];
}

export interface Education {
  institution: string;
  degree: string;
  period: string;
}

export interface ResumeData {
  name: string;
  contact: Contact;
  summary: string;
  experiences: Experience[];
  education: Education[];
  technologies: string[];
  skills: string[];
  passions: string[];
}

export interface IsLoadingState {
  summary: boolean;
  experience: boolean;
  coverLetter: boolean;
  funFact: boolean;
  pdf: boolean;
}

export interface SectionProps {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  delay?: number;
}
