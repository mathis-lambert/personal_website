'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useAdminAuth } from '@/admin/providers/AdminAuthProvider';
import {
  getCollectionData,
  updateItem,
  deleteItem,
  replaceCollection,
} from '@/api/admin';
import Modal from '@/admin/components/Modal';
import { Pencil, Trash2, Save, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Study = {
  title: string;
  company: string;
  date: string;
  description: string;
};

const StudiesPage: React.FC = () => {
  const { token } = useAdminAuth();
  const [items, setItems] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmIndex, setConfirmIndex] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const sorted = useMemo(() => items, [items]);

  useEffect(() => {
    let canceled = false;
    async function load() {
      if (!token) return;
      setLoading(true);
      setErr(null);
      try {
        const data = await getCollectionData<Study[]>('studies', token);
        if (!canceled) setItems(Array.isArray(data) ? data : []);
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

  const startEdit = (idx: number) => {
    setEditIndex(idx);
    setEditOpen(true);
  };

  const saveEdit = async (form: HTMLFormElement) => {
    if (!token || editIndex === null) return;
    const fd = new FormData(form);
    const patch: Study = {
      title: String(fd.get('title') || ''),
      company: String(fd.get('company') || ''),
      date: String(fd.get('date') || ''),
      description: String(fd.get('description') || ''),
    };
    setSaveLoading(true);
    try {
      const id = `index-${editIndex}`;
      const res = await updateItem('studies', id, patch, token);
      setItems((prev) =>
        prev.map((it, i) => (i === editIndex ? (res.item as Study) : it)),
      );
      setEditOpen(false);
      setEditIndex(null);
    } catch (e) {
      toast.error((e as Error)?.message ?? 'Save failed');
    } finally {
      setSaveLoading(false);
    }
  };

  const onDelete = async (idx: number) => {
    if (!token) return;
    setDeleteLoading(true);
    try {
      await deleteItem('studies', `index-${idx}`, token);
      setItems((prev) => prev.filter((_, i) => i !== idx));
      toast.success('Study deleted');
    } catch (e) {
      toast.error((e as Error)?.message ?? 'Delete failed');
    } finally {
      setDeleteLoading(false);
      setConfirmOpen(false);
      setConfirmIndex(null);
    }
  };

  const askDelete = (idx: number) => {
    setConfirmIndex(idx);
    setConfirmOpen(true);
  };

  const onCreate = async (form: HTMLFormElement) => {
    if (!token) return;
    const fd = new FormData(form);
    const nextItem: Study = {
      title: String(fd.get('title') || '').trim(),
      company: String(fd.get('company') || '').trim(),
      date: String(fd.get('date') || '').trim(),
      description: String(fd.get('description') || '').trim(),
    };
    if (!nextItem.title || !nextItem.company) {
      toast.error('Title and company are required');
      return;
    }
    setCreateLoading(true);
    try {
      const payload = [...items, nextItem];
      await replaceCollection('studies', payload, token);
      setItems(payload);
      setCreateOpen(false);
      toast.success('Study added');
    } catch (e) {
      toast.error((e as Error)?.message ?? 'Create failed');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Studies</h1>
        <button
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 bg-primary text-primary-foreground hover:opacity-90 transition"
          onClick={() => setCreateOpen(true)}
        >
          <Plus size={16} /> New Study
        </button>
      </div>
      {loading ? (
        <div>Loading…</div>
      ) : err ? (
        <div className="text-red-600">{err}</div>
      ) : (
        <div className="space-y-3">
          {sorted.map((s, idx) => (
            <div key={idx} className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{s.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.company} • {s.date}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="inline-flex items-center gap-2 border rounded-md px-3 py-1 hover:bg-accent"
                    onClick={() => startEdit(idx)}
                  >
                    <Pencil size={16} /> Edit
                  </button>
                  <button
                    className="inline-flex items-center gap-2 border rounded-md px-3 py-1 text-red-600 hover:bg-red-500/10"
                    onClick={() => askDelete(idx)}
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                {s.description}
              </p>
            </div>
          ))}
        </div>
      )}

      <Modal open={editOpen} onOpenChange={setEditOpen}>
        <Modal.Content title="Edit Study">
          {editIndex !== null && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void saveEdit(e.currentTarget);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  name="title"
                  defaultValue={items[editIndex]?.title}
                  placeholder="Title"
                  className="border rounded-md px-3 py-2 bg-background"
                  required
                />
                <input
                  name="company"
                  defaultValue={items[editIndex]?.company}
                  placeholder="Company"
                  className="border rounded-md px-3 py-2 bg-background"
                  required
                />
                <input
                  name="date"
                  defaultValue={items[editIndex]?.date}
                  placeholder="Date"
                  className="border rounded-md px-3 py-2 bg-background"
                />
              </div>
              <textarea
                name="description"
                defaultValue={items[editIndex]?.description}
                placeholder="Description"
                className="w-full h-40 border rounded-md p-2 bg-background"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="border rounded-md px-3 py-2 hover:bg-accent"
                  onClick={() => setEditOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="inline-flex items-center gap-2 rounded-md border px-3 py-2 bg-primary text-primary-foreground disabled:opacity-60 hover:opacity-90"
                >
                  {saveLoading ? (
                    'Saving…'
                  ) : (
                    <>
                      <Save size={16} /> Save
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </Modal.Content>
      </Modal>

      {/* Create modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Study</DialogTitle>
            <DialogDescription>
              Fill in the details for the new study.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void onCreate(e.currentTarget);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                name="title"
                placeholder="Title"
                className="border rounded-md px-3 py-2 bg-background"
                required
              />
              <input
                name="company"
                placeholder="Company"
                className="border rounded-md px-3 py-2 bg-background"
                required
              />
              <input
                name="date"
                placeholder="Date"
                className="border rounded-md px-3 py-2 bg-background"
              />
            </div>
            <textarea
              name="description"
              placeholder="Description"
              className="w-full h-40 border rounded-md p-2 bg-background"
            />
            <DialogFooter>
              <button
                type="button"
                className="border rounded-md px-3 py-2 hover:bg-accent"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createLoading}
                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 bg-primary text-primary-foreground disabled:opacity-60 hover:opacity-90"
              >
                {createLoading ? (
                  'Creating…'
                ) : (
                  <>
                    <Save size={16} /> Create
                  </>
                )}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm delete */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete study?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The study will be permanently
              removed.
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
              onClick={() =>
                confirmIndex !== null && void onDelete(confirmIndex)
              }
              disabled={deleteLoading}
            >
              <Trash2 size={16} /> {deleteLoading ? 'Deleting…' : 'Delete'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudiesPage;
