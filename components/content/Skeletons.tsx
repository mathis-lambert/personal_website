import { CardGrid, Page } from "@/components/ds";
import { cn } from "@/lib/utils";

/** Loading placeholders: one file, one shimmer treatment. */

const bar = "rounded-2 bg-paper-sink";

function Bar({ className }: { className?: string }) {
  return <div className={cn(bar, className)} aria-hidden="true" />;
}

function CardSkeleton() {
  return (
    <div className="surface-quiet flex h-full flex-col overflow-hidden">
      <Bar className="m-2.5 mb-0 h-40 rounded-4 sm:h-44" />
      <div className="flex flex-1 flex-col p-5">
        <Bar className="mb-3 h-2.5 w-24" />
        <Bar className="h-6 w-4/5" />
        <div className="mt-3 space-y-2">
          <Bar className="h-3 w-full" />
          <Bar className="h-3 w-11/12" />
        </div>
        <div className="mt-4 flex gap-3">
          <Bar className="h-2.5 w-20" />
          <Bar className="h-2.5 w-24" />
        </div>
        <div className="mt-auto flex gap-1.5 pt-5">
          <Bar className="h-6 w-16 rounded-full" />
          <Bar className="h-6 w-20 rounded-full" />
        </div>
        <Bar className="mt-4 h-4 w-28" />
      </div>
    </div>
  );
}

/** Index pages: masthead, filter row, card grid. */
export function ListSkeleton({
  cards = 6,
  kind,
}: {
  cards?: number;
  kind: "projects" | "notes";
}) {
  const filterWidths =
    kind === "projects"
      ? ["w-44", "w-24", "w-28", "w-24", "w-28"]
      : ["w-44", "w-24", "w-28"];

  return (
    <Page as="section" className="animate-pulse">
      <div className="pb-10 pt-8 sm:pb-12 sm:pt-12">
        <Bar className="mb-4 h-2.5 w-44" />
        <Bar className="h-14 w-11/12 max-w-4xl sm:h-20" />
        <div className="mt-5 max-w-2xl space-y-2.5">
          <Bar className="h-4 w-full" />
          <Bar className="h-4 w-4/5" />
        </div>
      </div>

      <div className="mb-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Bar className="h-11 min-w-64 flex-1 rounded-full" />
          <div className="flex flex-wrap gap-2">
            {filterWidths.map((width, index) => (
              <Bar key={index} className={cn("h-11 rounded-full", width)} />
            ))}
          </div>
        </div>
        <Bar className="mt-5 h-2.5 w-16" />
      </div>

      <CardGrid className="pb-24">
        {Array.from({ length: cards }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </CardGrid>
    </Page>
  );
}

/** Detail pages: header block, cover, body lines. */
export function DetailSkeleton({ kind }: { kind: "project" | "note" }) {
  return (
    <div className="animate-pulse">
      <Page className="pt-10">
        <Bar className="h-3 w-48" />
      </Page>

      <Page narrow as="header" className="pb-12">
        <Bar className="mb-6 h-2.5 w-28" />
        <Bar className="h-14 w-full sm:h-20" />
        <Bar className="mt-3 h-14 w-3/4 sm:h-20" />
        <div className="mt-7 space-y-2.5">
          <Bar className="h-4 w-full" />
          <Bar className="h-4 w-5/6" />
        </div>
        <Bar className="mt-8 h-2.5 w-72" />
        <div className="mt-5 flex gap-2">
          <Bar className="h-6 w-16 rounded-full" />
          <Bar className="h-6 w-20 rounded-full" />
          {kind === "note" ? <Bar className="h-6 w-14 rounded-full" /> : null}
        </div>
        <div className="mt-9 flex gap-2.5">
          <Bar className="h-9 w-28 rounded-full" />
          <Bar className="h-9 w-24 rounded-full" />
        </div>
        <Bar className="mt-12 h-px w-full rounded-none" />
      </Page>

      <Page narrow className="pb-14">
        <Bar className="aspect-[16/9] w-full rounded-4" />
      </Page>

      <Page narrow className="pb-28">
        <Bar className="mb-6 h-8 w-2/5" />
        <div className="space-y-3.5">
          {["w-full", "w-11/12", "w-full", "w-4/5"].map((width, index) => (
            <Bar key={index} className={cn("h-4", width)} />
          ))}
        </div>
        <Bar className="mb-6 mt-12 h-8 w-1/3" />
        <div className="space-y-3.5">
          {["w-full", "w-10/12", "w-full", "w-3/5"].map((width, index) => (
            <Bar key={index} className={cn("h-4", width)} />
          ))}
        </div>
      </Page>
    </div>
  );
}

/** Resume: header plus the two-column body. */
export function ResumeSkeleton() {
  return (
    <Page className="animate-pulse pb-28 pt-20">
      <Bar className="mb-6 h-2.5 w-32" />
      <Bar className="h-12 w-72 sm:h-16" />
      <Bar className="mt-6 h-4 w-full max-w-xl" />

      <div className="mt-16 grid gap-14 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-12">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <Bar className="h-3 w-24" />
              <Bar className="h-6 w-3/4" />
              <Bar className="h-3 w-1/3" />
              <div className="space-y-2 pt-2">
                <Bar className="h-3 w-full" />
                <Bar className="h-3 w-5/6" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-12">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <Bar className="h-3 w-20" />
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 6 }).map((_, chip) => (
                  <Bar key={chip} className="h-6 w-16 rounded-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Page>
  );
}
