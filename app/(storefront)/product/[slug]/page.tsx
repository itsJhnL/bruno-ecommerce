import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Package, RotateCcw, ShieldCheck } from "lucide-react";

import { BreadcrumbJsonLd, ProductJsonLd } from "@/components/seo/json-ld";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { ProductGrid } from "@/components/storefront/product-grid";
import { Reveal } from "@/components/storefront/reveal";
import { ReviewList } from "@/components/storefront/review-list";
import { SectionHeading } from "@/components/storefront/section-heading";
import { VariantPicker } from "@/components/storefront/variant-picker";
import { productOgImage } from "@/lib/utils/og";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Rating } from "@/components/ui/rating";
import { Separator } from "@/components/ui/separator";
import { getAllProductSlugs, getProductBySlug, getRelatedProducts } from "@/lib/queries/catalog";
import { discountPercent, formatPrice } from "@/lib/utils/format";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const title = product.seoTitle ?? product.name;
  const description =
    product.seoDescription ?? product.subtitle ?? product.description?.slice(0, 160) ?? undefined;

  return {
    title,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `/product/${product.slug}`,
      // A PNG card, never the SVG plate: social platforms drop SVG silently.
      // The per-product `og_image_url` override is read once the admin CMS can
      // set it (Phase 4); until then the generated card is the truth.
      images: [productOgImage(product.slug, product.name)],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(slug, 3);
  const off = discountPercent(product.price, product.compareAtPrice);
  const specs = Object.entries(product.specifications);

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Collection", href: "/collection" },
    ...(product.categorySlug && product.categoryName
      ? [{ label: product.categoryName, href: `/category/${product.categorySlug}` }]
      : []),
    { label: product.name, href: `/product/${product.slug}` },
  ];

  return (
    <div className="shell pb-8 pt-10 md:pt-14">
      <Breadcrumb items={crumbs} />
      <BreadcrumbJsonLd items={crumbs} />
      <ProductJsonLd product={product} />

      <div className="mt-8 grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <ProductGallery images={product.images} productName={product.name} />
        </div>

        <div className="lg:col-span-5 lg:sticky lg:top-28 lg:self-start">
          <div className="flex flex-wrap items-center gap-2">
            {product.isLimited && <Badge tone="accent">Limited release</Badge>}
            {product.isNew && <Badge tone="accent">New</Badge>}
            {product.isMembersOnly && <Badge tone="accent">Members only</Badge>}
            {off !== null && <Badge tone="neutral">{off}% off</Badge>}
          </div>

          {product.categoryName && (
            <p className="eyebrow mt-5 text-accent-quiet">{product.categoryName}</p>
          )}

          <h1 className="display-l mt-3 text-ink-primary">{product.name}</h1>

          {product.subtitle && <p className="mt-3 text-[0.9375rem] text-ink-tertiary">{product.subtitle}</p>}

          {product.ratingCount > 0 && (
            <a href="#reviews" className="mt-5 inline-block">
              <Rating value={product.ratingAverage} count={product.ratingCount} size="md" />
            </a>
          )}

          <div className="mt-7 flex items-baseline gap-3">
            <span className="figure text-4xl text-accent">
              {formatPrice(product.price, product.currency)}
            </span>
            {product.compareAtPrice && (
              <>
                <span className="figure text-2xl text-ink-muted line-through">
                  {formatPrice(product.compareAtPrice, product.currency)}
                </span>
                <span className="text-xs uppercase tracking-[0.14em] text-signal-success">
                  Reduced
                </span>
              </>
            )}
          </div>

          {product.description && (
            <p className="prose-house mt-7 text-sm">{product.description}</p>
          )}

          <Separator className="my-9" />

          <VariantPicker
            productId={product.id}
            productName={product.name}
            options={product.options}
            variants={product.variants}
            price={product.price}
            currency={product.currency}
          />

          <ul className="mt-9 space-y-3.5 border-t border-hairline-faint pt-7">
            {[
              { icon: Package, text: product.shippingInfo ?? "Complimentary insured delivery worldwide." },
              { icon: RotateCcw, text: product.returnsInfo ?? "Thirty days, unworn, with tags." },
              { icon: ShieldCheck, text: "Lifetime repairs on everything we have ever sold." },
            ].map((item) => (
              <li key={item.text} className="flex gap-3 text-[0.8125rem] leading-relaxed text-ink-tertiary">
                <item.icon className="mt-0.5 size-4 shrink-0 text-accent-quiet" strokeWidth={1.4} aria-hidden />
                <span>{item.text}</span>
              </li>
            ))}
          </ul>

          <Accordion type="multiple" className="mt-9 border-t border-hairline">
            {product.story && (
              <AccordionItem value="story">
                <AccordionTrigger>Why it is made this way</AccordionTrigger>
                <AccordionContent>
                  {product.story.split("\n\n").map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </AccordionContent>
              </AccordionItem>
            )}

            {specs.length > 0 && (
              <AccordionItem value="specs">
                <AccordionTrigger>Specifications</AccordionTrigger>
                <AccordionContent>
                  <dl className="grid gap-2.5">
                    {specs.map(([key, value]) => (
                      <div key={key} className="flex justify-between gap-6 border-b border-hairline-faint pb-2.5">
                        <dt className="text-ink-tertiary">{key}</dt>
                        <dd className="text-right text-ink-primary">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </AccordionContent>
              </AccordionItem>
            )}

            {(product.materials || product.origin) && (
              <AccordionItem value="materials">
                <AccordionTrigger>Materials & provenance</AccordionTrigger>
                <AccordionContent>
                  {product.materials && <p>{product.materials}</p>}
                  {product.origin && <p>{product.origin}</p>}
                </AccordionContent>
              </AccordionItem>
            )}

            {product.careInstructions && (
              <AccordionItem value="care">
                <AccordionTrigger>Care</AccordionTrigger>
                <AccordionContent>
                  <p>{product.careInstructions}</p>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      </div>

      <Reveal className="mt-28">
        <ReviewList
          reviews={product.reviews}
          ratingAverage={product.ratingAverage}
          ratingCount={product.ratingCount}
          productId={product.id}
          productName={product.name}
        />
      </Reveal>

      {related.length > 0 && (
        <section className="mt-28" aria-labelledby="related-title">
          <SectionHeading eyebrow="Wears well with" title="Also consider" />
          <ProductGrid products={related} columns={3} className="mt-12" />
        </section>
      )}
    </div>
  );
}
