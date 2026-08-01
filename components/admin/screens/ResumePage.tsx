"use client";
import React, { useCallback, useMemo, useState } from "react";
import {
  ErrorNote,
  LoadingRows,
  PageHeader,
} from "@/components/admin/shared/primitives";
import { FieldSections, type FieldSpec } from "@/components/admin/shared/fields";
import { Bound, RepeatableList } from "@/components/admin/shared/RepeatableList";
import { readForm } from "@/lib/forms";
import { useAdminAuth } from "@/components/admin/providers/AdminAuthProvider";
import { useAdminData } from "@/hooks/admin/useAdminData";
import { getCollectionData, updateItem } from "@/api/admin";
import type {
  ResumeData,
  ResumeContent,
  Contact,
  TechnicalSkills,
  Experience,
  Education,
  Certification,
} from "@/types/resume";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? value : []);

/** Every optional field filled in, so the form inputs are never uncontrolled. */
const normalizeResume = (raw: ResumeData | ResumeData[]): ResumeData => {
  const obj = Array.isArray(raw) ? raw[0] : raw;
  const contact: Contact = {
    email: obj?.contact?.email ?? "",
    phone: obj?.contact?.phone ?? "",
    linkedin: obj?.contact?.linkedin ?? "",
    github: obj?.contact?.github ?? "",
    website: obj?.contact?.website ?? "",
  };
  const technical_skills: TechnicalSkills = {
    languages: asArray(obj?.technical_skills?.languages),
    programming: asArray(obj?.technical_skills?.programming),
    ai_ml: asArray(obj?.technical_skills?.ai_ml),
    systems_and_infra: asArray(obj?.technical_skills?.systems_and_infra),
    web: asArray(obj?.technical_skills?.web),
  };

  return {
    name: obj?.name ?? "",
    contact,
    personal_statement: obj?.personal_statement ?? "",
    experiences: asArray<Experience>(obj?.experiences),
    education: asArray<Education>(obj?.education),
    certifications: asArray<Certification>(obj?.certifications),
    technical_skills,
    skills: asArray<string>(obj?.skills),
    passions: asArray<string>(obj?.passions),
    translations: obj?.translations ?? {},
  };
};


const PROFILE_FIELDS: FieldSpec[] = [
  { name: "name", label: "Full name", type: "text", required: true, section: "Identity" },
  {
    name: "personal_statement",
    label: "Personal statement",
    type: "textarea",
    hint: "The paragraph under your name on the CV and in the PDF.",
    section: "Identity",
  },
  { name: "email", label: "Email", type: "text", half: true, section: "Contact" },
  { name: "phone", label: "Phone", type: "text", half: true, section: "Contact" },
  { name: "linkedin", label: "LinkedIn", type: "text", half: true, hint: "Handle only, not the full URL.", section: "Contact" },
  { name: "github", label: "GitHub", type: "text", half: true, hint: "Handle only.", section: "Contact" },
  { name: "website", label: "Website", type: "text", half: true, section: "Contact" },
  { name: "skills", label: "Core skills", type: "list", hint: "Comma separated.", section: "Interests" },
  { name: "passions", label: "Passions", type: "list", hint: "Comma separated.", section: "Interests" },
];

const SKILL_FIELDS: FieldSpec[] = [
  { name: "programming", label: "Programming", type: "list", hint: "Comma separated.", section: "Technical skills" },
  { name: "ai_ml", label: "AI and ML", type: "list", hint: "Comma separated.", section: "Technical skills" },
  { name: "systems_and_infra", label: "Systems and infrastructure", type: "list", hint: "Comma separated.", section: "Technical skills" },
  { name: "web", label: "Web", type: "list", hint: "Comma separated.", section: "Technical skills" },
  { name: "languages", label: "Languages", type: "list", hint: "Comma separated.", section: "Technical skills" },
];

const CERT_STATUS = [
  { value: "issued", label: "Issued" },
  { value: "in progress", label: "In progress" },
  { value: "starting", label: "Starting" },
  { value: "stopped", label: "Stopped" },
];

type ResumeList = "experiences" | "education" | "certifications";

/**
 * A list on the loaded resume, edited in place.
 *
 * The loaded resume is the only store; mirroring these into their own state
 * meant a second source of truth re-synced by an effect on every load. The
 * signature matches `useState` so the editors below read unchanged.
 */
function useResumeList<K extends ResumeList>(
  key: K,
  data: ResumeData | null,
  set: (update: (current: ResumeData | null) => ResumeData) => void,
) {
  type Item = NonNullable<ResumeData[K]>;

  const value = (data?.[key] ?? []) as Item;

  const update = useCallback(
    (next: Item | ((current: Item) => Item)) =>
      set((current) => {
        const base = (current ?? normalizeResume({} as ResumeData)) as ResumeData;
        const list = (base[key] ?? []) as Item;
        return {
          ...base,
          [key]: typeof next === "function" ? next(list) : next,
        };
      }),
    [key, set],
  );

  return [value, update] as const;
}

const ResumePage: React.FC = () => {
  const { token } = useAdminAuth();

  const load = useMemo(
    () =>
      token
        ? async (signal: AbortSignal) =>
            normalizeResume(
              await getCollectionData<ResumeData>("resume", { token, signal }),
            )
        : null,
    [token],
  );
  const { data, error, loading, set } = useAdminData(load);
  const setData = set;

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingTech, setSavingTech] = useState(false);
  const [savingExp, setSavingExp] = useState(false);
  const [savingEdu, setSavingEdu] = useState(false);
  const [savingCerts, setSavingCerts] = useState(false);
  const [savingFrench, setSavingFrench] = useState(false);

  const [experiences, setExperiences] = useResumeList("experiences", data, set);
  const [education, setEducation] = useResumeList("education", data, set);
  const [certifications, setCertifications] = useResumeList(
    "certifications",
    data,
    set,
  );

  /**
   * The French translation is edited as raw text, which is not valid JSON while
   * it is being typed, so it needs its own state. `null` means untouched: the
   * textarea then shows whatever the loaded resume holds, with no effect needed
   * to seed it.
   */
  const [frenchDraft, setFrenchDraft] = useState<string | null>(null);
  const frenchContentJson =
    frenchDraft ?? JSON.stringify(data?.translations?.fr ?? {}, null, 2);
  const setFrenchContentJson = setFrenchDraft;

  const saveProfile = async (form: HTMLFormElement) => {
    if (!token) return;
    const fields = readForm(form);
    const patch: Partial<ResumeData> = {
      name: fields.text("name"),
      contact: {
        email: fields.text("email"),
        phone: fields.text("phone"),
        linkedin: fields.text("linkedin"),
        github: fields.text("github"),
        website: fields.text("website"),
      },
      personal_statement: fields.text("personal_statement"),
      skills: fields.list("skills"),
      passions: fields.list("passions"),
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
        translations: merged?.translations ?? data?.translations ?? {},
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
    const fields = readForm(form);
    const technical_skills: TechnicalSkills = {
      languages: fields.list("languages"),
      programming: fields.list("programming"),
      ai_ml: fields.list("ai_ml"),
      systems_and_infra: fields.list("systems_and_infra"),
      web: fields.list("web"),
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
      setData((prev) => ({
        ...normalizeResume(prev ?? ({} as ResumeData)),
        ...prev,
        technical_skills:
          (merged?.technical_skills as TechnicalSkills) ?? technical_skills,
      }));
      toast.success("Technical skills saved");
    } catch (e) {
      toast.error((e as Error)?.message ?? "Save failed");
    } finally {
      setSavingTech(false);
    }
  };

  const saveFrenchVersion = async () => {
    if (!token) return;

    let parsed: Partial<ResumeContent>;
    try {
      const raw = frenchContentJson.trim();
      parsed = raw ? (JSON.parse(raw) as Partial<ResumeContent>) : {};
    } catch {
      toast.error("French JSON is invalid");
      return;
    }

    setSavingFrench(true);
    try {
      const translations = {
        ...(data?.translations ?? {}),
        fr: parsed,
      };
      const res = await updateItem("resume", "main", { translations }, token);
      const merged = (res?.item || {}) as ResumeData;
      setData((prev) => ({
        ...normalizeResume(prev ?? ({} as ResumeData)),
        ...prev,
        translations: merged?.translations ?? translations,
      }));
      setFrenchContentJson(
        JSON.stringify(merged?.translations?.fr ?? parsed, null, 2),
      );
      toast.success("French version saved");
    } catch (e) {
      toast.error((e as Error)?.message ?? "Save failed");
    } finally {
      setSavingFrench(false);
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
      setCertifications(next);
      toast.success("Certifications saved");
    } catch (e) {
      toast.error((e as Error)?.message ?? "Save failed");
    } finally {
      setSavingCerts(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Resume"
        description="The CV behind the resume page and the PDF export. Each section saves on its own."
      />

      {error ? <ErrorNote message={error} /> : null}

      {loading && !data ? (
        <LoadingRows rows={6} />
      ) : data ? (
        <Tabs defaultValue="profile">
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="work">Experience</TabsTrigger>
            <TabsTrigger value="study">Education</TabsTrigger>
            <TabsTrigger value="certs">Certifications</TabsTrigger>
            <TabsTrigger value="french">Français</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void saveProfile(event.currentTarget);
              }}
              className="flex flex-col gap-8"
            >
              <FieldSections
                fields={PROFILE_FIELDS}
                values={{
                  name: data.name,
                  personal_statement: data.personal_statement,
                  email: data.contact.email,
                  phone: data.contact.phone,
                  linkedin: data.contact.linkedin,
                  github: data.contact.github,
                  website: data.contact.website,
                  skills: data.skills,
                  passions: data.passions,
                }}
              />
              <div className="flex justify-end border-t border-line pt-4">
                <Button type="submit" size="sm" disabled={savingProfile}>
                  <Save /> {savingProfile ? "Saving…" : "Save profile"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="skills">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void saveTechnicalSkills(event.currentTarget);
              }}
              className="flex flex-col gap-8"
            >
              <FieldSections
                fields={SKILL_FIELDS}
                values={{ ...data.technical_skills }}
              />
              <div className="flex justify-end border-t border-line pt-4">
                <Button type="submit" size="sm" disabled={savingTech}>
                  <Save /> {savingTech ? "Saving…" : "Save skills"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="work">
            <RepeatableList
              items={experiences}
              onChange={setExperiences}
              onSave={() => void saveExperiences()}
              saving={savingExp}
              addLabel="Add role"
              emptyTitle="No roles on the CV."
              summary={(item) =>
                [item.role, item.company].filter(Boolean).join(" · ")
              }
              blank={() => ({
                role: "",
                position: "",
                company: "",
                period: "",
                location: "",
                current: false,
                highlight: false,
                hide: false,
                description: [],
              })}
            >
              {(item, update) => (
                <>
                  <Bound label="Role" value={item.role} onChange={(role) => update({ role })} />
                  <Bound label="Company" value={item.company} onChange={(company) => update({ company })} />
                  <Bound label="Position" value={item.position ?? ""} onChange={(position) => update({ position })} hint="Optional qualifier shown after the company." />
                  <Bound label="Period" value={item.period} onChange={(period) => update({ period })} placeholder="Sept. 2024 – Present" />
                  <Bound label="Location" value={item.location} onChange={(location) => update({ location })} />
                  <Bound label="Logo URL" value={item.logo ?? ""} onChange={(logo) => update({ logo })} />
                  <Bound
                    className="sm:col-span-2"
                    label="Responsibilities"
                    type="lines"
                    rows={5}
                    hint="One bullet per line."
                    value={item.description.join("\n")}
                    onChange={(text) =>
                      update({
                        description: String(text)
                          .split("\n")
                          .map((line) => line.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                  <Bound label="Current role" type="switch" value={Boolean(item.current)} onChange={(current) => update({ current })} />
                  <Bound label="Highlight on the CV" type="switch" value={Boolean(item.highlight)} onChange={(highlight) => update({ highlight })} />
                  <Bound label="Hide" type="switch" hint="Keeps the record but leaves it off the CV." value={Boolean(item.hide)} onChange={(hide) => update({ hide })} />
                </>
              )}
            </RepeatableList>
          </TabsContent>

          <TabsContent value="study">
            <RepeatableList
              items={education}
              onChange={setEducation}
              onSave={() => void saveEducation()}
              saving={savingEdu}
              addLabel="Add programme"
              emptyTitle="No education on the CV."
              summary={(item) =>
                [item.degree, item.institution].filter(Boolean).join(" · ")
              }
              blank={() => ({
                institution: "",
                degree: "",
                location: "",
                description: "",
                period: "",
              })}
            >
              {(item, update) => (
                <>
                  <Bound label="Institution" value={item.institution} onChange={(institution) => update({ institution })} />
                  <Bound label="Degree" value={item.degree} onChange={(degree) => update({ degree })} />
                  <Bound label="Period" value={item.period} onChange={(period) => update({ period })} placeholder="Sept. 2024 – Present" />
                  <Bound label="Location" value={item.location ?? ""} onChange={(location) => update({ location })} />
                  <Bound className="sm:col-span-2" label="Summary" type="textarea" rows={3} value={item.description ?? ""} onChange={(description) => update({ description })} />
                </>
              )}
            </RepeatableList>
          </TabsContent>

          <TabsContent value="certs">
            <RepeatableList
              items={certifications}
              onChange={setCertifications}
              onSave={() => void saveCertifications()}
              saving={savingCerts}
              addLabel="Add certification"
              emptyTitle="No certifications listed."
              summary={(item) =>
                [item.title, item.provider].filter(Boolean).join(" · ")
              }
              blank={() => ({
                provider: "",
                title: "",
                issued_date: null,
                status: "issued" as const,
                description: "",
              })}
            >
              {(item, update) => (
                <>
                  <Bound label="Title" value={item.title} onChange={(title) => update({ title })} />
                  <Bound label="Provider" value={item.provider} onChange={(provider) => update({ provider })} />
                  <Bound
                    label="Status"
                    type="select"
                    value={item.status}
                    onChange={(status) => update({ status: status as Certification["status"] })}
                    options={CERT_STATUS}
                  />
                  <Bound
                    label="Issued"
                    type="date"
                    value={item.issued_date?.slice(0, 10) ?? ""}
                    onChange={(issued_date) =>
                      update({ issued_date: String(issued_date) || null })
                    }
                  />
                  <Bound className="sm:col-span-2" label="Summary" type="textarea" rows={2} value={item.description ?? ""} onChange={(description) => update({ description })} />
                </>
              )}
            </RepeatableList>
          </TabsContent>

          <TabsContent value="french">
            <div className="flex flex-col gap-4">
              <p className="measure text-sm text-ink-muted">
                A partial override for the French CV. Anything left out falls
                back to the English version, so only include the fields that
                actually differ. Same shape as the resume itself.
              </p>
              <Bound
                label="French overrides"
                type="lines"
                rows={18}
                value={frenchContentJson}
                onChange={(next) => setFrenchContentJson(String(next))}
              />
              <div className="flex justify-end border-t border-line pt-4">
                <Button
                  type="button"
                  size="sm"
                  disabled={savingFrench}
                  onClick={() => void saveFrenchVersion()}
                >
                  <Save /> {savingFrench ? "Saving…" : "Save French version"}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      ) : null}
    </>
  );
};

export default ResumePage;
