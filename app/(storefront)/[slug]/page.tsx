import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Markdown } from "@/components/storefront/markdown";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getPage, getPages } from "@/lib/queries/content";

interface CmsPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * CMS-driven static pages: /house, /materials, /shipping, /returns and anything
 * else the admin publishes. Static route segments (/collection, /journal,
 * /membership, /product, /category) always win over this catch-all.
 */
export async function generateStaticParams() {
  const pages = await getPages();
  return pages.map((page) => ({ slug: page.slug }));
}

export const dynamicParams = true;

export async function generateMetadata({ params }: CmsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return {};

  return {
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? page.subtitle ?? undefined,
    alternates: { canonical: `/${page.slug}` },
    openGraph: {
      title: page.seoTitle ?? page.title,
      description: page.seoDescription ?? page.subtitle ?? undefined,
      url: `/${page.slug}`,
    },
  };
}

export default async function CmsPage({ params }: CmsPageProps) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

  const crumbs = [
    { label: "Home", href: "/" },
    { label: page.title, href: `/${page.slug}` },
  ];

  return (
    <div className="shell pb-8 pt-10 md:pt-14">
      <Breadcrumb items={crumbs} />
      <BreadcrumbJsonLd items={crumbs} />

      <header className="mx-auto mt-12 max-w-3xl">
        <h1 className="display-l text-ink-primary">{page.title}</h1>
        {page.subtitle && <p className="lede mt-5">{page.subtitle}</p>}
      </header>

      {page.content && (
        <div className="mx-auto mt-14 max-w-[68ch]">
          <Markdown content={page.content} />
        </div>
      )}
    </div>
  );
}
