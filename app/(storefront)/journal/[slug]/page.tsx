import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Markdown } from "@/components/storefront/markdown";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { contentOgImage } from "@/lib/utils/og";
import { getJournalPost, getJournalPosts } from "@/lib/queries/content";
import { formatDate } from "@/lib/utils/format";

interface JournalPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getJournalPosts(50);
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: JournalPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getJournalPost(slug);
  if (!post) return {};

  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt ?? undefined,
    alternates: { canonical: `/journal/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.seoTitle ?? post.title,
      description: post.seoDescription ?? post.excerpt ?? undefined,
      url: `/journal/${post.slug}`,
      publishedTime: post.publishedAt ?? undefined,
      tags: [...post.tags],
      images: [contentOgImage(post.title)],
    },
  };
}

export default async function JournalPostPage({ params }: JournalPostPageProps) {
  const { slug } = await params;
  const [post, all] = await Promise.all([getJournalPost(slug), getJournalPosts(24)]);
  if (!post) notFound();

  const more = all.filter((p) => p.slug !== slug).slice(0, 2);

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "The Journal", href: "/journal" },
    { label: post.title, href: `/journal/${post.slug}` },
  ];

  return (
    <article className="shell pb-8 pt-10 md:pt-14">
      <Breadcrumb items={crumbs} />
      <BreadcrumbJsonLd items={crumbs} />
      <ArticleJsonLd post={post} />

      <header className="mx-auto mt-10 max-w-3xl text-center">
        <p className="eyebrow">
          {formatDate(post.publishedAt)}
          {post.readingMinutes ? ` · ${post.readingMinutes} min read` : ""}
        </p>
        <h1 className="display-l mt-6 text-ink-primary">{post.title}</h1>
        {post.excerpt && <p className="lede mx-auto mt-6">{post.excerpt}</p>}
      </header>

      {post.imageUrl && (
        <div className="glass-vitrine relative mt-14 overflow-hidden p-2.5">
          <div className="relative aspect-16/9 overflow-hidden rounded-[26px]">
            <Image
              src={post.imageUrl}
              alt={post.imageAlt ?? ""}
              fill
              priority
              sizes="(min-width: 1280px) 1280px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      )}

      {post.content && (
        <div className="mx-auto mt-16 max-w-[68ch]">
          <Markdown content={post.content} />
        </div>
      )}

      {post.tags.length > 0 && (
        <ul className="mx-auto mt-12 flex max-w-[68ch] flex-wrap gap-2">
          {post.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-hairline px-3 py-1 text-[0.6875rem] uppercase tracking-[0.14em] text-ink-tertiary"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}

      {more.length > 0 && (
        <>
          <Separator className="mx-auto my-20 max-w-[68ch]" />
          <section aria-labelledby="more-title" className="mx-auto max-w-[68ch]">
            <h2 id="more-title" className="eyebrow mb-8">
              Also in the journal
            </h2>
            <ul className="space-y-6">
              {more.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/journal/${item.slug}`}
                    className="group flex items-baseline justify-between gap-8 border-b border-hairline-faint pb-6"
                  >
                    <span className="display-m text-ink-primary transition-colors group-hover:text-accent-strong">
                      {item.title}
                    </span>
                    <span className="shrink-0 text-xs text-ink-muted">
                      {formatDate(item.publishedAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </article>
  );
}
