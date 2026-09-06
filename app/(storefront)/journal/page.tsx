import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Reveal } from "@/components/storefront/reveal";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getJournalPosts } from "@/lib/queries/content";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "The Journal",
  description:
    "How things are made, and why it takes as long as it does. Notes on cashmere micron counts, vegetable tanning, half-canvas construction and the six pieces worth owning.",
  alternates: { canonical: "/journal" },
};

export default async function JournalPage() {
  const posts = await getJournalPosts(24);

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "The Journal", href: "/journal" },
  ];

  return (
    <div className="shell pb-8 pt-10 md:pt-14">
      <Breadcrumb items={crumbs} />
      <BreadcrumbJsonLd items={crumbs} />

      <header className="mt-8 max-w-2xl">
        <p className="eyebrow">The Journal</p>
        <h1 className="display-l mt-5 text-ink-primary">How things are made</h1>
        <p className="lede mt-5">
          Notes from the workshops. Specifications, processes, and the arguments behind the slow
          choices.
        </p>
      </header>

      <ul className="mt-16 grid gap-6 md:grid-cols-2">
        {posts.map((post, i) => (
          <Reveal as="li" key={post.slug} delay={Math.min(i, 4) * 70}>
            <Link
              href={`/journal/${post.slug}`}
              className="group block rounded-[20px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-line"
            >
              <article className="glass-pane glass-interactive h-full overflow-hidden">
                <div className="relative aspect-16/10 overflow-hidden rounded-t-[19px]">
                  {post.imageUrl && (
                    <Image
                      src={post.imageUrl}
                      alt={post.imageAlt ?? ""}
                      fill
                      priority={i < 2}
                      sizes="(min-width: 768px) 620px, 92vw"
                      className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04]"
                    />
                  )}
                </div>

                <div className="p-7">
                  <p className="eyebrow text-accent-quiet">
                    {formatDate(post.publishedAt)}
                    {post.readingMinutes ? ` · ${post.readingMinutes} min read` : ""}
                  </p>
                  <h2 className="display-m mt-4 text-ink-primary transition-colors group-hover:text-accent-strong">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="mt-4 text-sm leading-relaxed text-ink-tertiary">{post.excerpt}</p>
                  )}
                </div>
              </article>
            </Link>
          </Reveal>
        ))}
      </ul>
    </div>
  );
}
