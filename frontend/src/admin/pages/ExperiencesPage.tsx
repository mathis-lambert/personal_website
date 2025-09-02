import React, { useEffect, useMemo, useState } from 'react';
import { useAdminAuth } from '@/admin/providers/AdminAuthProvider';
import { getCollectionData, updateItem, deleteItem } from '@/api/admin';
import Modal from '@/admin/components/Modal';

type Experience = {
  title: string;
  company: string;
  date: string;
  description: string;
};

const ExperiencesPage: React.FC = () => {
  const { token } = useAdminAuth();
  const [items, setItems] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const sorted = useMemo(() => items, [items]);

  useEffect(() => {
    let canceled = false;
    async function load() {
      if (!token) return;
      setLoading(true);
      setErr(null);
      try {
        const data = await getCollectionData<Experience[]>('experiences', token);
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
    const patch: Experience = {
      title: String(fd.get('title') || ''),
      company: String(fd.get('company') || ''),
      date: String(fd.get('date') || ''),
      description: String(fd.get('description') || ''),
    };
    setSaveLoading(true);
    try {
      const id = `index-${editIndex}`;
      const res = await updateItem('experiences', id, patch, token);
      setItems((prev) => prev.map((it, i) => (i === editIndex ? (res.item as Experience) : it)));
      setEditOpen(false);
      setEditIndex(null);
    } catch (e) {
      alert((e as Error)?.message ?? 'Save failed');
    } finally {
      setSaveLoading(false);
    }
  };

  const onDelete = async (idx: number) => {
    if (!token) return;
    if (!confirm('Delete this experience?')) return;
    try {
      await deleteItem('experiences', `index-${idx}`, token);
      setItems((prev) => prev.filter((_, i) => i !== idx));
    } catch (e) {
      alert((e as Error)?.message ?? 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Experiences</h1>
      {loading ? (
        <div>Loading…</div>
      ) : err ? (
        <div className="text-red-600">{err}</div>
      ) : (
        <div className="space-y-3">
          {sorted.map((e, idx) => (
            <div key={idx} className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{e.title}</div>
                  <div className="text-xs text-muted-foreground">{e.company} • {e.date}</div>
                </div>
                <div className="flex gap-2">
                  <button className="border rounded-md px-3 py-1" onClick={() => startEdit(idx)}>Edit</button>
                  <button className="border rounded-md px-3 py-1" onClick={() => onDelete(idx)}>Delete</button>
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{e.description}</p>
            </div>
          ))}
        </div>
      )}

      <Modal open={editOpen} onOpenChange={setEditOpen}>
        <Modal.Content title="Edit Experience">
          {editIndex !== null && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void saveEdit(e.currentTarget);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input name="title" defaultValue={items[editIndex]?.title} placeholder="Title" className="border rounded-md px-3 py-2 bg-background" required />
                <input name="company" defaultValue={items[editIndex]?.company} placeholder="Company" className="border rounded-md px-3 py-2 bg-background" required />
                <input name="date" defaultValue={items[editIndex]?.date} placeholder="Date" className="border rounded-md px-3 py-2 bg-background" />
              </div>
              <textarea name="description" defaultValue={items[editIndex]?.description} placeholder="Description" className="w-full h-40 border rounded-md p-2 bg-background" />
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

export default ExperiencesPage;
