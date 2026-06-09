export function SkeletonVetCard() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-md ring-1 ring-slate-100 dark:ring-slate-800 animate-pulse flex flex-col">
      {/* Cover image placeholder */}
      <div className="h-48 w-full bg-slate-200 dark:bg-slate-700" />
      <div className="p-6 flex-1 flex flex-col space-y-4">
        {/* Clinic name, Doctor name, City */}
        <div className="flex items-start justify-between mb-2">
          <div className="space-y-2 flex-1 pr-2">
            <div className="h-5 w-3/4 rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-2 mt-2">
              <div className="h-3.5 w-3.5 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
              <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
          <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-700 ml-2" />
        </div>
        
        {/* Buttons placeholder */}
        <div className="mt-auto pt-3 flex flex-col gap-2">
          <div className="h-9 w-full rounded-xl bg-slate-200 dark:bg-slate-700" />
          <div className="h-9 w-full rounded-xl bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    </div>
  );
}
