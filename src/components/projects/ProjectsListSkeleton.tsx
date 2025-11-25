"use client";

const ProjectsListSkeleton = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 min-h-[60vh]">
      <div className="animate-pulse space-y-6">
        <div className="rounded-3xl backdrop-blur-xl border border-white/30 bg-white/20 dark:bg-gray-800/20 px-4 py-4 sm:px-6 sm:py-6 shadow-lg dark:border-white/10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="h-10 w-full lg:w-72 rounded-2xl bg-white/50 dark:bg-gray-700/50" />
            <div className="flex flex-wrap gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-9 w-28 rounded-2xl bg-white/50 dark:bg-gray-700/50"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-3xl backdrop-blur-xl border border-white/40 bg-white/30 dark:bg-gray-800/30 dark:border-white/10 shadow-md p-5 space-y-4"
            >
              <div className="h-44 rounded-2xl bg-white/60 dark:bg-gray-700/50" />
              <div className="h-6 w-4/5 rounded bg-white/70 dark:bg-gray-700/60" />
              <div className="h-4 w-3/4 rounded bg-white/60 dark:bg-gray-700/50" />
              <div className="h-4 w-1/2 rounded bg-white/60 dark:bg-gray-700/50" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, tagIdx) => (
                  <div
                    key={tagIdx}
                    className="h-6 w-20 rounded-full bg-white/70 dark:bg-gray-700/60 border border-white/30 dark:border-white/10"
                  />
                ))}
              </div>
              <div className="flex gap-3">
                <div className="h-10 w-24 rounded-lg bg-white/70 dark:bg-gray-700/60" />
                <div className="h-10 w-24 rounded-lg bg-white/70 dark:bg-gray-700/60" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectsListSkeleton;
