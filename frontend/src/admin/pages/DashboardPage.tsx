import React, { useEffect, useState } from 'react';
import { useAdminAuth } from '@/admin/providers/AdminAuthProvider';
import { getCollectionData } from '@/api/admin';
import type { Article, Project } from '@/types';
import type { TimelineData } from '@/components/ui/ScrollableTimeline';

const DashboardPage: React.FC = () => {
  const { token } = useAdminAuth();
  const [counts, setCounts] = useState<{ [k: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    const ac = new AbortController();
    async function load() {
      if (!token) return;
      setLoading(true);
      setErr(null);
      try {
        const [projects, articles, experiences, studies] = await Promise.all([
          getCollectionData<Project[]>('projects', token),
          getCollectionData<Article[]>('articles', token),
          getCollectionData<TimelineData[]>('experiences', token),
          getCollectionData<TimelineData[]>('studies', token),
        ]);
        if (!canceled)
          setCounts({
            projects: Array.isArray(projects) ? projects.length : 0,
            articles: Array.isArray(articles) ? articles.length : 0,
            experiences: Array.isArray(experiences) ? experiences.length : 0,
            studies: Array.isArray(studies) ? studies.length : 0,
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
      ac.abort();
    };
  }, [token]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      {loading ? (
        <div>Loading…</div>
      ) : err ? (
        <div className="text-red-600">{err}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(counts).map(([k, v]) => (
            <div key={k} className="rounded-lg border p-4 bg-card">
              <div className="text-sm text-muted-foreground">{k}</div>
              <div className="text-2xl font-semibold">{v}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

