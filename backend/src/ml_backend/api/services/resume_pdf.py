from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

from fpdf import FPDF
from fpdf.enums import XPos, YPos


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
        # Slightly larger margins to avoid right overflow and improve readability
        self.set_margins(15, 14, 15)
        self.set_auto_page_break(auto=True, margin=14)
        self.add_page()
        self.alias_nb_pages()
        # Accent palette (soft modern blue)
        self.accent = (64, 105, 255)
        self.accent_light = (232, 238, 255)
        self.gray = (40, 40, 40)

    # Core fonts only (no external files)
    def header(self):  # Keep minimal header/footer for a clean look
        pass

    def footer(self):
        # No footer; keep page clean (no page x/y)
        pass


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
        # Clean header without background; accent title only
        self.pdf.set_text_color(*self.pdf.accent)
        self.pdf.set_font("Helvetica", style="B", size=20)
        self.pdf.cell(0, 10, text=self._sanitize(text), new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def _h2(self, text: str):
        self.pdf.ln(1)
        # Section title with accent underline
        self.pdf.set_text_color(*self.pdf.gray)
        self.pdf.set_font("Helvetica", style="B", size=11)
        title = self._sanitize(text.upper())
        self.pdf.cell(0, 7, text=title, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        # Accent divider
        x = self.pdf.l_margin
        y = self.pdf.get_y()
        self.pdf.set_draw_color(*self.pdf.accent)
        self.pdf.set_line_width(0.6)
        self.pdf.line(x, y, self.pdf.w - self.pdf.r_margin, y)
        self.pdf.ln(2)

    def _small(self, text: str, bold: bool = False):
        self.pdf.set_text_color(60, 60, 60)
        self.pdf.set_font("Helvetica", style="B" if bold else "", size=8)
        # Use multi_cell so long lines never overflow to the right
        self.pdf.set_x(self.pdf.l_margin)
        epw = getattr(self.pdf, "epw", self.pdf.w - self.pdf.l_margin - self.pdf.r_margin)
        self.pdf.multi_cell(epw, 4.5, text=self._sanitize(text))

    def _para(self, text: str, size: int = 10):
        self.pdf.set_text_color(40)
        # Slightly reduced base paragraph size for denser layout
        self.pdf.set_font("Helvetica", size=max(8, size - 1))
        self.pdf.set_x(self.pdf.l_margin)
        epw = getattr(self.pdf, "epw", self.pdf.w - self.pdf.l_margin - self.pdf.r_margin)
        self.pdf.multi_cell(epw, 4.8, text=self._sanitize(text))

    def _bullets(self, items: Iterable[str], max_items: Optional[int] = None):
        cnt = 0
        # Use effective page width for reliability
        content_width = getattr(self.pdf, "epw", self.pdf.w - self.pdf.l_margin - self.pdf.r_margin)
        indent = 4  # mm indent after bullet symbol
        for it in items:
            if max_items is not None and cnt >= max_items:
                break
            self.pdf.set_font("Helvetica", size=8)
            # Always start bullet line from left margin
            self.pdf.set_x(self.pdf.l_margin)
            # Subtle accent bullet and improved spacing
            self.pdf.set_text_color(*self.pdf.accent)
            self.pdf.cell(indent, 4.5, "-")
            # Now write the text in a fixed width block
            self.pdf.set_x(self.pdf.l_margin + indent)
            self.pdf.set_text_color(35)
            safe_text = self._sanitize(it)
            self.pdf.multi_cell(content_width - indent, 4.5, safe_text)
            cnt += 1
        # Reset default text color
        self.pdf.set_text_color(0)

    def _tags(self, items: Iterable[str], max_items: Optional[int] = None, left_pad: float = 0.0):
        """Render tag-like pills for a modern skills/interests look."""
        items_iter = list(items)
        if max_items is not None:
            items_iter = items_iter[:max_items]

        epw = getattr(self.pdf, "epw", self.pdf.w - self.pdf.l_margin - self.pdf.r_margin)
        avail_w = max(10.0, epw - left_pad)
        x0 = self.pdf.l_margin + left_pad
        y0 = self.pdf.get_y()
        x = x0
        y = y0
        h = 5.0
        hpad = 2.2
        vpad = 1.6
        gap = 1.8

        self.pdf.set_font("Helvetica", size=8)
        self.pdf.set_draw_color(255)  # borderless
        for raw in items_iter:
            label = self._sanitize(raw)
            w_text = self.pdf.get_string_width(label)
            w = min(avail_w, w_text + 2 * hpad + 1)
            if x + w > x0 + avail_w:
                # new line
                x = x0
                y += h + vpad
            self.pdf.set_xy(x, y)
            self.pdf.set_fill_color(*self.pdf.accent_light)
            self.pdf.set_text_color(55)
            self.pdf.cell(w, h, label, border=0, align="L", fill=True)
            x = x + w + gap

        # Move cursor to the next line after the last row of tags
        self.pdf.set_y(y + h + 1.2)
        self.pdf.set_x(self.pdf.l_margin)

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
        # Use a modern middle-dot separator (latin-1 safe)
        contact_line = "  ·  ".join(line_parts)
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
            # Role
            self.pdf.set_font("Helvetica", style="B", size=10)
            self.pdf.set_text_color(15)
            epw = getattr(self.pdf, "epw", self.pdf.w - self.pdf.l_margin - self.pdf.r_margin)
            self.pdf.set_x(self.pdf.l_margin)
            self.pdf.multi_cell(epw, 5.0, text=self._sanitize(title))
            # Company
            self.pdf.set_font("Helvetica", style="I", size=9)
            self.pdf.set_text_color(70)
            self.pdf.set_x(self.pdf.l_margin)
            self.pdf.multi_cell(epw, 4.5, text=self._sanitize(company))
            if meta:
                self.pdf.set_font("Helvetica", size=8)
                self.pdf.set_text_color(90)
                self.pdf.set_x(self.pdf.l_margin)
                self.pdf.multi_cell(epw, 4.5, text=self._sanitize(meta))
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
            self.pdf.set_font("Helvetica", style="B", size=9)
            self.pdf.set_text_color(25)
            epw = getattr(self.pdf, "epw", self.pdf.w - self.pdf.l_margin - self.pdf.r_margin)
            self.pdf.set_x(self.pdf.l_margin)
            self.pdf.multi_cell(epw, 4.8, text=self._sanitize(line))
            if edu.description:
                self.pdf.set_font("Helvetica", size=8)
                self.pdf.set_text_color(80)
                self.pdf.set_x(self.pdf.l_margin)
                self.pdf.multi_cell(epw, 4.5, text=self._sanitize(edu.description))
            if edu.period:
                self.pdf.set_font("Helvetica", size=8)
                self.pdf.set_text_color(100)
                self.pdf.set_x(self.pdf.l_margin)
                self.pdf.multi_cell(epw, 4.5, text=self._sanitize(edu.period))
            self.pdf.ln(1)

    def _skills_block(self):
        self._h2("Skills")
        t = self.resume.technical_skills
        rows: List[tuple[str, List[str]]] = [
            ("Languages", t.languages),
            ("AI/ML", t.ai_ml),
            ("Systems & Infra", t.systems_and_infra),
            ("Web", t.web),
        ]
        # Compute label column width for clean "skill_name: list" layout
        self.pdf.set_font("Helvetica", style="B", size=9)
        labels_sanitized = [self._sanitize(f"{lbl}: ") for lbl, items in rows if items]
        if self.resume.skills:
            labels_sanitized.append(self._sanitize("Core: "))
        label_col_w = 0
        for txt in labels_sanitized:
            label_col_w = max(label_col_w, self.pdf.get_string_width(txt))
        label_col_w += 2

        epw = getattr(self.pdf, "epw", self.pdf.w - self.pdf.l_margin - self.pdf.r_margin)
        items_w = max(10, epw - label_col_w)

        def row(label: str, items: List[str]):
            if not items:
                return
            self.pdf.set_x(self.pdf.l_margin)
            # bold label
            self.pdf.set_font("Helvetica", style="B", size=9)
            self.pdf.set_text_color(30)
            self.pdf.cell(label_col_w, 4.8, text=self._sanitize(f"{label}: "))
            # values
            self.pdf.set_font("Helvetica", size=9)
            self.pdf.set_text_color(50)
            self.pdf.set_x(self.pdf.l_margin + label_col_w)
            self.pdf.multi_cell(items_w, 4.8, text=self._sanitize(", ".join(items)))

        for lbl, it in rows:
            row(lbl, it)

        if self.resume.skills:
            row("Core", self.resume.skills[:12])

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

            self.pdf.set_font("Helvetica", style="B", size=9)
            self.pdf.set_text_color(25)
            epw = getattr(self.pdf, "epw", self.pdf.w - self.pdf.l_margin - self.pdf.r_margin)
            self.pdf.set_x(self.pdf.l_margin)
            self.pdf.multi_cell(epw, 4.8, text=self._sanitize(title))
            if meta:
                self.pdf.set_font("Helvetica", size=8)
                self.pdf.set_text_color(90)
                self.pdf.set_x(self.pdf.l_margin)
                self.pdf.multi_cell(epw, 4.5, text=self._sanitize(meta))
            self.pdf.ln(0.5)

    def _passions_block(self):
        if not self.resume.passions:
            return
        self._h2("Interests")
        # Simple inline list (no backgrounds)
        self.pdf.set_font("Helvetica", size=9)
        self.pdf.set_text_color(50)
        epw = getattr(self.pdf, "epw", self.pdf.w - self.pdf.l_margin - self.pdf.r_margin)
        self.pdf.set_x(self.pdf.l_margin)
        self.pdf.multi_cell(epw, 4.8, text=self._sanitize(", ".join(self.resume.passions[:10])))

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

        # Return raw bytes directly to avoid any encoding surprises
        out = self.pdf.output()
        return bytes(out)
