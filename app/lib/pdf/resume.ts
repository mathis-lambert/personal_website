import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import type { ResumeData } from "@/types";

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

type DrawCtx = {
  y: number;
  page: ReturnType<PDFDocument["addPage"]>;
  fonts: {
    regular: any;
    bold: any;
  };
};

const drawLine = (
  ctx: DrawCtx,
  text: string,
  opts?: {
    size?: number;
    bold?: boolean;
    color?: { r: number; g: number; b: number };
  },
) => {
  const size = opts?.size ?? 11;
  const font = opts?.bold ? ctx.fonts.bold : ctx.fonts.regular;
  const color = opts?.color
    ? rgb(opts.color.r, opts.color.g, opts.color.b)
    : rgb(0, 0, 0);
  ctx.page.drawText(text, {
    x: 50,
    y: ctx.y,
    size,
    font,
    color,
  });
  ctx.y -= size + 4;
};

const section = (ctx: DrawCtx, title: string) => {
  drawLine(ctx, title.toUpperCase(), {
    bold: true,
    size: 12,
    color: { r: 0.1, g: 0.2, b: 0.55 },
  });
  ctx.y -= 4;
};

export async function buildResumePdf(resume: ResumeData | null) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([A4_WIDTH, A4_HEIGHT]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const ctx: DrawCtx = { page, y: A4_HEIGHT - 60, fonts: { regular, bold } };

  const data =
    resume ||
    ({
      name: "Mathis Lambert",
      contact: {
        email: "",
        phone: "",
        linkedin: "",
        github: "",
        website: "",
      },
      personal_statement: "Resume data not available.",
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
    } as ResumeData);

  drawLine(ctx, data.name || "Resume", { size: 20, bold: true });

  const contactPieces = [
    data.contact?.email && `Email: ${data.contact.email}`,
    data.contact?.phone && `Phone: ${data.contact.phone}`,
    data.contact?.linkedin && `LinkedIn: ${data.contact.linkedin}`,
    data.contact?.github && `GitHub: ${data.contact.github}`,
    data.contact?.website && `Website: ${data.contact.website}`,
  ].filter(Boolean) as string[];

  if (contactPieces.length) {
    drawLine(ctx, contactPieces.join("  •  "), { size: 9 });
    ctx.y -= 6;
  }

  if (data.personal_statement) {
    section(ctx, "Summary");
    drawLine(ctx, data.personal_statement, { size: 10 });
    ctx.y -= 6;
  }

  if (data.experiences?.length) {
    section(ctx, "Experience");
    data.experiences.slice(0, 4).forEach((exp) => {
      drawLine(ctx, `${exp.role} — ${exp.company}`, { bold: true, size: 11 });
      if (exp.period || exp.location) {
        drawLine(ctx, [exp.period, exp.location].filter(Boolean).join(" • "), {
          size: 9,
        });
      }
      exp.description
        ?.slice(0, 3)
        .forEach((line) => drawLine(ctx, `• ${line}`, { size: 9 }));
      ctx.y -= 4;
    });
  }

  if (data.education?.length) {
    section(ctx, "Education");
    data.education.slice(0, 3).forEach((edu) => {
      drawLine(ctx, edu.degree || edu.institution, { bold: true, size: 11 });
      drawLine(
        ctx,
        [edu.institution, edu.location, edu.period].filter(Boolean).join(" • "),
        { size: 9 },
      );
      if (edu.description) drawLine(ctx, edu.description, { size: 9 });
      ctx.y -= 4;
    });
  }

  const skills = data.skills ?? [];
  const tech = data.technical_skills;
  const techLines: string[] = [];
  if (tech) {
    techLines.push(
      ["Languages", tech.languages?.join(", ")].filter(Boolean).join(": "),
    );
    techLines.push(
      ["Programming", tech.programming?.join(", ")].filter(Boolean).join(": "),
    );
    techLines.push(
      ["AI/ML", tech.ai_ml?.join(", ")].filter(Boolean).join(": "),
    );
    techLines.push(
      ["Systems & Infra", tech.systems_and_infra?.join(", ")]
        .filter(Boolean)
        .join(": "),
    );
    techLines.push(["Web", tech.web?.join(", ")].filter(Boolean).join(": "));
  }

  if (skills.length || techLines.some(Boolean)) {
    section(ctx, "Skills");
    if (skills.length) drawLine(ctx, skills.join(", "), { size: 9 });
    techLines
      .filter(Boolean)
      .forEach((line) => drawLine(ctx, line, { size: 9 }));
    ctx.y -= 4;
  }

  if (data.certifications?.length) {
    section(ctx, "Certifications");
    data.certifications.slice(0, 4).forEach((cert) => {
      drawLine(ctx, cert.title, { bold: true, size: 10 });
      const meta = [cert.provider, cert.issued_date, cert.status]
        .filter(Boolean)
        .join(" • ");
      if (meta) drawLine(ctx, meta, { size: 9 });
      if (cert.description) drawLine(ctx, cert.description, { size: 9 });
      ctx.y -= 2;
    });
  }

  if (data.passions?.length) {
    section(ctx, "Passions");
    drawLine(ctx, data.passions.join(", "), { size: 9 });
  }

  const pdfBytes = await pdf.save();
  return pdfBytes;
}
