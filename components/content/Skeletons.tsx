import { CardGrid, Page } from "@/components/ds";
import { cn } from "@/lib/utils";

/** Loading placeholders: one file, one shimmer treatment. */

const bar = "rounded-2 bg-paper-sink";

function Bar({ className }: { className?: string }) {
  return <div className={cn(bar, className)} aria-hidden="true" />;
}

function CardSkeleton() {
  return (
    <div className="surface-quiet overflow-hidden p-2.5">
      <Bar className="h-44 rounded-4 sm:h-52" />
      <div className="space-y-3.5 p-4 pt-6">
        <Bar className="h-2.5 w-20" />
        <Bar className="h-6 w-4/5" />
        <Bar className="h-3 w-1/2" />
        <div className="space-y-2 pt-2">
          <Bar className="h-3 w-full" />
          <Bar className="h-3 w-11/12" />
        </div>
        <div className="flex gap-1.5 pt-2">
          <Bar className="h-6 w-16 rounded-full" />
          <Bar className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** Index pages: masthead, filter row, card grid. */
export function ListSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <Page as="section" className="animate-pulse">
      <div className="pb-14 pt-14 sm:pb-20 sm:pt-20">
        <Bar className="mb-6 h-2.5 w-40" />
        <Bar className="h-14 w-11/12 max-w-3xl sm:h-20" />
        <Bar className="mt-6 h-4 w-full max-w-xl" />
      </div>

      <div className="mb-12 flex flex-wrap gap-3">
        <Bar className="h-11 min-w-64 flex-1 rounded-full" />
        <Bar className="h-11 w-44 rounded-full" />
        <Bar className="h-11 w-28 rounded-full" />
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
export function DetailSkeleton() {
  return (
    <div className="animate-pulse">
      <Page narrow className="pb-12 pt-20">
        <Bar className="mb-6 h-2.5 w-28" />
        <Bar className="h-12 w-full sm:h-16" />
        <Bar className="mt-4 h-12 w-2/3 sm:h-16" />
        <Bar className="mt-7 h-4 w-5/6" />
        <Bar className="mt-8 h-3 w-52" />
      </Page>

      <Page className="pb-14">
        <Bar className="aspect-[16/9] w-full rounded-4" />
      </Page>

      <Page narrow className="space-y-3.5 pb-28">
        {[
          "w-full",
          "w-11/12",
          "w-full",
          "w-4/5",
          "w-full",
          "w-10/12",
          "w-full",
          "w-3/5",
        ].map((width, index) => (
          <Bar key={index} className={cn("h-4", width)} />
        ))}
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
