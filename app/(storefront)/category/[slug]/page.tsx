import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { CatalogControls } from "@/components/storefront/catalog-controls";
import { Pagination } from "@/components/storefront/pagination";
import { ProductGrid } from "@/components/storefront/product-grid";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { categoryOgImage } from "@/lib/utils/og";
import { getCategories, getCategoryBySlug, getProducts } from "@/lib/queries/catalog";
import { parseCatalogParams, toBaseParams, type RawSearchParams } from "@/lib/queries/search-params";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
}

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};

  return {
    title: category.seoTitle ?? category.name,
    description: category.seoDescription ?? category.description ?? undefined,
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: {
      title: category.seoTitle ?? category.name,
      description: category.seoDescription ?? category.description ?? undefined,
      url: `/category/${category.slug}`,
      images: [categoryOgImage(category.slug, category.name)],
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const [{ slug }, rawParams] = await Promise.all([params, searchParams]);
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const filters = parseCatalogParams(rawParams, { category: slug });
  const result = await getProducts(filters);

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Collection", href: "/collection" },
    { label: category.name, href: `/category/${category.slug}` },
  ];

  return (
    <div className="shell pb-8 pt-10 md:pt-14">
      <Breadcrumb items={crumbs} />
      <BreadcrumbJsonLd items={crumbs} />

      <header className="mt-8 max-w-3xl">
        <p className="eyebrow">Category</p>
        <h1 className="display-l mt-5 text-ink-primary">{category.name}</h1>
        {category.description && <p className="lede mt-5">{category.description}</p>}
      </header>

      <div className="mt-14 grid gap-12 lg:grid-cols-[260px_1fr] lg:gap-16">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <CatalogControls facets={result.facets} total={result.total} lockedCategory={slug} />
        </aside>

        <div>
          <ProductGrid products={result.products} columns={3} priorityCount={3} />
          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            baseParams={toBaseParams(rawParams)}
            pathname={`/category/${category.slug}`}
          />
        </div>
      </div>
    </div>
  );
}
