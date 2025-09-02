import React, { useEffect, useMemo, useState } from 'react';
import { useAdminAuth } from '@/admin/providers/AdminAuthProvider';
import {
  createItem,
  deleteItem,
  getCollectionData,
  updateItem,
} from '@/api/admin';

type Article = {
  id: string;
  slug?: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  tags: string[];
  [k: string]: unknown;
};

const ArticlesPage: React.FC = () => {
  const { token } = useAdminAuth();
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newExcerpt, setNewExcerpt] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTags, setNewTags] = useState('');
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
      const data = await getCollectionData<Article[]>('articles', token);
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
      const tags = newTags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const body = {
        title: newTitle,
        excerpt: newExcerpt,
        content: '',
        date: newDate || new Date().toISOString().slice(0, 10),
        tags,
      };
      const res = await createItem('articles', body, token);
      setItems((prev) => [...prev, res.item as Article]);
      setNewTitle('');
      setNewExcerpt('');
      setNewDate('');
      setNewTags('');
    } catch (e) {
      alert((e as Error)?.message ?? 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (a: Article) => {
    setEditingId(a.id);
    setEditJson(JSON.stringify(a, null, 2));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditJson('');
  };

  const saveEdit = async () => {
    if (!token || !editingId) return;
    setSaving(true);
    try {
      const next = JSON.parse(editJson) as Article;
      const patch: Record<string, unknown> = {};
      Object.assign(patch, next);
      const res = await updateItem('articles', editingId, patch, token);
      setItems((prev) =>
        prev.map((it) => (it.id === editingId ? (res.item as Article) : it)),
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
    if (!confirm('Delete this article?')) return;
    try {
      await deleteItem('articles', id, token);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      alert((e as Error)?.message ?? 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Articles</h1>
      </div>

      <form onSubmit={onCreate} className="border rounded-lg p-4 space-y-3 bg-card">
        <div className="font-medium">Create new article</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            placeholder="Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="border rounded-md px-3 py-2 bg-background"
            required
          />
          <input
            placeholder="Excerpt"
            value={newExcerpt}
            onChange={(e) => setNewExcerpt(e.target.value)}
            className="border rounded-md px-3 py-2 bg-background"
          />
          <input
            placeholder="Date (YYYY-MM-DD)"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="border rounded-md px-3 py-2 bg-background"
          />
          <input
            placeholder="Tags (comma separated)"
            value={newTags}
            onChange={(e) => setNewTags(e.target.value)}
            className="border rounded-md px-3 py-2 bg-background"
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-md border px-3 py-2 bg-primary text-primary-foreground disabled:opacity-60"
          >
            {creating ? 'Creating…' : 'Create Article'}
          </button>
        </div>
      </form>

      {loading ? (
        <div>Loading…</div>
      ) : err ? (
        <div className="text-red-600">{err}</div>
      ) : (
        <div className="space-y-3">
          {sorted.map((a) => (
            <div key={a.id} className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{a.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.id} • {a.slug} • {a.date}
                  </div>
                </div>
                <div className="flex gap-2">
                  {editingId === a.id ? (
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
                        onClick={() => startEdit(a)}
                      >
                        Edit JSON
                      </button>
                      <button
                        className="border rounded-md px-3 py-1"
                        onClick={() => onDelete(a.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
              {editingId === a.id ? (
                <textarea
                  className="mt-3 w-full h-64 border rounded-md p-2 font-mono text-sm bg-background"
                  value={editJson}
                  onChange={(e) => setEditJson(e.target.value)}
                />
              ) : (
                <div className="mt-2 text-sm text-muted-foreground">
                  {Array.isArray(a.tags) && a.tags.length > 0
                    ? a.tags.join(', ')
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

export default ArticlesPage;

