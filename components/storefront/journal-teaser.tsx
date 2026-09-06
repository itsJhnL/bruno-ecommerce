import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/storefront/reveal";
import { SectionHeading } from "@/components/storefront/section-heading";
import { formatDate } from "@/lib/utils/format";
import type { JournalPost } from "@/types";

export function JournalTeaser({ posts }: { posts: JournalPost[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="section" aria-labelledby="journal-title">
      <div className="shell">
        <SectionHeading
          eyebrow="The Journal"
          title="How things are made"
          link={{ label: "Read the journal", href: "/journal" }}
        />

        <ul className="mt-14 grid gap-5 md:grid-cols-3">
          {posts.slice(0, 3).map((post, i) => (
            <Reveal as="li" key={post.slug} delay={i * 80}>
              <Link
                href={`/journal/${post.slug}`}
                className="group block rounded-[20px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-line"
              >
                <article className="glass-pane glass-interactive flex h-full flex-col overflow-hidden">
                  <div className="relative aspect-16/10 overflow-hidden rounded-t-[19px]">
                    {post.imageUrl && (
                      <Image
                        src={post.imageUrl}
                        alt={post.imageAlt ?? ""}
                        fill
                        sizes="(min-width: 768px) 400px, 92vw"
                        className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04]"
                      />
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <p className="eyebrow text-accent-quiet">
                      {formatDate(post.publishedAt)}
                      {post.readingMinutes ? ` · ${post.readingMinutes} min` : ""}
                    </p>

                    <h3 className="display-s mt-3 text-ink-primary transition-colors group-hover:text-accent-strong">
                      {post.title}
                    </h3>

                    {post.excerpt && (
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-tertiary">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </article>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
