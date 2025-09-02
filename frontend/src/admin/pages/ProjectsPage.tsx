import React, { useEffect, useMemo, useState } from 'react';
import { useAdminAuth } from '@/admin/providers/AdminAuthProvider';
import {
  createItem,
  deleteItem,
  getCollectionData,
  updateItem,
} from '@/api/admin';

type Project = {
  id: string;
  slug?: string;
  title: string;
  date: string;
  technologies: string[];
  [k: string]: unknown;
};

const ProjectsPage: React.FC = () => {
  const { token } = useAdminAuth();
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTechs, setNewTechs] = useState('');
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editJson, setEditJson] = useState('');
  const [saving, setSaving] = useState(false);

  const sorted = useMemo(
    () =>
      [...items].sort((a, b) => String(b.date).localeCompare(String(a.date))),
    [items],
  );

  const refresh = async () => {
    if (!token) return;
    setLoading(true);
    setErr(null);
    try {
      const data = await getCollectionData<Project[]>('projects', token);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr((e as Error)?.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCreating(true);
    try {
      const techs = newTechs
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const body = {
        title: newTitle,
        date: newDate || new Date().toISOString().slice(0, 10),
        technologies: techs,
      };
      const res = await createItem('projects', body, token);
      setItems((prev) => [...prev, res.item as Project]);
      setNewTitle('');
      setNewDate('');
      setNewTechs('');
    } catch (e) {
      alert((e as Error)?.message ?? 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (p: Project) => {
    setEditingId(p.id);
    setEditJson(JSON.stringify(p, null, 2));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditJson('');
  };

  const saveEdit = async () => {
    if (!token || !editingId) return;
    setSaving(true);
    try {
      const next = JSON.parse(editJson) as Project;
      const patch: Record<string, unknown> = {};
      // send whole object for simplicity
      Object.assign(patch, next);
      const res = await updateItem('projects', editingId, patch, token);
      setItems((prev) =>
        prev.map((it) => (it.id === editingId ? (res.item as Project) : it)),
      );
      cancelEdit();
    } catch (e) {
      alert((e as Error)?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!token) return;
    if (!confirm('Delete this project?')) return;
    try {
      await deleteItem('projects', id, token);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      alert((e as Error)?.message ?? 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
      </div>

      <form onSubmit={onCreate} className="border rounded-lg p-4 space-y-3 bg-card">
        <div className="font-medium">Create new project</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            placeholder="Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="border rounded-md px-3 py-2 bg-background"
            required
          />
          <input
            placeholder="Date (YYYY-MM-DD)"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="border rounded-md px-3 py-2 bg-background"
          />
          <input
            placeholder="Technologies (comma separated)"
            value={newTechs}
            onChange={(e) => setNewTechs(e.target.value)}
            className="border rounded-md px-3 py-2 bg-background"
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-md border px-3 py-2 bg-primary text-primary-foreground disabled:opacity-60"
          >
            {creating ? 'Creating…' : 'Create Project'}
          </button>
        </div>
      </form>

      {loading ? (
        <div>Loading…</div>
      ) : err ? (
        <div className="text-red-600">{err}</div>
      ) : (
        <div className="space-y-3">
          {sorted.map((p) => (
            <div key={p.id} className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.id} • {p.slug} • {p.date}
                  </div>
                </div>
                <div className="flex gap-2">
                  {editingId === p.id ? (
                    <>
                      <button
                        className="border rounded-md px-3 py-1"
                        onClick={cancelEdit}
                      >
                        Cancel
                      </button>
                      <button
                        className="border rounded-md px-3 py-1 bg-primary text-primary-foreground"
                        onClick={saveEdit}
                        disabled={saving}
                      >
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="border rounded-md px-3 py-1"
                        onClick={() => startEdit(p)}
                      >
                        Edit JSON
                      </button>
                      <button
                        className="border rounded-md px-3 py-1"
                        onClick={() => onDelete(p.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
              {editingId === p.id ? (
                <textarea
                  className="mt-3 w-full h-64 border rounded-md p-2 font-mono text-sm bg-background"
                  value={editJson}
                  onChange={(e) => setEditJson(e.target.value)}
                />
              ) : (
                <div className="mt-2 text-sm text-muted-foreground">
                  {Array.isArray(p.technologies) && p.technologies.length > 0
                    ? p.technologies.join(', ')
                    : '—'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;

