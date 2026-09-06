import type { Faq, JournalPost, ProductDetail } from "@/types";
import { SITE, siteUrl } from "@/lib/utils/site";

/**
 * Structured data emitters. Every one of these validates against
 * schema.org and the Google Rich Results test.
 *
 * The JSON is serialised with `<` escaped so a stray angle bracket in CMS copy
 * cannot break out of the script tag.
 */
function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${siteUrl()}#organization`,
        name: SITE.name,
        url: siteUrl(),
        logo: siteUrl("/images/brand/wordmark.svg"),
        description: SITE.description,
        email: SITE.email,
        telephone: SITE.phone,
        sameAs: [SITE.social.instagram, SITE.social.pinterest].filter(Boolean),
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          email: SITE.email,
          telephone: SITE.phone,
          availableLanguage: ["English"],
        },
      }}
    />
  );
}

export function WebsiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${siteUrl()}#website`,
        name: SITE.name,
        url: siteUrl(),
        publisher: { "@id": `${siteUrl()}#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteUrl("/collection")}?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: { label: string; href: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.label,
          item: siteUrl(item.href),
        })),
      }}
    />
  );
}

export function ProductJsonLd({ product }: { product: ProductDetail }) {
  const url = siteUrl(`/product/${product.slug}`);
  const image = product.images[0]?.url ?? product.imageUrl;

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Product",
        "@id": `${url}#product`,
        name: product.name,
        description: product.seoDescription ?? product.description ?? product.subtitle ?? undefined,
        sku: product.sku ?? undefined,
        image: [siteUrl(image)],
        brand: { "@type": "Brand", name: SITE.name },
        material: product.materials ?? undefined,
        category: product.categoryName ?? undefined,
        offers: {
          "@type": "Offer",
          url,
          priceCurrency: product.currency,
          price: product.price.toFixed(2),
          availability: product.isInStock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
          seller: { "@id": `${siteUrl()}#organization` },
        },
        ...(product.ratingCount > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: product.ratingAverage.toFixed(1),
                reviewCount: product.ratingCount,
                bestRating: 5,
                worstRating: 1,
              },
              review: product.reviews.slice(0, 5).map((review) => ({
                "@type": "Review",
                author: { "@type": "Person", name: review.author },
                datePublished: review.createdAt,
                name: review.title ?? undefined,
                reviewBody: review.body,
                reviewRating: {
                  "@type": "Rating",
                  ratingValue: review.rating,
                  bestRating: 5,
                  worstRating: 1,
                },
              })),
            }
          : {}),
      }}
    />
  );
}

export function FaqJsonLd({ faqs }: { faqs: Faq[] }) {
  if (faqs.length === 0) return null;

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      }}
    />
  );
}

export function ArticleJsonLd({ post }: { post: JournalPost }) {
  const url = siteUrl(`/journal/${post.slug}`);

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        "@id": `${url}#article`,
        headline: post.title,
        description: post.excerpt ?? undefined,
        image: post.imageUrl ? [siteUrl(post.imageUrl)] : undefined,
        datePublished: post.publishedAt ?? undefined,
        dateModified: post.publishedAt ?? undefined,
        author: { "@type": "Organization", name: post.author ?? SITE.name },
        publisher: { "@id": `${siteUrl()}#organization` },
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        keywords: post.tags.join(", "),
      }}
    />
  );
}
