import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton, not a spinner — the layout is reserved so nothing shifts in.
 *
 * This lives on `/collection` alone, NOT at the storefront root, and that is
 * load-bearing. A `loading.tsx` makes Next stream the response: the shell goes
 * out with `200 OK` before the page body runs, so a later `notFound()` cannot
 * change the status. At the root it turned every missing product, category,
 * journal entry and CMS page into a **soft 404** — a page that says "404" and
 * returns 200, which search engines index as real (Memory.md D-038).
 *
 * Only put a loading boundary on a segment whose pages can never call
 * `notFound()`. Filtering the catalogue is genuinely slow and always resolves,
 * so it earns one; a product page does not.
 */
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
