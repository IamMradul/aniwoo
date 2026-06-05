export function SkeletonVetCard() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-md ring-1 ring-slate-100 dark:ring-slate-800 animate-pulse flex flex-col">
      {/* Cover image placeholder */}
      <div className="h-48 w-full bg-slate-200 dark:bg-slate-700" />
      <div className="p-6 flex-1 flex flex-col space-y-4">
        {/* Clinic name + icon row */}
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-5 w-3/4 rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-700 ml-2" />
        </div>
        {/* Info lines */}
        <div className="space-y-3">
          <div className="flex gap-2 items-center">
            <div className="h-4 w-4 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
            <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="flex gap-2 items-center">
            <div className="h-4 w-4 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
            <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="flex gap-2 items-center">
            <div className="h-4 w-4 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
            <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
        {/* Button placeholder */}
        <div className="mt-auto pt-4">
          <div className="h-10 w-full rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    </div>
  );
}
