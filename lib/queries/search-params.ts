import type { CatalogFilters, SortKey } from "@/types";

const VALID_SORTS: SortKey[] = [
  "featured",
  "price-asc",
  "price-desc",
  "newest",
  "best-selling",
  "rating",
];

export type RawSearchParams = Record<string, string | string[] | undefined>;

const asArray = (value: string | string[] | undefined): string[] =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];

const asString = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

const asNumber = (value: string | string[] | undefined): number | undefined => {
  const raw = asString(value);
  if (raw === undefined || raw === "") return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};

/**
 * Parses untrusted URL params into typed filters. Anything unrecognised is
 * dropped rather than passed through to a query.
 */
export function parseCatalogParams(
  params: RawSearchParams,
  overrides: Partial<CatalogFilters> = {}
): CatalogFilters {
  const sortRaw = asString(params["sort"]) as SortKey | undefined;
  const page = asNumber(params["page"]);

  return {
    q: asString(params["q"])?.slice(0, 120) || undefined,
    category: asString(params["category"]) || undefined,
    minPrice: asNumber(params["minPrice"]),
    maxPrice: asNumber(params["maxPrice"]),
    sizes: asArray(params["size"]).slice(0, 12),
    colours: asArray(params["colour"]).slice(0, 12),
    inStock: asString(params["inStock"]) === "1",
    sort: sortRaw && VALID_SORTS.includes(sortRaw) ? sortRaw : "featured",
    page: page && page >= 1 ? Math.floor(page) : 1,
    perPage: 12,
    ...overrides,
  };
}

/** Serialises the params back out, minus `page`, for pagination links. */
export function toBaseParams(params: RawSearchParams): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "page" || value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) search.append(key, item);
  }
  return search.toString();
}
