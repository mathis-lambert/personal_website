import React, { useEffect, useMemo, useState } from 'react';
import { useAdminAuth } from '@/admin/providers/AdminAuthProvider';
import {
  createItem,
  deleteItem,
  getCollectionData,
  updateItem,
} from '@/api/admin';
import Modal from '@/admin/components/Modal';
import type { Article } from '@/types';
import type { AdminCreateArticleInput, AdminUpdateArticleInput } from '@/admin/types';

// Use shared Article type from '@/types'

const ArticlesPage: React.FC = () => {
  const { token } = useAdminAuth();
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Article | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

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

  function splitCSV(v: string): string[] {
    return v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const onCreate = async (form: HTMLFormElement) => {
    if (!token) return;
    const fd = new FormData(form);
    const body: AdminCreateArticleInput = {
      title: String(fd.get('title') || ''),
      slug: String(fd.get('slug') || '') || undefined,
      excerpt: String(fd.get('excerpt') || ''),
      content: String(fd.get('content') || ''),
      author: String(fd.get('author') || '') || undefined,
      date: String(fd.get('date') || new Date().toISOString().slice(0, 10)),
      tags: splitCSV(String(fd.get('tags') || '')),
      categories: splitCSV(String(fd.get('categories') || '')),
      isFeatured: fd.get('isFeatured') === 'on',
      imageUrl: String(fd.get('imageUrl') || '') || undefined,
      thumbnailUrl: String(fd.get('thumbnailUrl') || '') || undefined,
      links: {
        canonical: String(fd.get('link_canonical') || '') || undefined,
        discussion: String(fd.get('link_discussion') || '') || undefined,
      },
      media: {
        thumbnailUrl: String(fd.get('media_thumbnailUrl') || '') || undefined,
        imageUrl: String(fd.get('media_imageUrl') || '') || undefined,
      },
    };
    setCreateLoading(true);
    try {
      const res = await createItem('articles', body, token);
      setItems((prev) => [...prev, res.item as Article]);
      setCreateOpen(false);
    } catch (e) {
      alert((e as Error)?.message ?? 'Create failed');
    } finally {
      setCreateLoading(false);
    }
  };

  const startEdit = (a: Article) => {
    setEditTarget(a);
    setEditOpen(true);
  };

  const saveEdit = async (form: HTMLFormElement) => {
    if (!token || !editTarget) return;
    const fd = new FormData(form);
    const patch: AdminUpdateArticleInput = {
      slug: String(fd.get('slug') || '') || undefined,
      title: String(fd.get('title') || ''),
      excerpt: String(fd.get('excerpt') || ''),
      content: String(fd.get('content') || ''),
      author: String(fd.get('author') || '') || undefined,
      date: String(fd.get('date') || editTarget.date),
      tags: splitCSV(String(fd.get('tags') || '')),
      categories: splitCSV(String(fd.get('categories') || '')),
      isFeatured: fd.get('isFeatured') === 'on',
      imageUrl: String(fd.get('imageUrl') || '') || undefined,
      thumbnailUrl: String(fd.get('thumbnailUrl') || '') || undefined,
      links: {
        canonical: String(fd.get('link_canonical') || '') || undefined,
        discussion: String(fd.get('link_discussion') || '') || undefined,
      },
      media: {
        thumbnailUrl: String(fd.get('media_thumbnailUrl') || '') || undefined,
        imageUrl: String(fd.get('media_imageUrl') || '') || undefined,
      },
    };
    setSaveLoading(true);
    try {
      const res = await updateItem('articles', editTarget.id, patch, token);
      setItems((prev) =>
        prev.map((it) => (it.id === editTarget.id ? (res.item as Article) : it)),
      );
      setEditOpen(false);
      setEditTarget(null);
    } catch (e) {
      alert((e as Error)?.message ?? 'Save failed');
    } finally {
      setSaveLoading(false);
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

      <div className="flex justify-end">
        <button
          className="rounded-md border px-3 py-2 bg-primary text-primary-foreground"
          onClick={() => setCreateOpen(true)}
        >
          New Article
        </button>
      </div>

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
                  <button
                    className="border rounded-md px-3 py-1"
                    onClick={() => startEdit(a)}
                  >
                    Edit
                  </button>
                  <button
                    className="border rounded-md px-3 py-1"
                    onClick={() => onDelete(a.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {Array.isArray(a.tags) && a.tags.length > 0
                  ? a.tags.join(', ')
                  : '—'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={createOpen} onOpenChange={setCreateOpen}>
        <Modal.Content title="Create Article">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void onCreate(e.currentTarget);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input name="title" placeholder="Title" className="border rounded-md px-3 py-2 bg-background" required />
              <input name="slug" placeholder="Slug (optional)" className="border rounded-md px-3 py-2 bg-background" />
              <input name="author" placeholder="Author" className="border rounded-md px-3 py-2 bg-background" />
              <input name="date" placeholder="Date (YYYY-MM-DD)" className="border rounded-md px-3 py-2 bg-background" />
              <input name="tags" placeholder="Tags (comma)" className="border rounded-md px-3 py-2 bg-background" />
              <input name="categories" placeholder="Categories (comma)" className="border rounded-md px-3 py-2 bg-background" />
              <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" name="isFeatured" /> Featured</label>
            </div>
            <input name="excerpt" placeholder="Excerpt" className="w-full border rounded-md px-3 py-2 bg-background" />
            <textarea name="content" placeholder="Content (Markdown/HTML)" className="w-full h-40 border rounded-md p-2 bg-background" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input name="imageUrl" placeholder="Image URL" className="border rounded-md px-3 py-2 bg-background" />
              <input name="thumbnailUrl" placeholder="Thumbnail URL" className="border rounded-md px-3 py-2 bg-background" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input name="link_canonical" placeholder="Link: Canonical" className="border rounded-md px-3 py-2 bg-background" />
              <input name="link_discussion" placeholder="Link: Discussion" className="border rounded-md px-3 py-2 bg-background" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input name="media_thumbnailUrl" placeholder="Media: Thumbnail URL" className="border rounded-md px-3 py-2 bg-background" />
              <input name="media_imageUrl" placeholder="Media: Image URL" className="border rounded-md px-3 py-2 bg-background" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="border rounded-md px-3 py-2" onClick={() => setCreateOpen(false)}>Cancel</button>
              <button type="submit" disabled={createLoading} className="rounded-md border px-3 py-2 bg-primary text-primary-foreground disabled:opacity-60">{createLoading ? 'Creating…' : 'Create'}</button>
            </div>
          </form>
        </Modal.Content>
      </Modal>

      {/* Edit modal */}
      <Modal open={editOpen} onOpenChange={setEditOpen}>
        <Modal.Content title="Edit Article">
          {editTarget && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void saveEdit(e.currentTarget);
              }}
              className="space-y-4"
            >
              <div className="text-xs text-muted-foreground">ID: {editTarget.id}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input name="title" defaultValue={editTarget.title} placeholder="Title" className="border rounded-md px-3 py-2 bg-background" required />
                <input name="slug" defaultValue={editTarget.slug || ''} placeholder="Slug" className="border rounded-md px-3 py-2 bg-background" />
                <input name="author" defaultValue={editTarget.author || ''} placeholder="Author" className="border rounded-md px-3 py-2 bg-background" />
                <input name="date" defaultValue={editTarget.date} placeholder="Date (YYYY-MM-DD)" className="border rounded-md px-3 py-2 bg-background" />
                <input name="tags" defaultValue={Array.isArray(editTarget.tags) ? editTarget.tags.join(', ') : ''} placeholder="Tags (comma)" className="border rounded-md px-3 py-2 bg-background" />
                <input name="categories" defaultValue={Array.isArray(editTarget.categories || []) ? (editTarget.categories || []).join(', ') : ''} placeholder="Categories (comma)" className="border rounded-md px-3 py-2 bg-background" />
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" name="isFeatured" defaultChecked={Boolean(editTarget.isFeatured)} /> Featured</label>
              </div>
              <input name="excerpt" defaultValue={editTarget.excerpt || ''} placeholder="Excerpt" className="w-full border rounded-md px-3 py-2 bg-background" />
              <textarea name="content" defaultValue={editTarget.content || ''} placeholder="Content (Markdown/HTML)" className="w-full h-40 border rounded-md p-2 bg-background" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input name="imageUrl" defaultValue={editTarget.imageUrl || ''} placeholder="Image URL" className="border rounded-md px-3 py-2 bg-background" />
                <input name="thumbnailUrl" defaultValue={editTarget.thumbnailUrl || ''} placeholder="Thumbnail URL" className="border rounded-md px-3 py-2 bg-background" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input name="link_canonical" defaultValue={editTarget.links?.canonical || ''} placeholder="Link: Canonical" className="border rounded-md px-3 py-2 bg-background" />
                <input name="link_discussion" defaultValue={editTarget.links?.discussion || ''} placeholder="Link: Discussion" className="border rounded-md px-3 py-2 bg-background" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input name="media_thumbnailUrl" defaultValue={editTarget.media?.thumbnailUrl || ''} placeholder="Media: Thumbnail URL" className="border rounded-md px-3 py-2 bg-background" />
                <input name="media_imageUrl" defaultValue={editTarget.media?.imageUrl || ''} placeholder="Media: Image URL" className="border rounded-md px-3 py-2 bg-background" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="border rounded-md px-3 py-2" onClick={() => setEditOpen(false)}>Cancel</button>
                <button type="submit" disabled={saveLoading} className="rounded-md border px-3 py-2 bg-primary text-primary-foreground disabled:opacity-60">{saveLoading ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          )}
        </Modal.Content>
      </Modal>
    </div>
  );
};

export default ArticlesPage;
