import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { PDFFont, PDFPage } from "pdf-lib";

import type { ResumeContent } from "@/types/resume";
import {
  createEmptyResumeContent,
  resumeLabels,
  type ResumeLocale,
} from "@/lib/resume/localization";

const A4_WIDTH = 595.28; // points
const A4_HEIGHT = 841.89; // points
const MM_TO_PT = 72 / 25.4;

type RGB = { r: number; g: number; b: number };

type DrawCtx = {
  page: PDFPage;
  y: number; // distance from top, in points
  marginLeft: number;
  marginRight: number;
  contentWidth: number;
  fonts: {
    regular: PDFFont;
    bold: PDFFont;
    italic: PDFFont;
  };
  colors: {
    accent: RGB;
    accentWash: RGB;
    ink: RGB;
    inkMuted: RGB;
    inkFaint: RGB;
    line: RGB;
  };
};

const mm = (value: number) => value * MM_TO_PT;

const toRgb = ({ r, g, b }: RGB) => rgb(r / 255, g / 255, b / 255);

const sanitize = (text?: string | null) => {
  if (!text) return "";
  const mapping: Record<string, string> = {
    "—": "-",
    "–": "-",
    "•": "-",
    "’": "'",
    "‘": "'",
    "“": '"',
    "”": '"',
    "…": "...",
    "\u00a0": " ",
  };

  let result = text
    .split("")
    .map((char) => mapping[char] ?? char)
    .join("");

  // Replace characters that are not representable in latin-1
  result = Array.from(result)
    .map((ch) => (ch.charCodeAt(0) <= 0xff ? ch : "?"))
    .join("");

  return result;
};

const wrapText = (
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(candidate, size);
    if (width <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines;
};

type TextOptions = {
  size?: number;
  font?: PDFFont;
  color?: RGB;
  lineHeight?: number;
  maxWidth?: number;
  xOffset?: number;
};

const drawTextBlock = (
  ctx: DrawCtx,
  text: string,
  opts: TextOptions = {},
): number => {
  const size = opts.size ?? 10;
  const font = opts.font ?? ctx.fonts.regular;
  const color = toRgb(opts.color ?? { r: 0, g: 0, b: 0 });
  const lineHeight = opts.lineHeight ?? size * 1.2;
  const xOffset = opts.xOffset ?? 0;
  const maxWidth = opts.maxWidth ?? ctx.contentWidth - xOffset;

  const lines = wrapText(sanitize(text), font, size, maxWidth);
  for (const line of lines) {
    const y = ctx.page.getHeight() - ctx.y - size;
    ctx.page.drawText(line, {
      x: ctx.marginLeft + xOffset,
      y,
      size,
      font,
      color,
    });
    ctx.y += lineHeight;
  }
  return lines.length;
};

const moveCursorMm = (ctx: DrawCtx, deltaMm: number) => {
  ctx.y += mm(deltaMm);
};

/** The name, set in ink like the on-screen masthead. */
const h1 = (ctx: DrawCtx, text: string) => {
  drawTextBlock(ctx, text, {
    size: 22,
    font: ctx.fonts.bold,
    color: ctx.colors.ink,
    lineHeight: mm(10),
  });
};

/**
 * A section head, mirroring the site's block header: a small uppercase label
 * over a hairline, with a short accent lead at the left. The old version put a
 * full-width 0.6mm accent bar under every heading, which turned the page into
 * a stack of coloured stripes.
 */
const h2 = (ctx: DrawCtx, text: string) => {
  moveCursorMm(ctx, 3);
  drawTextBlock(ctx, text.toUpperCase(), {
    size: 8.5,
    font: ctx.fonts.bold,
    color: ctx.colors.ink,
    lineHeight: mm(5),
  });

  const yLine = ctx.page.getHeight() - ctx.y;
  const right = ctx.page.getWidth() - ctx.marginRight;

  ctx.page.drawLine({
    start: { x: ctx.marginLeft, y: yLine },
    end: { x: right, y: yLine },
    thickness: mm(0.2),
    color: toRgb(ctx.colors.line),
  });
  ctx.page.drawLine({
    start: { x: ctx.marginLeft, y: yLine },
    end: { x: ctx.marginLeft + mm(12), y: yLine },
    thickness: mm(0.5),
    color: toRgb(ctx.colors.accent),
  });

  moveCursorMm(ctx, 2.5);
};

const smallText = (ctx: DrawCtx, text: string, bold = false) => {
  drawTextBlock(ctx, text, {
    size: 8,
    font: bold ? ctx.fonts.bold : ctx.fonts.regular,
    color: ctx.colors.inkMuted,
    lineHeight: mm(4.5),
  });
};

const paragraph = (ctx: DrawCtx, text: string, size = 10) => {
  const finalSize = Math.max(8, size - 1);
  drawTextBlock(ctx, text, {
    size: finalSize,
    font: ctx.fonts.regular,
    color: ctx.colors.inkMuted,
    lineHeight: mm(4.8),
  });
};

const bullets = (ctx: DrawCtx, items: string[], maxItems?: number | null) => {
  const effective =
    typeof maxItems === "number" ? items.slice(0, maxItems) : items;
  const indent = mm(4);
  const lineHeight = mm(4.5);
  const textWidth = ctx.contentWidth - indent;

  for (const raw of effective) {
    const text = sanitize(raw);
    const lines = wrapText(text, ctx.fonts.regular, 8, textWidth);
    const yBase = ctx.page.getHeight() - ctx.y - 8;

    // Bullet symbol (first line only)
    ctx.page.drawText("-", {
      x: ctx.marginLeft,
      y: yBase,
      size: 8,
      font: ctx.fonts.regular,
      color: toRgb(ctx.colors.accent),
    });

    lines.forEach((line) => {
      const y = ctx.page.getHeight() - ctx.y - 8;
      ctx.page.drawText(line, {
        x: ctx.marginLeft + indent,
        y,
        size: 8,
        font: ctx.fonts.regular,
        color: toRgb(ctx.colors.ink),
      });
      ctx.y += lineHeight;
    });
    if (lines.length === 0) {
      ctx.y += lineHeight;
    }
  }
};

const headerBlock = (ctx: DrawCtx, data: ResumeContent) => {
  h1(ctx, data.name || "");

  const sep = "  ·  ";
  const pieces: string[] = [];
  if (data.contact?.email) pieces.push(data.contact.email);
  if (data.contact?.phone) pieces.push(data.contact.phone);
  if (data.contact?.linkedin) pieces.push(`LinkedIn: ${data.contact.linkedin}`);
  if (data.contact?.github) pieces.push(`GitHub: ${data.contact.github}`);
  if (data.contact?.website) {
    const label = data.contact.website
      .replace("https://", "")
      .replace("http://", "")
      .replace(/\/$/, "");
    pieces.push(label);
  }

  if (pieces.length) {
    smallText(ctx, pieces.join(sep));
    moveCursorMm(ctx, 6);
  }
};

const personalStatementBlock = (ctx: DrawCtx, data: ResumeContent) => {
  if (!data.personal_statement) return;
  paragraph(ctx, data.personal_statement, 9);
  moveCursorMm(ctx, 1);
};

const educationBlock = (
  ctx: DrawCtx,
  data: ResumeContent,
  locale: ResumeLocale,
) => {
  if (!data.education?.length) return;
  h2(ctx, resumeLabels[locale].education);

  data.education.slice(0, 3).forEach((edu) => {
    const degreeLine = edu.degree || edu.institution;
    if (degreeLine) {
      drawTextBlock(ctx, degreeLine, {
        size: 10,
        font: ctx.fonts.bold,
        color: ctx.colors.ink,
        lineHeight: mm(4.8),
      });
    }

    const details = [edu.institution, edu.location, edu.period]
      .filter(Boolean)
      .join(" · ");
    if (details) {
      drawTextBlock(ctx, details, {
        size: 8.5,
        font: ctx.fonts.regular,
        color: ctx.colors.inkMuted,
        lineHeight: mm(4.2),
      });
    }

    if (edu.description) {
      drawTextBlock(ctx, edu.description, {
        size: 8,
        font: ctx.fonts.regular,
        color: ctx.colors.inkFaint,
        lineHeight: mm(4.5),
      });
    }

    moveCursorMm(ctx, 1);
  });
};

const experiencesBlock = (
  ctx: DrawCtx,
  data: ResumeContent,
  locale: ResumeLocale,
) => {
  if (!data.experiences?.length) return;
  h2(ctx, resumeLabels[locale].experience);

  let shown = 0;
  for (const exp of data.experiences) {
    if (exp.hide) continue;
    const title = exp.role || "";
    const company = exp.company || "";
    const position = exp.position || "";
    const metaParts = [exp.period, exp.location].filter(Boolean);
    const meta = metaParts.join(" • ");

    drawTextBlock(ctx, title, {
      size: 10,
      font: ctx.fonts.bold,
      color: ctx.colors.ink,
      lineHeight: mm(5),
    });

    drawTextBlock(ctx, `${company}${position ? ` • ${position}` : ""}`, {
      size: 9,
      font: ctx.fonts.italic,
      color: ctx.colors.inkMuted,
      lineHeight: mm(4.5),
    });

    if (meta) {
      drawTextBlock(ctx, meta, {
        size: 8,
        font: ctx.fonts.regular,
        color: ctx.colors.inkFaint,
        lineHeight: mm(4.5),
      });
    }

    if (exp.description?.length) {
      const maxBullets = exp.highlight || exp.current ? 6 : 4;
      bullets(ctx, exp.description, maxBullets);
    }

    moveCursorMm(ctx, 1);
    shown += 1;
    if (shown >= 3) break;
  }
};

const skillsBlock = (
  ctx: DrawCtx,
  data: ResumeContent,
  locale: ResumeLocale,
) => {
  h2(ctx, resumeLabels[locale].technicalSkills);
  const t = data.technical_skills;
  const rows: Array<[string, string[]]> = [
    [resumeLabels[locale].programming, t?.programming ?? []],
    [resumeLabels[locale].aiMl, t?.ai_ml ?? []],
    [resumeLabels[locale].systemsAndInfra, t?.systems_and_infra ?? []],
    [resumeLabels[locale].web, t?.web ?? []],
    [resumeLabels[locale].languages, t?.languages ?? []],
  ];

  const labels: string[] = rows
    .filter(([, items]) => items?.length)
    .map(([label]) => `${label}: `);
  if (data.skills?.length) labels.push(`${resumeLabels[locale].coreSkills}: `);

  let labelColWidth = 0;
  labels.forEach((label) => {
    const width = ctx.fonts.bold.widthOfTextAtSize(sanitize(label), 10);
    labelColWidth = Math.max(labelColWidth, width);
  });
  labelColWidth += mm(2);

  const itemsWidth = Math.max(10, ctx.contentWidth - labelColWidth);
  const lineHeight = mm(4.8);

  const row = (label: string, items: string[]) => {
    if (!items?.length) return;
    // Label
    ctx.page.drawText(sanitize(`${label}: `), {
      x: ctx.marginLeft,
      y: ctx.page.getHeight() - ctx.y - 10,
      size: 10,
      font: ctx.fonts.bold,
      color: toRgb(ctx.colors.ink),
    });

    const text = sanitize(items.join(", "));
    const lines = wrapText(text, ctx.fonts.regular, 8, itemsWidth);
    for (const line of lines) {
      const y = ctx.page.getHeight() - ctx.y - 8;
      ctx.page.drawText(line, {
        x: ctx.marginLeft + labelColWidth,
        y,
        size: 8,
        font: ctx.fonts.regular,
        color: toRgb(ctx.colors.inkMuted),
      });
      ctx.y += lineHeight;
    }
    if (!lines.length) ctx.y += lineHeight;
  };

  rows.forEach(([label, items]) => row(label, items));
  if (data.skills?.length) {
    row(resumeLabels[locale].coreSkills, data.skills.slice(0, 12));
  }
};

const certificationsBlock = (
  ctx: DrawCtx,
  data: ResumeContent,
  locale: ResumeLocale,
) => {
  if (!data.certifications?.length) return;
  h2(ctx, resumeLabels[locale].certifications);

  data.certifications.slice(0, 3).forEach((cert) => {
    const metaParts: string[] = [];
    if (cert.provider) metaParts.push(cert.provider);
    if (cert.issued_date) metaParts.push(cert.issued_date);
    if (cert.status && cert.status !== "issued") metaParts.push(cert.status);
    const meta = metaParts.join(" | ");

    drawTextBlock(ctx, cert.title, {
      size: 10,
      font: ctx.fonts.bold,
      color: ctx.colors.ink,
      lineHeight: mm(4.5),
    });
    if (meta) {
      drawTextBlock(ctx, meta, {
        size: 7,
        font: ctx.fonts.regular,
        color: ctx.colors.inkFaint,
        lineHeight: mm(4.5),
      });
    }

    moveCursorMm(ctx, 0.5);
  });
};

const passionsBlock = (
  ctx: DrawCtx,
  data: ResumeContent,
  locale: ResumeLocale,
) => {
  if (!data.passions?.length) return;
  h2(ctx, resumeLabels[locale].interests);
  drawTextBlock(ctx, data.passions.slice(0, 10).join(", "), {
    size: 10,
    font: ctx.fonts.regular,
    color: ctx.colors.inkMuted,
    lineHeight: mm(4.8),
  });
};

export async function buildResumePdf(
  resume: ResumeContent | null,
  locale: ResumeLocale = "en",
) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([A4_WIDTH, A4_HEIGHT]);

  const [regular, bold, italic] = await Promise.all([
    pdf.embedFont(StandardFonts.Helvetica),
    pdf.embedFont(StandardFonts.HelveticaBold),
    pdf.embedFont(StandardFonts.HelveticaOblique),
  ]);

  const margin = mm(10);
  const ctx: DrawCtx = {
    page,
    y: margin,
    marginLeft: margin,
    marginRight: margin,
    contentWidth: page.getWidth() - 2 * margin,
    fonts: { regular, bold, italic },
    // Straight from the site tokens: --ink-azure and the ink ramp, gamut
    // mapped from OKLCH to sRGB so screen and paper agree.
    colors: {
      accent: { r: 0, g: 115, b: 198 },
      accentWash: { r: 218, g: 238, b: 255 },
      ink: { r: 14, g: 26, b: 40 },
      inkMuted: { r: 78, g: 90, b: 103 },
      inkFaint: { r: 125, g: 136, b: 148 },
      line: { r: 200, g: 209, b: 216 },
    },
  };

  const data: ResumeContent = resume ?? {
    ...createEmptyResumeContent(),
    name: "Mathis Lambert",
    personal_statement:
      locale === "fr" ? "CV indisponible." : "Resume data not available.",
  };

  headerBlock(ctx, data);
  personalStatementBlock(ctx, data);
  educationBlock(ctx, data, locale);
  experiencesBlock(ctx, data, locale);
  skillsBlock(ctx, data, locale);
  certificationsBlock(ctx, data, locale);
  passionsBlock(ctx, data, locale);

  return pdf.save();
}
