import React, { useEffect, useState } from 'react';
import { useAdminAuth } from '@/admin/providers/AdminAuthProvider';
import { getCollectionData, replaceCollection } from '@/api/admin';

const StudiesPage: React.FC = () => {
  const { token } = useAdminAuth();
  const [jsonText, setJsonText] = useState('');
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
        const data = await getCollectionData<any[]>('studies', token);
        if (!canceled) setJsonText(JSON.stringify(data, null, 2));
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

  const save = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) throw new Error('JSON must be an array');
      await replaceCollection('studies', parsed, token);
      alert('Saved');
    } catch (e) {
      alert((e as Error)?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Studies</h1>
      {loading ? (
        <div>Loading…</div>
      ) : err ? (
        <div className="text-red-600">{err}</div>
      ) : (
        <>
          <textarea
            className="w-full h-[60vh] border rounded-md p-2 font-mono text-sm bg-background"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
          />
          <div>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-md border px-3 py-2 bg-primary text-primary-foreground disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default StudiesPage;

