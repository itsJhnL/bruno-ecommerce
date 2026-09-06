import type { Metadata } from "next";

import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { CatalogControls } from "@/components/storefront/catalog-controls";
import { Pagination } from "@/components/storefront/pagination";
import { ProductGrid } from "@/components/storefront/product-grid";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getProducts } from "@/lib/queries/catalog";
import { parseCatalogParams, toBaseParams, type RawSearchParams } from "@/lib/queries/search-params";

export const metadata: Metadata = {
  title: "The Collection",
  description:
    "Every BRUNO piece in one place. Filter by category, size, colour and price — cashmere outerwear, half-canvas tailoring, silk shirting and vegetable-tanned leather.",
  alternates: { canonical: "/collection" },
};

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  const filters = parseCatalogParams(params);
  const result = await getProducts(filters);

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Collection", href: "/collection" },
  ];

  return (
    <div className="shell pb-8 pt-10 md:pt-14">
      <Breadcrumb items={crumbs} />
      <BreadcrumbJsonLd items={crumbs} />

      <header className="mt-8 max-w-3xl">
        <p className="eyebrow">The Collection</p>
        <h1 className="display-l mt-5 text-ink-primary">
          {filters.q ? `“${filters.q}”` : "Everything we make"}
        </h1>
        <p className="lede mt-5">
          Fourteen pieces across six categories. Nothing here exceeds four hundred units, and most
          run to sixty.
        </p>
      </header>

      <div className="mt-14 grid gap-12 lg:grid-cols-[260px_1fr] lg:gap-16">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <CatalogControls facets={result.facets} total={result.total} />
        </aside>

        <div>
          <ProductGrid
            products={result.products}
            columns={3}
            priorityCount={3}
            emptyTitle={filters.q ? `Nothing matches “${filters.q}”` : "Nothing matches those filters"}
          />

          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            baseParams={toBaseParams(params)}
            pathname="/collection"
          />
        </div>
      </div>
    </div>
  );
}
