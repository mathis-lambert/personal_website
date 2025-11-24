import type { ResumeData } from '@/types';
import { fetchWithTimeout, sanitizeUrl } from './utils';

export function normalizeResumeApi(p: ResumeData): ResumeData {
  return {
    name: p.name,
    contact: p.contact,
    personal_statement: p.personal_statement,
    experiences: p.experiences,
    education: p.education,
    technical_skills: p.technical_skills,
    certifications: p.certifications,
    skills: p.skills,
    passions: p.passions,
  };
}

export async function getResume(options?: {
  signal?: AbortSignal;
}): Promise<ResumeData> {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '';
  const res = await fetchWithTimeout(`${apiUrl}/api/resume`, {
    signal: options?.signal,
    timeoutMs: 10000,
  });
  if (!res.ok) {
    throw new Error(`Resumes request failed: ${res.status}`);
  }
  const data = await res.json();
  return normalizeResumeApi(data.resume);
}

export async function exportResumePdf(options?: {
  signal?: AbortSignal;
  timeoutMs?: number;
}): Promise<Blob> {
  const apiUrl = sanitizeUrl(
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '',
  );
  const res = await fetchWithTimeout(`${apiUrl}/api/resume/export`, {
    method: 'GET',
    signal: options?.signal,
    timeoutMs: options?.timeoutMs ?? 20000,
    headers: { Accept: 'application/pdf' },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `Resume PDF export failed: ${res.status}${text ? ` - ${text}` : ''}`,
    );
  }
  return res.blob();
}

export async function downloadResumePdf(options?: {
  filename?: string;
  signal?: AbortSignal;
}): Promise<void> {
  const blob = await exportResumePdf({ signal: options?.signal });
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = options?.filename ?? 'mathis_lambert_resume.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    URL.revokeObjectURL(url);
  }
}
