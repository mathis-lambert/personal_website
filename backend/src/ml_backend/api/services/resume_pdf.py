from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

from fpdf import FPDF


DATA_PATH = (
    Path(__file__).resolve().parents[3]
    / "ml_backend"
    / "databases"
    / "data"
    / "resume.json"
)


@dataclass
class Contact:
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    website: Optional[str] = None


@dataclass
class Experience:
    role: str
    company: str
    period: Optional[str] = None
    location: Optional[str] = None
    current: Optional[bool] = None
    highlight: Optional[bool] = None
    hide: Optional[bool] = None
    description: Optional[List[str]] = None


@dataclass
class Education:
    institution: str
    degree: Optional[str] = None
    description: Optional[str] = None
    period: Optional[str] = None


@dataclass
class Certification:
    provider: Optional[str] = None
    title: str = ""
    description: Optional[str] = None
    issued_date: Optional[str] = None
    status: Optional[str] = None


@dataclass
class TechnicalSkills:
    languages: List[str]
    ai_ml: List[str]
    systems_and_infra: List[str]
    web: List[str]


@dataclass
class ResumeModel:
    name: str
    contact: Contact
    experiences: List[Experience]
    education: List[Education]
    certifications: List[Certification]
    technical_skills: TechnicalSkills
    skills: List[str]
    passions: List[str]

    @staticmethod
    def from_dict(d: Dict[str, Any]) -> "ResumeModel":
        contact = Contact(**d.get("contact", {}))
        experiences = [Experience(**e) for e in d.get("experiences", [])]
        education = [Education(**e) for e in d.get("education", [])]
        certs = [Certification(**c) for c in d.get("certifications", [])]
        tech = TechnicalSkills(**d.get("technical_skills", {
            "languages": [],
            "ai_ml": [],
            "systems_and_infra": [],
            "web": [],
        }))
        return ResumeModel(
            name=d.get("name", ""),
            contact=contact,
            experiences=experiences,
            education=education,
            certifications=certs,
            technical_skills=tech,
            skills=d.get("skills", []),
            passions=d.get("passions", []),
        )


def load_resume_from_file(path: Path = DATA_PATH) -> ResumeModel:
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    # File format is a list with a single resume entry
    obj = data[0] if isinstance(data, list) and data else data
    return ResumeModel.from_dict(obj)


class SimplePDF(FPDF):
    def __init__(self):
        super().__init__(orientation="P", unit="mm", format="A4")
        self.set_auto_page_break(auto=True, margin=12)
        self.add_page()
        self.set_margins(12, 12, 12)
        self.alias_nb_pages()

    # Core fonts only (no external files)
    def header(self):  # Keep minimal header/footer for a clean look
        pass

    def footer(self):
        self.set_y(-10)
        self.set_font("Helvetica", size=8)
        self.set_text_color(140)
        self.cell(0, 8, f"Page {self.page_no()}/{{nb}}", align="C")


class ResumePDFExporter:
    """Builds a clean, single-page resume PDF from resume data."""

    def __init__(self, resume: ResumeModel):
        self.resume = resume
        self.pdf = SimplePDF()

    # --- text safety helpers ---
    @staticmethod
    def _sanitize(text: Optional[str]) -> str:
        if text is None:
            return ""
        mapping = {
            ord("—"): "-",  # em dash
            ord("–"): "-",  # en dash
            ord("•"): "-",  # bullet
            ord("’"): "'",  # right single quote
            ord("‘"): "'",  # left single quote
            ord("“"): '"',  # left double quote
            ord("”"): '"',  # right double quote
            ord("…"): "...",  # ellipsis
            0x00A0: " ",  # nbsp -> space
        }
        s = str(text).translate(mapping)
        # Ensure final string is latin-1 encodable (fallback replace)
        try:
            s.encode("latin-1")
            return s
        except UnicodeEncodeError:
            return s.encode("latin-1", errors="replace").decode("latin-1")

    # --- style helpers ---
    def _h1(self, text: str):
        self.pdf.set_text_color(0)
        self.pdf.set_font("Helvetica", style="B", size=20)
        self.pdf.cell(0, 10, txt=self._sanitize(text), ln=1)

    def _h2(self, text: str):
        self.pdf.ln(1)
        self.pdf.set_text_color(30, 30, 30)
        self.pdf.set_font("Helvetica", style="B", size=12)
        self.pdf.cell(0, 7, txt=self._sanitize(text.upper()), ln=1)
        # subtle divider
        x = self.pdf.l_margin
        y = self.pdf.get_y()
        self.pdf.set_draw_color(200, 200, 200)
        self.pdf.set_line_width(0.2)
        self.pdf.line(x, y, self.pdf.w - self.pdf.r_margin, y)
        self.pdf.ln(2)

    def _small(self, text: str, bold: bool = False):
        self.pdf.set_text_color(50, 50, 50)
        self.pdf.set_font("Helvetica", style="B" if bold else "", size=9)
        self.pdf.cell(0, 5, txt=self._sanitize(text), ln=1)

    def _para(self, text: str, size: int = 10):
        self.pdf.set_text_color(40)
        self.pdf.set_font("Helvetica", size=size)
        self.pdf.multi_cell(0, 5, txt=self._sanitize(text))

    def _bullets(self, items: Iterable[str], max_items: Optional[int] = None):
        cnt = 0
        for it in items:
            if max_items is not None and cnt >= max_items:
                break
            self.pdf.set_font("Helvetica", size=9)
            # ASCII-friendly bullet replacement
            self.pdf.cell(3, 5, "-")
            # Constrain each bullet to a short paragraph
            self.pdf.multi_cell(0, 5, self._sanitize(it))
            cnt += 1

    # --- layout blocks ---
    def _header_block(self):
        name = self.resume.name or ""
        c = self.resume.contact
        self._h1(name)

        line_parts: List[str] = []
        if c.email:
            line_parts.append(c.email)
        if c.phone:
            line_parts.append(c.phone)
        if c.linkedin:
            line_parts.append(f"LinkedIn: {c.linkedin}")
        if c.github:
            line_parts.append(f"GitHub: {c.github}")
        if c.website:
            line_parts.append(c.website)
        contact_line = "  |  ".join(line_parts)
        self._small(contact_line)

    def _experiences_block(self):
        if not self.resume.experiences:
            return
        self._h2("Experience")
        # Keep content succinct for single page
        shown = 0
        for exp in self.resume.experiences:
            if exp.hide:
                continue
            title = exp.role
            company = exp.company
            meta = " | ".join(
                [x for x in [exp.period, exp.location] if x]
            )
            # role @ company
            self.pdf.set_font("Helvetica", style="B", size=11)
            self.pdf.set_text_color(20)
            self.pdf.cell(0, 6, self._sanitize(f"{title} - {company}"), ln=1)
            if meta:
                self.pdf.set_font("Helvetica", size=9)
                self.pdf.set_text_color(90)
                self.pdf.cell(0, 5, self._sanitize(meta), ln=1)
            if exp.description:
                # For the first highlighted/current exp, allow up to 4 bullets; others 2
                max_bullets = 4 if (exp.highlight or exp.current) else 2
                self._bullets(exp.description, max_items=max_bullets)
            self.pdf.ln(1)
            shown += 1
            if shown >= 3:  # constrain experiences to keep 1 page target
                break

    def _education_block(self):
        if not self.resume.education:
            return
        self._h2("Education")
        for edu in self.resume.education[:3]:
            title = edu.degree or ""
            institution = edu.institution
            line = f"{institution} - {title}" if title else institution
            self.pdf.set_font("Helvetica", style="B", size=10)
            self.pdf.set_text_color(25)
            self.pdf.cell(0, 5, self._sanitize(line), ln=1)
            if edu.description:
                self.pdf.set_font("Helvetica", size=9)
                self.pdf.set_text_color(80)
                self.pdf.multi_cell(0, 4.5, self._sanitize(edu.description))
            if edu.period:
                self.pdf.set_font("Helvetica", size=9)
                self.pdf.set_text_color(100)
                self.pdf.cell(0, 4.5, self._sanitize(edu.period), ln=1)
            self.pdf.ln(1)

    def _skills_block(self):
        self._h2("Skills")
        t = self.resume.technical_skills
        # Compact layout: label followed by inline items
        def row(label: str, items: List[str]):
            if not items:
                return
            self.pdf.set_font("Helvetica", style="B", size=10)
            self.pdf.set_text_color(30)
            self.pdf.cell(0, 5, self._sanitize(f"{label}: "), ln=1)
            self.pdf.set_font("Helvetica", size=10)
            self.pdf.set_text_color(50)
            self.pdf.multi_cell(0, 5, self._sanitize(", ".join(items)))
        row("Languages", t.languages)
        row("AI/ML", t.ai_ml)
        row("Systems & Infra", t.systems_and_infra)
        row("Web", t.web)

        if self.resume.skills:
            self.pdf.set_font("Helvetica", style="B", size=10)
            self.pdf.set_text_color(30)
            self.pdf.cell(0, 5, "Core", ln=1)
            self.pdf.set_font("Helvetica", size=10)
            self.pdf.set_text_color(50)
            self.pdf.multi_cell(0, 5, ", ".join(self.resume.skills[:12]))

    def _certs_block(self):
        if not self.resume.certifications:
            return
        self._h2("Certifications")
        for cert in self.resume.certifications[:3]:
            title = cert.title
            ctx: List[str] = []
            if cert.provider:
                ctx.append(cert.provider)
            if cert.issued_date:
                ctx.append(cert.issued_date)
            if cert.status and cert.status != "issued":
                ctx.append(cert.status)
            meta = " | ".join(ctx)

            self.pdf.set_font("Helvetica", style="B", size=10)
            self.pdf.set_text_color(25)
            self.pdf.cell(0, 5, self._sanitize(title), ln=1)
            if meta:
                self.pdf.set_font("Helvetica", size=9)
                self.pdf.set_text_color(90)
                self.pdf.cell(0, 4.5, self._sanitize(meta), ln=1)
            self.pdf.ln(0.5)

    def _passions_block(self):
        if not self.resume.passions:
            return
        self._h2("Interests")
        self.pdf.set_font("Helvetica", size=10)
        self.pdf.set_text_color(50)
        self.pdf.multi_cell(0, 5, self._sanitize(", ".join(self.resume.passions[:10])))

    def build_pdf(self) -> bytes:
        # Compose blocks with a 2-column layout if vertical overflow is likely
        # For simplicity and robustness we keep single column, short content per section.
        self._header_block()
        self.pdf.ln(2)
        self._experiences_block()
        self._education_block()
        self._skills_block()
        self._certs_block()
        self._passions_block()

        return bytes(self.pdf.output(dest="S").encode("latin1"))
