import React, { useEffect, useState } from 'react';
import { useAdminAuth } from '@/admin/providers/AdminAuthProvider';
import { getCollectionData, replaceCollection } from '@/api/admin';

type ResumeContact = {
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  website?: string;
};

type ResumeData = {
  name: string;
  contact: ResumeContact;
  skills?: string[];
  passions?: string[];
};

const ResumePage: React.FC = () => {
  const { token } = useAdminAuth();
  const [data, setData] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let canceled = false;
    async function load() {
      if (!token) return;
      setLoading(true);
      setErr(null);
      try {
        const raw = await getCollectionData<any>('resume', token);
        const obj = Array.isArray(raw) ? raw[0] : raw;
        if (!canceled)
          setData({
            name: obj?.name ?? '',
            contact: obj?.contact ?? {},
            skills: Array.isArray(obj?.skills) ? obj.skills : [],
            passions: Array.isArray(obj?.passions) ? obj.passions : [],
          });
      } catch (e) {
        if (!canceled) setErr((e as Error)?.message ?? 'Failed to load');
      } finally {
        if (!canceled) setLoading(false);
      }
    }
    void load();
    return () => {
      canceled = true;
    };
  }, [token]);

  const save = async (form: HTMLFormElement) => {
    if (!token) return;
    const fd = new FormData(form);
    const obj: any = {
      name: String(fd.get('name') || ''),
      contact: {
        email: String(fd.get('email') || ''),
        phone: String(fd.get('phone') || ''),
        linkedin: String(fd.get('linkedin') || ''),
        github: String(fd.get('github') || ''),
        website: String(fd.get('website') || ''),
      },
      skills: String(fd.get('skills') || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      passions: String(fd.get('passions') || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    setSaving(true);
    try {
      // keep file shape as array-of-one for compatibility with exporter
      await replaceCollection('resume', [obj], token);
      setData(obj);
      alert('Saved');
    } catch (e) {
      alert((e as Error)?.message ?? 'Save failed');
    } finally {
      setSaving(false);
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save(e.currentTarget);
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
              <input name="email" defaultValue={data.contact?.email || ''} placeholder="Email" className="border rounded-md px-3 py-2 bg-background" />
              <input name="phone" defaultValue={data.contact?.phone || ''} placeholder="Phone" className="border rounded-md px-3 py-2 bg-background" />
              <input name="linkedin" defaultValue={data.contact?.linkedin || ''} placeholder="LinkedIn" className="border rounded-md px-3 py-2 bg-background" />
              <input name="github" defaultValue={data.contact?.github || ''} placeholder="GitHub" className="border rounded-md px-3 py-2 bg-background" />
              <input name="website" defaultValue={data.contact?.website || ''} placeholder="Website" className="border rounded-md px-3 py-2 bg-background" />
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-card">
            <div className="font-medium mb-3">Skills & Passions</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input name="skills" defaultValue={(data.skills || []).join(', ')} placeholder="Skills (comma)" className="border rounded-md px-3 py-2 bg-background" />
              <input name="passions" defaultValue={(data.passions || []).join(', ')} placeholder="Passions (comma)" className="border rounded-md px-3 py-2 bg-background" />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="rounded-md border px-3 py-2 bg-primary text-primary-foreground disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      ) : null}
    </div>
  );
};

export default ResumePage;
