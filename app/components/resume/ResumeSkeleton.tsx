"use client";

const glass =
  "rounded-3xl backdrop-blur-2xl border border-black/10 dark:border-white/20 bg-white/50 dark:bg-gray-800/50 shadow-lg";

const line = "rounded bg-white/70 dark:bg-gray-700/60";

const ResumeSkeleton = () => {
  return (
    <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 animate-pulse space-y-6">
      {/* Header */}
      <div className={`${glass} p-6 sm:p-8 space-y-4`}>
        <div className="h-8 w-48 rounded-2xl bg-white/80 dark:bg-gray-700/70" />
        <div className="h-4 w-64 rounded-2xl bg-white/60 dark:bg-gray-700/60" />
        <div className="flex flex-wrap gap-2 pt-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-20 rounded-full bg-white/60 dark:bg-gray-700/60 border border-white/40 dark:border-white/10"
            />
          ))}
        </div>
        <div className="h-10 w-36 rounded-2xl bg-white/70 dark:bg-gray-700/60" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-2">
          {/* Experience */}
          <div className={`${glass} p-6 space-y-5`}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white/70 dark:bg-gray-700/60" />
              <div className="h-5 w-32 rounded-2xl bg-white/70 dark:bg-gray-700/60" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-white/50 dark:border-white/10 bg-white/40 dark:bg-gray-800/60 p-4 space-y-3"
                >
                  <div className="h-5 w-3/4 rounded-2xl bg-white/70 dark:bg-gray-700/60" />
                  <div className="h-4 w-1/2 rounded-2xl bg-white/60 dark:bg-gray-700/50" />
                  <div className="space-y-2 pt-1">
                    <div className={`${line} h-3 w-full`} />
                    <div className={`${line} h-3 w-5/6`} />
                    <div className={`${line} h-3 w-3/5`} />
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {Array.from({ length: 4 }).map((_, tagIdx) => (
                      <div
                        key={tagIdx}
                        className="h-6 w-16 rounded-full bg-white/70 dark:bg-gray-700/60 border border-white/40 dark:border-white/10"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Technical skills */}
          <div className={`${glass} p-6 space-y-4`}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white/70 dark:bg-gray-700/60" />
              <div className="h-5 w-40 rounded-2xl bg-white/70 dark:bg-gray-700/60" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, col) => (
                <div key={col} className="space-y-3">
                  <div className="h-3 w-28 rounded bg-white/60 dark:bg-gray-700/50" />
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 6 }).map((_, chip) => (
                      <div
                        key={chip}
                        className="h-6 w-16 rounded-full bg-white/70 dark:bg-gray-700/60 border border-white/40 dark:border-white/10"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Education */}
          <div className={`${glass} p-6 space-y-4`}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white/70 dark:bg-gray-700/60" />
              <div className="h-5 w-28 rounded-2xl bg-white/70 dark:bg-gray-700/60" />
            </div>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className={`${line} h-4 w-3/4`} />
                <div className={`${line} h-3 w-1/2`} />
                <div className={`${line} h-3 w-2/3`} />
              </div>
            ))}
          </div>

          {/* Passions / extras */}
          <div className={`${glass} p-6 space-y-4`}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white/70 dark:bg-gray-700/60" />
              <div className="h-5 w-24 rounded-2xl bg-white/70 dark:bg-gray-700/60" />
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-6 w-16 rounded-full bg-white/70 dark:bg-gray-700/60 border border-white/40 dark:border-white/10"
                />
              ))}
            </div>
            <div className="space-y-2">
              <div className={`${line} h-3 w-full`} />
              <div className={`${line} h-3 w-5/6`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeSkeleton;
