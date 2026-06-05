export function SkeletonProductCard() {
  return (
    <article className="glass-card overflow-hidden animate-pulse">
      {/* Image placeholder */}
      <div className="h-44 w-full bg-slate-200 dark:bg-slate-700" />
      <div className="p-4 space-y-3">
        {/* Category */}
        <div className="h-3 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
        {/* Title */}
        <div className="h-5 w-3/4 rounded-lg bg-slate-200 dark:bg-slate-700" />
        {/* Description lines */}
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-5/6 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
        {/* Price + Badge row */}
        <div className="flex items-center justify-between pt-2">
          <div className="h-5 w-20 rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="h-6 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    </article>
  );
}
