"use client";
import React, { useEffect, useState } from "react";
import { useAdminAuth } from "@/admin/providers/AdminAuthProvider";
import { getCollectionData, updateItem } from "@/api/admin";
import type {
  ResumeData,
  Contact,
  TechnicalSkills,
  Experience,
  Education,
  Certification,
} from "@/types";
import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

const ResumePage: React.FC = () => {
  const { token } = useAdminAuth();
  const [data, setData] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingTech, setSavingTech] = useState(false);
  const [savingExp, setSavingExp] = useState(false);
  const [savingEdu, setSavingEdu] = useState(false);
  const [savingCerts, setSavingCerts] = useState(false);

  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);

  useEffect(() => {
    let canceled = false;
    async function load() {
      if (!token) return;
      setLoading(true);
      setErr(null);
      try {
        const raw = await getCollectionData<ResumeData>("resume", token);
        const obj = Array.isArray(raw) ? raw[0] : raw;
        const contact: Contact = {
          email: obj?.contact?.email ?? "",
          phone: obj?.contact?.phone ?? "",
          linkedin: obj?.contact?.linkedin ?? "",
          github: obj?.contact?.github ?? "",
          website: obj?.contact?.website ?? "",
        };
        const technical_skills: TechnicalSkills = {
          languages: Array.isArray(obj?.technical_skills?.languages)
            ? obj.technical_skills.languages
            : [],
          programming: Array.isArray(obj?.technical_skills?.programming)
            ? obj.technical_skills.programming
            : [],
          ai_ml: Array.isArray(obj?.technical_skills?.ai_ml)
            ? obj.technical_skills.ai_ml
            : [],
          systems_and_infra: Array.isArray(
            obj?.technical_skills?.systems_and_infra,
          )
            ? obj.technical_skills.systems_and_infra
            : [],
          web: Array.isArray(obj?.technical_skills?.web)
            ? obj.technical_skills.web
            : [],
        };
        const experiences: Experience[] = Array.isArray(obj?.experiences)
          ? obj.experiences
          : [];
        const education: Education[] = Array.isArray(obj?.education)
          ? obj.education
          : [];
        const certifications: Certification[] = Array.isArray(
          obj?.certifications,
        )
          ? obj.certifications
          : [];
        if (!canceled)
          setData({
            name: obj?.name ?? "",
            contact,
            personal_statement: obj?.personal_statement ?? "",
            experiences,
            education,
            certifications,
            technical_skills,
            skills: Array.isArray(obj?.skills) ? obj.skills : [],
            passions: Array.isArray(obj?.passions) ? obj.passions : [],
          });
      } catch (e) {
        if (!canceled) setErr((e as Error)?.message ?? "Failed to load");
      } finally {
        if (!canceled) setLoading(false);
      }
    }
    void load();
    return () => {
      canceled = true;
    };
  }, [token]);

  useEffect(() => {
    if (data) {
      setExperiences(data.experiences || []);
      setEducation(data.education || []);
      setCertifications(data.certifications || []);
    }
  }, [data]);

  const saveProfile = async (form: HTMLFormElement) => {
    if (!token) return;
    const fd = new FormData(form);
    const patch: Partial<ResumeData> = {
      name: String(fd.get("name") || ""),
      contact: {
        email: String(fd.get("email") || ""),
        phone: String(fd.get("phone") || ""),
        linkedin: String(fd.get("linkedin") || ""),
        github: String(fd.get("github") || ""),
        website: String(fd.get("website") || ""),
      },
      personal_statement: String(fd.get("personal_statement") || ""),
      skills: String(fd.get("skills") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      passions: String(fd.get("passions") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    setSavingProfile(true);
    try {
      const res = await updateItem("resume", "main", patch, token);
      const merged = (res?.item || {}) as ResumeData;

      const next: ResumeData = {
        name: merged?.name ?? data?.name ?? "",
        contact: {
          email:
            merged?.contact?.email ??
            (patch.contact as Contact)?.email ??
            data?.contact?.email ??
            "",
          phone:
            merged?.contact?.phone ??
            (patch.contact as Contact)?.phone ??
            data?.contact?.phone ??
            "",
          linkedin:
            merged?.contact?.linkedin ??
            (patch.contact as Contact)?.linkedin ??
            data?.contact?.linkedin ??
            "",
          github:
            merged?.contact?.github ??
            (patch.contact as Contact)?.github ??
            data?.contact?.github ??
            "",
          website:
            merged?.contact?.website ??
            (patch.contact as Contact)?.website ??
            data?.contact?.website ??
            "",
        },
        personal_statement:
          merged?.personal_statement ??
          (patch.personal_statement as string) ??
          data?.personal_statement ??
          "",
        experiences: Array.isArray(merged?.experiences)
          ? (merged.experiences as Experience[])
          : (data?.experiences ?? []),
        education: Array.isArray(merged?.education)
          ? (merged.education as Education[])
          : (data?.education ?? []),
        certifications: Array.isArray(merged?.certifications)
          ? (merged.certifications as Certification[])
          : (data?.certifications ?? []),
        technical_skills: (merged?.technical_skills as TechnicalSkills) ??
          data?.technical_skills ?? {
            languages: [],
            programming: [],
            ai_ml: [],
            systems_and_infra: [],
            web: [],
          },
        skills: Array.isArray(merged?.skills)
          ? (merged.skills as string[])
          : (patch.skills ?? data?.skills ?? []),
        passions: Array.isArray(merged?.passions)
          ? (merged.passions as string[])
          : (patch.passions ?? data?.passions ?? []),
      };
      setData(next);
      toast.success("Profile saved");
    } catch (e) {
      toast.error((e as Error)?.message ?? "Save failed");
    } finally {
      setSavingProfile(false);
    }
  };

  const saveTechnicalSkills = async (form: HTMLFormElement) => {
    if (!token) return;
    const fd = new FormData(form);
    const technical_skills: TechnicalSkills = {
      languages: String(fd.get("languages") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      programming: String(fd.get("programming") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      ai_ml: String(fd.get("ai_ml") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      systems_and_infra: String(fd.get("systems_and_infra") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      web: String(fd.get("web") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    setSavingTech(true);
    try {
      const res = await updateItem(
        "resume",
        "main",
        { technical_skills },
        token,
      );
      const merged = (res?.item || {}) as ResumeData;
      setData((prev) =>
        prev
          ? {
              ...prev,
              technical_skills:
                (merged?.technical_skills as TechnicalSkills) ??
                technical_skills,
            }
          : null,
      );
      toast.success("Technical skills saved");
    } catch (e) {
      toast.error((e as Error)?.message ?? "Save failed");
    } finally {
      setSavingTech(false);
    }
  };

  const saveExperiences = async () => {
    if (!token) return;
    setSavingExp(true);
    try {
      // Sanitize descriptions: trim lines and drop empties before saving
      const sanitized = experiences.map((exp) => ({
        ...exp,
        description: (exp.description || [])
          .map((s) => s.trim())
          .filter(Boolean),
      }));
      const res = await updateItem(
        "resume",
        "main",
        { experiences: sanitized },
        token,
      );
      const merged = (res?.item || {}) as ResumeData;
      const next = Array.isArray(merged?.experiences)
        ? (merged.experiences as Experience[])
        : sanitized;
      setData((prev) => (prev ? { ...prev, experiences: next } : prev));
      setExperiences(next);
      toast.success("Experiences saved");
    } catch (e) {
      toast.error((e as Error)?.message ?? "Save failed");
    } finally {
      setSavingExp(false);
    }
  };

  const saveEducation = async () => {
    if (!token) return;
    setSavingEdu(true);
    try {
      const res = await updateItem("resume", "main", { education }, token);
      const merged = (res?.item || {}) as ResumeData;
      const next = Array.isArray(merged?.education)
        ? (merged.education as Education[])
        : education;
      setData((prev) => (prev ? { ...prev, education: next } : prev));
      setEducation(next);
      toast.success("Education saved");
    } catch (e) {
      toast.error((e as Error)?.message ?? "Save failed");
    } finally {
      setSavingEdu(false);
    }
  };

  const saveCertifications = async () => {
    if (!token) return;
    setSavingCerts(true);
    try {
      // Normalize issued_date empty string -> null
      const payload = certifications.map((c) => ({
        ...c,
        issued_date: (c.issued_date ?? "") === "" ? null : c.issued_date,
      }));
      const res = await updateItem(
        "resume",
        "main",
        { certifications: payload },
        token,
      );
      const merged = (res?.item || {}) as ResumeData;
      const next = Array.isArray(merged?.certifications)
        ? (merged.certifications as Certification[])
        : payload;
      setData((prev) => (prev ? { ...prev, certifications: next } : prev));
      setCertifications(next);
      toast.success("Certifications saved");
    } catch (e) {
      toast.error((e as Error)?.message ?? "Save failed");
    } finally {
      setSavingCerts(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Resume</h1>
      {loading ? (
        <div>Loading…</div>
      ) : err ? (
        <div className="text-red-600">{err}</div>
      ) : data ? (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void saveProfile(e.currentTarget);
            }}
            className="space-y-4"
          >
            <div className="border rounded-lg p-4 bg-card">
              <div className="font-medium mb-3">Identity</div>
              <input
                name="name"
                defaultValue={data.name}
                placeholder="Full name"
                className="border rounded-md px-3 py-2 bg-background w-full"
                required
              />
            </div>

            <div className="border rounded-lg p-4 bg-card">
              <div className="font-medium mb-3">Contact</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  name="email"
                  defaultValue={data.contact?.email || ""}
                  placeholder="Email"
                  className="border rounded-md px-3 py-2 bg-background"
                />
                <input
                  name="phone"
                  defaultValue={data.contact?.phone || ""}
                  placeholder="Phone"
                  className="border rounded-md px-3 py-2 bg-background"
                />
                <input
                  name="linkedin"
                  defaultValue={data.contact?.linkedin || ""}
                  placeholder="LinkedIn"
                  className="border rounded-md px-3 py-2 bg-background"
                />
                <input
                  name="github"
                  defaultValue={data.contact?.github || ""}
                  placeholder="GitHub"
                  className="border rounded-md px-3 py-2 bg-background"
                />
                <input
                  name="website"
                  defaultValue={data.contact?.website || ""}
                  placeholder="Website"
                  className="border rounded-md px-3 py-2 bg-background"
                />
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-card">
              <div className="font-medium mb-3">Personal Statement</div>
              <textarea
                name="personal_statement"
                defaultValue={data.personal_statement || ""}
                placeholder="A brief personal statement or summary"
                className="border rounded-md px-3 py-2 bg-background w-full h-24"
              />
            </div>

            <div className="border rounded-lg p-4 bg-card">
              <div className="font-medium mb-3">Skills & Passions</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  name="skills"
                  defaultValue={(data.skills || []).join(", ")}
                  placeholder="Skills (comma)"
                  className="border rounded-md px-3 py-2 bg-background"
                />
                <input
                  name="passions"
                  defaultValue={(data.passions || []).join(", ")}
                  placeholder="Passions (comma)"
                  className="border rounded-md px-3 py-2 bg-background"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 bg-primary text-primary-foreground disabled:opacity-60 hover:opacity-90"
              >
                {savingProfile ? (
                  "Saving…"
                ) : (
                  <>
                    <Save size={16} /> Save
                  </>
                )}
              </button>
            </div>
          </form>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void saveTechnicalSkills(e.currentTarget);
            }}
            className="space-y-4"
          >
            <div className="border rounded-lg p-4 bg-card">
              <div className="font-medium mb-3">Technical Skills</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  name="languages"
                  defaultValue={(data?.technical_skills?.languages || []).join(
                    ", ",
                  )}
                  placeholder="Languages (comma)"
                  className="border rounded-md px-3 py-2 bg-background"
                />
                <input
                  name="programming"
                  defaultValue={(
                    data?.technical_skills?.programming || []
                  ).join(", ")}
                  placeholder="Programming (comma)"
                  className="border rounded-md px-3 py-2 bg-background"
                />
                <input
                  name="ai_ml"
                  defaultValue={(data?.technical_skills?.ai_ml || []).join(
                    ", ",
                  )}
                  placeholder="AI/ML (comma)"
                  className="border rounded-md px-3 py-2 bg-background"
                />
                <input
                  name="systems_and_infra"
                  defaultValue={(
                    data?.technical_skills?.systems_and_infra || []
                  ).join(", ")}
                  placeholder="Systems & Infra (comma)"
                  className="border rounded-md px-3 py-2 bg-background"
                />
                <input
                  name="web"
                  defaultValue={(data?.technical_skills?.web || []).join(", ")}
                  placeholder="Web (comma)"
                  className="border rounded-md px-3 py-2 bg-background"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingTech}
                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 bg-primary text-primary-foreground disabled:opacity-60 hover:opacity-90"
              >
                {savingTech ? (
                  "Saving…"
                ) : (
                  <>
                    <Save size={16} /> Save Technical Skills
                  </>
                )}
              </button>
            </div>
          </form>
          <div className="border rounded-lg p-4 bg-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">Experiences</div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-accent"
                onClick={() =>
                  setExperiences((prev) => [
                    ...prev,
                    {
                      role: "",
                      position: "",
                      company: "",
                      period: "",
                      location: "",
                      current: false,
                      highlight: false,
                      hide: false,
                      description: [],
                    },
                  ])
                }
              >
                <Plus size={16} /> Add experience
              </button>
            </div>
            <div className="space-y-6">
              {experiences.map((exp, idx) => (
                <div
                  key={idx}
                  className="border rounded-md p-3 bg-background space-y-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      placeholder="Role"
                      className="border rounded-md px-3 py-2"
                      value={exp.role}
                      onChange={(e) =>
                        setExperiences((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, role: e.target.value } : x,
                          ),
                        )
                      }
                    />
                    <input
                      placeholder="Position"
                      className="border rounded-md px-3 py-2"
                      value={exp.position}
                      onChange={(e) =>
                        setExperiences((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, position: e.target.value } : x,
                          ),
                        )
                      }
                    />
                    <input
                      placeholder="Company"
                      className="border rounded-md px-3 py-2"
                      value={exp.company}
                      onChange={(e) =>
                        setExperiences((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, company: e.target.value } : x,
                          ),
                        )
                      }
                    />
                    <input
                      placeholder="Logo"
                      className="border rounded-md px-3 py-2"
                      value={exp.logo}
                      onChange={(e) =>
                        setExperiences((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, logo: e.target.value } : x,
                          ),
                        )
                      }
                    />
                    <input
                      placeholder="Period"
                      className="border rounded-md px-3 py-2"
                      value={exp.period}
                      onChange={(e) =>
                        setExperiences((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, period: e.target.value } : x,
                          ),
                        )
                      }
                    />
                    <input
                      placeholder="Location"
                      className="border rounded-md px-3 py-2"
                      value={exp.location}
                      onChange={(e) =>
                        setExperiences((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, location: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!exp.current}
                        onChange={(e) =>
                          setExperiences((prev) =>
                            prev.map((x, i) =>
                              i === idx
                                ? { ...x, current: e.target.checked }
                                : x,
                            ),
                          )
                        }
                      />
                      <span>Current</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!exp.highlight}
                        onChange={(e) =>
                          setExperiences((prev) =>
                            prev.map((x, i) =>
                              i === idx
                                ? { ...x, highlight: e.target.checked }
                                : x,
                            ),
                          )
                        }
                      />
                      <span>Highlight</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!exp.hide}
                        onChange={(e) =>
                          setExperiences((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, hide: e.target.checked } : x,
                            ),
                          )
                        }
                      />
                      <span>Hide</span>
                    </label>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      Description (one per line)
                    </div>
                    <textarea
                      className="w-full border rounded-md px-3 py-2 min-h-[100px]"
                      value={(exp.description || []).join("\n")}
                      onChange={(e) => {
                        const lines = e.target.value.split("\n");
                        setExperiences((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, description: lines } : x,
                          ),
                        );
                      }}
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 text-red-600 border rounded-md px-3 py-2 hover:bg-red-500/10"
                      onClick={() =>
                        setExperiences((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
                    >
                      <Trash2 size={16} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                disabled={savingExp}
                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 bg-primary text-primary-foreground disabled:opacity-60 hover:opacity-90"
                onClick={() => void saveExperiences()}
              >
                {savingExp ? (
                  "Saving…"
                ) : (
                  <>
                    <Save size={16} /> Save Experiences
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="border rounded-lg p-4 bg-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">Education</div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-accent"
                onClick={() =>
                  setEducation((prev) => [
                    ...prev,
                    {
                      institution: "",
                      degree: "",
                      location: "",
                      description: "",
                      period: "",
                    },
                  ])
                }
              >
                <Plus size={16} /> Add education
              </button>
            </div>
            <div className="space-y-6">
              {education.map((edu, idx) => (
                <div
                  key={idx}
                  className="border rounded-md p-3 bg-background space-y-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      placeholder="Institution"
                      className="border rounded-md px-3 py-2"
                      value={edu.institution}
                      onChange={(e) =>
                        setEducation((prev) =>
                          prev.map((x, i) =>
                            i === idx
                              ? { ...x, institution: e.target.value }
                              : x,
                          ),
                        )
                      }
                    />
                    <input
                      placeholder="Degree"
                      className="border rounded-md px-3 py-2"
                      value={edu.degree}
                      onChange={(e) =>
                        setEducation((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, degree: e.target.value } : x,
                          ),
                        )
                      }
                    />
                    <input
                      placeholder="Period"
                      className="border rounded-md px-3 py-2"
                      value={edu.period}
                      onChange={(e) =>
                        setEducation((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, period: e.target.value } : x,
                          ),
                        )
                      }
                    />
                    <input
                      placeholder="Location (optional)"
                      className="border rounded-md px-3 py-2"
                      value={edu.location}
                      onChange={(e) =>
                        setEducation((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, location: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      Description (optional)
                    </div>
                    <textarea
                      className="w-full border rounded-md px-3 py-2 min-h-[80px]"
                      value={edu.description || ""}
                      onChange={(e) =>
                        setEducation((prev) =>
                          prev.map((x, i) =>
                            i === idx
                              ? { ...x, description: e.target.value }
                              : x,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 text-red-600 border rounded-md px-3 py-2 hover:bg-red-500/10"
                      onClick={() =>
                        setEducation((prev) => prev.filter((_, i) => i !== idx))
                      }
                    >
                      <Trash2 size={16} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                disabled={savingEdu}
                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 bg-primary text-primary-foreground disabled:opacity-60 hover:opacity-90"
                onClick={() => void saveEducation()}
              >
                {savingEdu ? (
                  "Saving…"
                ) : (
                  <>
                    <Save size={16} /> Save Education
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="border rounded-lg p-4 bg-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">Certifications</div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-accent"
                onClick={() =>
                  setCertifications((prev) => [
                    ...prev,
                    {
                      provider: "",
                      title: "",
                      issued_date: null,
                      status: "issued",
                    },
                  ])
                }
              >
                <Plus size={16} /> Add certification
              </button>
            </div>
            <div className="space-y-6">
              {certifications.map((cert, idx) => (
                <div
                  key={idx}
                  className="border rounded-md p-3 bg-background space-y-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      placeholder="Provider"
                      className="border rounded-md px-3 py-2"
                      value={cert.provider}
                      onChange={(e) =>
                        setCertifications((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, provider: e.target.value } : x,
                          ),
                        )
                      }
                    />
                    <input
                      placeholder="Title"
                      className="border rounded-md px-3 py-2"
                      value={cert.title}
                      onChange={(e) =>
                        setCertifications((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, title: e.target.value } : x,
                          ),
                        )
                      }
                    />
                    <input
                      placeholder="Issued date (e.g. Jan 2023)"
                      className="border rounded-md px-3 py-2"
                      value={cert.issued_date ?? ""}
                      onChange={(e) =>
                        setCertifications((prev) =>
                          prev.map((x, i) =>
                            i === idx
                              ? { ...x, issued_date: e.target.value || null }
                              : x,
                          ),
                        )
                      }
                    />
                    <select
                      className="border rounded-md px-3 py-2 bg-background"
                      value={cert.status}
                      onChange={(e) =>
                        setCertifications((prev) =>
                          prev.map((x, i) =>
                            i === idx
                              ? {
                                  ...x,
                                  status: e.target
                                    .value as Certification["status"],
                                }
                              : x,
                          ),
                        )
                      }
                    >
                      <option value="issued">issued</option>
                      <option value="in progress">in progress</option>
                      <option value="stopped">stopped</option>
                      <option value="starting">starting</option>
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 text-red-600 border rounded-md px-3 py-2 hover:bg-red-500/10"
                      onClick={() =>
                        setCertifications((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
                    >
                      <Trash2 size={16} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                disabled={savingCerts}
                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 bg-primary text-primary-foreground disabled:opacity-60 hover:opacity-90"
                onClick={() => void saveCertifications()}
              >
                {savingCerts ? (
                  "Saving…"
                ) : (
                  <>
                    <Save size={16} /> Save Certifications
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default ResumePage;
