/**
 * Branded full-bleed loading animation shown by route-level `loading.tsx`
 * Suspense boundaries during navigation/data fetching. A spinning emerald ring
 * around a softly pulsing core.
 */
export function RouteLoader({
  label = 'Loading…',
  className = 'min-h-[70vh]',
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex w-full flex-1 items-center justify-center p-6 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <span className="relative flex size-12 items-center justify-center">
          <span className="border-primary/15 border-t-primary absolute inset-0 animate-spin rounded-full border-[3px]" />
          <span className="bg-primary size-2.5 animate-pulse rounded-full" />
        </span>
        <p className="text-muted-foreground animate-pulse text-sm">{label}</p>
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}
