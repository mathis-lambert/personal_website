import React, { useEffect, useMemo, useState } from 'react';
import { useAdminAuth } from '@/admin/providers/AdminAuthProvider';
import {
  createItem,
  deleteItem,
  getCollectionData,
  updateItem,
} from '@/api/admin';
import Modal from '@/admin/components/Modal';
import type { Project, ProjectStatus } from '@/types';
import type { AdminCreateProjectInput, AdminUpdateProjectInput } from '@/admin/types';

// Use shared Project type from '@/types'

const ProjectsPage: React.FC = () => {
  const { token } = useAdminAuth();
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
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

  function splitCSV(v: string): string[] {
    return v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const openCreate = () => setCreateOpen(true);

  const onCreate = async (form: HTMLFormElement) => {
    if (!token) return;
    const fd = new FormData(form);
    const body: AdminCreateProjectInput = {
      title: String(fd.get('title') || ''),
      slug: String(fd.get('slug') || '') || undefined,
      subtitle: String(fd.get('subtitle') || '') || undefined,
      description: String(fd.get('description') || '') || undefined,
      content: String(fd.get('content') || '') || undefined,
      date: String(fd.get('date') || new Date().toISOString().slice(0, 10)),
      technologies: splitCSV(String(fd.get('technologies') || '')),
      categories: splitCSV(String(fd.get('categories') || '')),
      status: String(fd.get('status')) as ProjectStatus || undefined,
      isFeatured: fd.get('isFeatured') === 'on',
      imageUrl: String(fd.get('imageUrl') || '') || undefined,
      thumbnailUrl: String(fd.get('thumbnailUrl') || '') || undefined,
      projectUrl: String(fd.get('projectUrl') || '') || undefined,
      repoUrl: String(fd.get('repoUrl') || '') || undefined,
      links: {
        live: String(fd.get('link_live') || '') || undefined,
        repo: String(fd.get('link_repo') || '') || undefined,
        docs: String(fd.get('link_docs') || '') || undefined,
        video: String(fd.get('link_video') || '') || undefined,
      },
      media: {
        thumbnailUrl: String(fd.get('media_thumbnailUrl') || '') || undefined,
        imageUrl: String(fd.get('media_imageUrl') || '') || undefined,
        videoUrl: String(fd.get('media_videoUrl') || '') || undefined,
      },
    };
    setCreateLoading(true);
    try {
      const res = await createItem('projects', body, token);
      setItems((prev) => [...prev, res.item as Project]);
      setCreateOpen(false);
    } catch (e) {
      alert((e as Error)?.message ?? 'Create failed');
    } finally {
      setCreateLoading(false);
    }
  };

  const startEdit = (p: Project) => {
    setEditTarget(p);
    setEditOpen(true);
  };

  const saveEdit = async (form: HTMLFormElement) => {
    if (!token || !editTarget) return;
    const fd = new FormData(form);
    const patch: AdminUpdateProjectInput = {
      // id not editable here
      slug: String(fd.get('slug') || '') || undefined,
      title: String(fd.get('title') || ''),
      subtitle: String(fd.get('subtitle') || '') || undefined,
      description: String(fd.get('description') || '') || undefined,
      content: String(fd.get('content') || '') || undefined,
      date: String(fd.get('date') || editTarget.date),
      technologies: splitCSV(String(fd.get('technologies') || '')),
      categories: splitCSV(String(fd.get('categories') || '')),
      status: String(fd.get('status')) as ProjectStatus || undefined,
      isFeatured: fd.get('isFeatured') === 'on',
      imageUrl: String(fd.get('imageUrl') || '') || undefined,
      thumbnailUrl: String(fd.get('thumbnailUrl') || '') || undefined,
      projectUrl: String(fd.get('projectUrl') || '') || undefined,
      repoUrl: String(fd.get('repoUrl') || '') || undefined,
      links: {
        live: String(fd.get('link_live') || '') || undefined,
        repo: String(fd.get('link_repo') || '') || undefined,
        docs: String(fd.get('link_docs') || '') || undefined,
        video: String(fd.get('link_video') || '') || undefined,
      },
      media: {
        thumbnailUrl: String(fd.get('media_thumbnailUrl') || '') || undefined,
        imageUrl: String(fd.get('media_imageUrl') || '') || undefined,
        videoUrl: String(fd.get('media_videoUrl') || '') || undefined,
      },
    };
    setSaveLoading(true);
    try {
      const res = await updateItem('projects', editTarget.id, patch, token);
      setItems((prev) =>
        prev.map((it) => (it.id === editTarget.id ? (res.item as Project) : it)),
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

      <div className="flex justify-end">
        <button
          className="rounded-md border px-3 py-2 bg-primary text-primary-foreground"
          onClick={openCreate}
        >
          New Project
        </button>
      </div>

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
                  <button
                    className="border rounded-md px-3 py-1"
                    onClick={() => startEdit(p)}
                  >
                    Edit
                  </button>
                  <button
                    className="border rounded-md px-3 py-1"
                    onClick={() => onDelete(p.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {Array.isArray(p.technologies) && p.technologies.length > 0
                  ? p.technologies.join(', ')
                  : '—'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={createOpen} onOpenChange={setCreateOpen}>
        <Modal.Content title="Create Project">
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
              <input name="subtitle" placeholder="Subtitle" className="border rounded-md px-3 py-2 bg-background" />
              <input name="date" placeholder="Date (YYYY-MM-DD)" className="border rounded-md px-3 py-2 bg-background" />
              <input name="technologies" placeholder="Technologies (comma)" className="border rounded-md px-3 py-2 bg-background" />
              <input name="categories" placeholder="Categories (comma)" className="border rounded-md px-3 py-2 bg-background" />
              <input name="status" placeholder="Status" className="border rounded-md px-3 py-2 bg-background" />
              <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" name="isFeatured" /> Featured</label>
            </div>
            <textarea name="description" placeholder="Short description" className="w-full h-24 border rounded-md p-2 bg-background" />
            <textarea name="content" placeholder="Content (Markdown/HTML)" className="w-full h-40 border rounded-md p-2 bg-background" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input name="imageUrl" placeholder="Image URL" className="border rounded-md px-3 py-2 bg-background" />
              <input name="thumbnailUrl" placeholder="Thumbnail URL" className="border rounded-md px-3 py-2 bg-background" />
              <input name="projectUrl" placeholder="Project URL" className="border rounded-md px-3 py-2 bg-background" />
              <input name="repoUrl" placeholder="Repo URL" className="border rounded-md px-3 py-2 bg-background" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input name="link_live" placeholder="Link: Live" className="border rounded-md px-3 py-2 bg-background" />
              <input name="link_repo" placeholder="Link: Repo" className="border rounded-md px-3 py-2 bg-background" />
              <input name="link_docs" placeholder="Link: Docs" className="border rounded-md px-3 py-2 bg-background" />
              <input name="link_video" placeholder="Link: Video" className="border rounded-md px-3 py-2 bg-background" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input name="media_thumbnailUrl" placeholder="Media: Thumbnail URL" className="border rounded-md px-3 py-2 bg-background" />
              <input name="media_imageUrl" placeholder="Media: Image URL" className="border rounded-md px-3 py-2 bg-background" />
              <input name="media_videoUrl" placeholder="Media: Video URL" className="border rounded-md px-3 py-2 bg-background" />
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
        <Modal.Content title="Edit Project">
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
                <input name="subtitle" defaultValue={editTarget.subtitle || ''} placeholder="Subtitle" className="border rounded-md px-3 py-2 bg-background" />
                <input name="date" defaultValue={editTarget.date} placeholder="Date (YYYY-MM-DD)" className="border rounded-md px-3 py-2 bg-background" />
                <input name="technologies" defaultValue={Array.isArray(editTarget.technologies) ? editTarget.technologies.join(', ') : ''} placeholder="Technologies (comma)" className="border rounded-md px-3 py-2 bg-background" />
                <input name="categories" defaultValue={Array.isArray(editTarget.categories || []) ? (editTarget.categories || []).join(', ') : ''} placeholder="Categories (comma)" className="border rounded-md px-3 py-2 bg-background" />
                <input name="status" defaultValue={editTarget.status || ''} placeholder="Status" className="border rounded-md px-3 py-2 bg-background" />
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" name="isFeatured" defaultChecked={Boolean(editTarget.isFeatured)} /> Featured</label>
              </div>
              <textarea name="description" defaultValue={editTarget.description || ''} placeholder="Short description" className="w-full h-24 border rounded-md p-2 bg-background" />
              <textarea name="content" defaultValue={editTarget.content || ''} placeholder="Content (Markdown/HTML)" className="w-full h-40 border rounded-md p-2 bg-background" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input name="imageUrl" defaultValue={editTarget.imageUrl || ''} placeholder="Image URL" className="border rounded-md px-3 py-2 bg-background" />
                <input name="thumbnailUrl" defaultValue={editTarget.thumbnailUrl || ''} placeholder="Thumbnail URL" className="border rounded-md px-3 py-2 bg-background" />
                <input name="projectUrl" defaultValue={editTarget.projectUrl || ''} placeholder="Project URL" className="border rounded-md px-3 py-2 bg-background" />
                <input name="repoUrl" defaultValue={editTarget.repoUrl || ''} placeholder="Repo URL" className="border rounded-md px-3 py-2 bg-background" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input name="link_live" defaultValue={editTarget.links?.live || ''} placeholder="Link: Live" className="border rounded-md px-3 py-2 bg-background" />
                <input name="link_repo" defaultValue={editTarget.links?.repo || ''} placeholder="Link: Repo" className="border rounded-md px-3 py-2 bg-background" />
                <input name="link_docs" defaultValue={editTarget.links?.docs || ''} placeholder="Link: Docs" className="border rounded-md px-3 py-2 bg-background" />
                <input name="link_video" defaultValue={editTarget.links?.video || ''} placeholder="Link: Video" className="border rounded-md px-3 py-2 bg-background" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input name="media_thumbnailUrl" defaultValue={editTarget.media?.thumbnailUrl || ''} placeholder="Media: Thumbnail URL" className="border rounded-md px-3 py-2 bg-background" />
                <input name="media_imageUrl" defaultValue={editTarget.media?.imageUrl || ''} placeholder="Media: Image URL" className="border rounded-md px-3 py-2 bg-background" />
                <input name="media_videoUrl" defaultValue={editTarget.media?.videoUrl || ''} placeholder="Media: Video URL" className="border rounded-md px-3 py-2 bg-background" />
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

export default ProjectsPage;
