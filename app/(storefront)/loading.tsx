import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton, not a spinner — the layout is reserved so nothing shifts in. */
export default function Loading() {
  return (
    <div className="shell py-16" aria-busy aria-live="polite">
      <span className="sr-only">Loading</span>
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-8 h-14 w-2/3 max-w-2xl" />
      <Skeleton className="mt-5 h-4 w-1/2 max-w-xl" />
      <div className="mt-16 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="aspect-4/5 w-full rounded-[20px]" />
            <Skeleton className="mt-5 h-4 w-24" />
            <Skeleton className="mt-3 h-6 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
