"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useMemo, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import type { CatalogResult, SortKey } from "@/types";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "best-selling", label: "Best selling" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
  { value: "rating", label: "Highest rated" },
];

interface CatalogControlsProps {
  facets: CatalogResult["facets"];
  total: number;
  /** Set on a category page: the category filter is implied, so it is hidden. */
  lockedCategory?: string;
}

/**
 * All filter state lives in the URL. That makes it shareable, correct with the
 * back button, and crawlable — and it means the server does the filtering
 * (PRD FR-S2), not the browser.
 */
export function CatalogControls({ facets, total, lockedCategory }: CatalogControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(params.get("q") ?? "");

  const selected = useMemo(
    () => ({
      category: params.get("category") ?? "",
      sizes: params.getAll("size"),
      colours: params.getAll("colour"),
      minPrice: params.get("minPrice"),
      maxPrice: params.get("maxPrice"),
      inStock: params.get("inStock") === "1",
      sort: (params.get("sort") as SortKey | null) ?? "featured",
    }),
    [params]
  );

  const push = useCallback(
    (next: URLSearchParams) => {
      next.delete("page"); // any filter change returns to page one
      const qs = next.toString();
      startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [pathname, router]
  );

  const toggleMulti = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      const existing = next.getAll(key);
      next.delete(key);
      const after = existing.includes(value)
        ? existing.filter((v) => v !== value)
        : [...existing, value];
      for (const v of after) next.append(key, v);
      push(next);
    },
    [params, push]
  );

  const setSingle = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
      push(next);
    },
    [params, push]
  );

  const activeCount =
    (selected.category && !lockedCategory ? 1 : 0) +
    selected.sizes.length +
    selected.colours.length +
    (selected.minPrice ? 1 : 0) +
    (selected.maxPrice ? 1 : 0) +
    (selected.inStock ? 1 : 0);

  const filterPanel = (
    <div className="space-y-8">
      {!lockedCategory && facets.categories.length > 0 && (
        <FilterGroup label="Category">
          {facets.categories.map((category) => (
            <Chip
              key={category.slug}
              active={selected.category === category.slug}
              onClick={() =>
                setSingle("category", selected.category === category.slug ? null : category.slug)
              }
            >
              {category.name}
              <span className="tnum ml-1.5 text-ink-muted">{category.count}</span>
            </Chip>
          ))}
        </FilterGroup>
      )}

      {facets.sizes.length > 0 && (
        <FilterGroup label="Size">
          {facets.sizes.map((size) => (
            <Chip
              key={size.value}
              active={selected.sizes.includes(size.value)}
              onClick={() => toggleMulti("size", size.value)}
            >
              {size.value}
            </Chip>
          ))}
        </FilterGroup>
      )}

      {facets.colours.length > 0 && (
        <FilterGroup label="Colour">
          {facets.colours.map((colour) => (
            <Chip
              key={colour.value}
              active={selected.colours.includes(colour.value)}
              onClick={() => toggleMulti("colour", colour.value)}
            >
              {colour.value}
            </Chip>
          ))}
        </FilterGroup>
      )}

      <FilterGroup label={`Price · ${formatPrice(facets.priceRange.min)} – ${formatPrice(facets.priceRange.max)}`}>
        {[
          { label: "Under 500", min: null, max: "500" },
          { label: "500 – 1,000", min: "500", max: "1000" },
          { label: "1,000 – 2,000", min: "1000", max: "2000" },
          { label: "Over 2,000", min: "2000", max: null },
        ].map((band) => {
          const active = selected.minPrice === band.min && selected.maxPrice === band.max;
          return (
            <Chip
              key={band.label}
              active={active}
              onClick={() => {
                const next = new URLSearchParams(params.toString());
                next.delete("minPrice");
                next.delete("maxPrice");
                if (!active) {
                  if (band.min) next.set("minPrice", band.min);
                  if (band.max) next.set("maxPrice", band.max);
                }
                push(next);
              }}
            >
              {band.label}
            </Chip>
          );
        })}
      </FilterGroup>

      <FilterGroup label="Availability">
        <Chip
          active={selected.inStock}
          onClick={() => setSingle("inStock", selected.inStock ? null : "1")}
        >
          In stock only
        </Chip>
      </FilterGroup>

      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => startTransition(() => router.push(pathname, { scroll: false }))}
        >
          <X className="size-3.5" strokeWidth={1.5} />
          Clear {activeCount} {activeCount === 1 ? "filter" : "filters"}
        </Button>
      )}
    </div>
  );

  return (
    <div className={cn("space-y-6", pending && "opacity-70 transition-opacity")}>
      {/* Stacked: this panel lives in a 260px sidebar on desktop. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-stretch">
        <form
          role="search"
          className="relative w-full sm:max-w-sm lg:max-w-none"
          onSubmit={(event) => {
            event.preventDefault();
            setSingle("q", query.trim() || null);
          }}
        >
          <label htmlFor="catalog-search" className="sr-only">
            Search the collection
          </label>
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
            strokeWidth={1.5}
            aria-hidden
          />
          <Input
            id="catalog-search"
            type="search"
            placeholder="Search cashmere, silk, outerwear…"
            className="pl-11"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </form>

        <div className="flex items-center justify-between gap-3">
          <p className="tnum text-xs whitespace-nowrap text-ink-tertiary" aria-live="polite">
            {total} {total === 1 ? "piece" : "pieces"}
          </p>

          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="size-4" strokeWidth={1.5} />
                  Filters
                  {activeCount > 0 && <Badge tone="accent">{activeCount}</Badge>}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="overflow-y-auto">
                <SheetTitle className="eyebrow">Filters</SheetTitle>
                {filterPanel}
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex flex-1 items-center gap-2 lg:flex-none">
            <label htmlFor="catalog-sort" className="sr-only">
              Sort by
            </label>
            <select
              id="catalog-sort"
              value={selected.sort}
              onChange={(event) => setSingle("sort", event.target.value)}
              className="h-10 w-full cursor-pointer rounded-[10px] border border-hairline-strong bg-canvas-raised px-3 text-[0.8125rem] lg:w-auto text-ink-secondary transition-colors hover:border-hairline-strong focus:outline-2 focus:outline-offset-2 focus:outline-accent-line"
            >
              {SORTS.map((sort) => (
                <option key={sort.value} value={sort.value}>
                  {sort.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="hidden lg:block">{filterPanel}</div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="eyebrow mb-3.5 text-accent-quiet">{label}</legend>
      {/* Chips wrap. They never truncate into an inaccessible overflow. */}
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-9 items-center rounded-full border px-3.5 text-[0.8125rem] transition-colors duration-200",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line",
        active
          ? "border-accent-line/60 bg-accent-wash/40 text-accent-strong"
          : "border-hairline bg-tint text-ink-secondary hover:border-hairline-strong hover:text-ink-primary"
      )}
    >
      {children}
    </button>
  );
}
