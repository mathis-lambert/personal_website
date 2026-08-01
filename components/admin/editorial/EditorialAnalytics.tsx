"use client";

import { BarChart3 } from "lucide-react";
import { useMemo, useState } from "react";

import { AnalyticsRangePicker } from "@/components/admin/analytics/AnalyticsRangePicker";
import { ContentKpiGrid } from "@/components/admin/analytics/ContentKpiGrid";
import { analyticsDates } from "@/lib/analytics/range";
import { ShareChannelBars } from "@/components/admin/analytics/ShareChannelBars";
import { TrafficChart } from "@/components/admin/analytics/TrafficChart";
import { ErrorNote, LoadingRows } from "@/components/admin/shared/primitives";
import type { EditorialDraft } from "@/lib/editorial/draft";
import { useAdminAuth } from "@/components/admin/providers/AdminAuthProvider";
import { useAdminData } from "@/hooks/admin/useAdminData";
import { getContentInsights } from "@/api/admin";

export function EditorialAnalytics({ draft }: { draft: EditorialDraft }) {
  const { token } = useAdminAuth();
  const [days, setDays] = useState(30);
  const kind = draft.kind === "projects" ? "project" : "note";

  const load = useMemo(() => {
    if (!token || !draft._id) return null;
    const range = analyticsDates(days);
    return (signal: AbortSignal) =>
      getContentInsights(
        { kind, itemId: draft._id as string, ...range },
        { token, signal },
      );
  }, [days, draft._id, kind, token]);

  const { data, error, loading } = useAdminData(load);

  if (!draft._id) {
    return (
      <div className="px-5 py-10 text-center">
        <BarChart3 className="mx-auto size-5 text-ink-faint" />
        <p className="mt-3 text-sm font-semibold text-ink">No analytics yet</p>
        <p className="mt-1 text-xs text-ink-muted">Save this document first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-5 py-5">
      <div className="flex items-center justify-between gap-3">
        <p className="t-eyebrow text-ink">Public activity</p>
        <AnalyticsRangePicker days={days} onChange={setDays} compact />
      </div>

      {error ? <ErrorNote message={error} /> : null}
      {loading && !data ? <LoadingRows rows={4} /> : null}

      {data ? (
        <>
          <ContentKpiGrid data={data} />

          <section>
            <div className="mb-2 flex items-baseline justify-between gap-3 border-b border-line pb-2">
              <h3 className="t-eyebrow text-ink">Activity</h3>
              <span className="t-meta text-ink-faint">views · visitors</span>
            </div>
            <TrafficChart
              points={data.traffic}
              granularity={data.range.granularity}
              compact
            />
          </section>

          {data.shareChannels.length ? (
            <section>
              <div className="mb-3 border-b border-line pb-2">
                <h3 className="t-eyebrow text-ink">Share channels</h3>
              </div>
              <ShareChannelBars channels={data.shareChannels} />
            </section>
          ) : null}

          <p className="border-t border-line pt-3 text-[0.6875rem] text-ink-faint">
            Public traffic only · refreshed on load
          </p>
        </>
      ) : null}
    </div>
  );
}
