import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils/cn";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  body?: string;
  link?: { label: string; href: string };
  align?: "start" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  body,
  link,
  align = "start",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 md:flex-row md:items-end md:justify-between",
        align === "center" && "md:flex-col md:items-center md:text-center",
        className
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
        {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
        <h2 className="display-l text-ink-primary">{title}</h2>
        {body && <p className={cn("lede mt-5", align === "center" && "mx-auto")}>{body}</p>}
      </div>

      {link && (
        <Link
          href={link.href}
          className="group inline-flex shrink-0 items-center gap-2 text-sm text-accent transition-colors hover:text-accent-strong"
        >
          {link.label}
          <ArrowUpRight
            className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            strokeWidth={1.5}
            aria-hidden
          />
        </Link>
      )}
    </div>
  );
}
