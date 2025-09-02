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
import { Plus, Pencil, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
      toast.error((e as Error)?.message ?? 'Create failed');
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
      toast.error((e as Error)?.message ?? 'Save failed');
    } finally {
      setSaveLoading(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!token) return;
    setDeleteLoading(true);
    try {
      await deleteItem('projects', id, token);
      setItems((prev) => prev.filter((x) => x.id !== id));
      toast.success('Project deleted');
    } catch (e) {
      toast.error((e as Error)?.message ?? 'Delete failed');
    } finally {
      setDeleteLoading(false);
      setConfirmOpen(false);
      setConfirmId(null);
    }
  };

  const askDelete = (id: string) => {
    setConfirmId(id);
    setConfirmOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <button
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 bg-primary text-primary-foreground hover:opacity-90 transition"
          onClick={openCreate}
        >
          <Plus size={16} /> New Project
        </button>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : err ? (
        <div className="text-red-600">{err}</div>
      ) : (
        <div className="space-y-3">
          {sorted.map((p) => (
            <div key={p.id} className="border rounded-lg p-4 bg-card transition hover:shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.id} • {p.slug} • {p.date}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="inline-flex items-center gap-2 border rounded-md px-3 py-1 hover:bg-accent"
                    onClick={() => startEdit(p)}
                  >
                    <Pencil size={16} /> Edit
                  </button>
                  <button
                    className="inline-flex items-center gap-2 border rounded-md px-3 py-1 text-red-600 hover:bg-red-500/10"
                    onClick={() => askDelete(p.id)}
                  >
                    <Trash2 size={16} /> Delete
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
              <button type="button" className="border rounded-md px-3 py-2 hover:bg-accent" onClick={() => setCreateOpen(false)}>Cancel</button>
              <button type="submit" disabled={createLoading} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 bg-primary text-primary-foreground disabled:opacity-60 hover:opacity-90">
                {createLoading ? 'Creating…' : (<><Save size={16} /> Create</>)}
              </button>
            </div>
          </form>
        </Modal.Content>
      </Modal>

      {/* Confirm delete */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete project?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The project will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              className="border rounded-md px-3 py-2 hover:bg-accent"
              onClick={() => setConfirmOpen(false)}
              disabled={deleteLoading}
            >
              Cancel
            </button>
            <button
              className="inline-flex items-center gap-2 border rounded-md px-3 py-2 text-red-600 hover:bg-red-500/10"
              onClick={() => confirmId && void onDelete(confirmId)}
              disabled={deleteLoading}
            >
              <Trash2 size={16} /> {deleteLoading ? 'Deleting…' : 'Delete'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <select name="status" defaultValue={editTarget.status || ''} className="border rounded-md px-3 py-2 bg-background">
                  <option value="">Select Status</option>
                  <option value="completed">Completed</option>
                  <option value="in-progress">In Progress</option>
                  <option value="archived">Archived</option>
                </select>
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" name="isFeatured" defaultChecked={Boolean(editTarget.isFeatured)} /> Featured</label>
              </div>
              <textarea name="description" defaultValue={editTarget.description || ''} placeholder="Short description" className="w-full h-24 border rounded-md p-2 bg-background" />
              <textarea name="content" defaultValue={editTarget.content || ''} placeholder="Content (Markdown/HTML)" className="w-full h-40 border rounded-md p-2 bg-background" />
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
                <button type="button" className="border rounded-md px-3 py-2 hover:bg-accent" onClick={() => setEditOpen(false)}>Cancel</button>
                <button type="submit" disabled={saveLoading} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 bg-primary text-primary-foreground disabled:opacity-60 hover:opacity-90">
                  {saveLoading ? 'Saving…' : (<><Save size={16} /> Save</>)}
                </button>
              </div>
            </form>
          )}
        </Modal.Content>
      </Modal>
    </div>
  );
};

export default ProjectsPage;
