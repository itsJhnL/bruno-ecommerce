"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils/cn";

/* --------------------------------------------------------------------------
 * A shared scroll watcher.
 *
 * IntersectionObserver alone is not sufficient here. It reports THRESHOLD
 * CROSSINGS, so an element that goes from below the viewport to above it in a
 * single frame — pressing End, a hash jump, or a restored scroll position on
 * back-navigation — never crosses anything and is never reported. Measured on
 * this page: jumping to the end left 39 of 40 sections permanently invisible.
 *
 * So IO handles the common case cheaply, and this handles the rest: one
 * passive scroll listener for the whole page, rAF-throttled, checking only the
 * elements still waiting. Each unregisters the moment it reveals, so the cost
 * falls to zero once the page has been read.
 * ------------------------------------------------------------------------ */

type Pending = { node: HTMLElement; reveal: () => void };

const pending = new Set<Pending>();
let listening = false;
let frame = 0;

function flush() {
  frame = 0;
  const limit = window.innerHeight * 0.94;
  for (const item of pending) {
    if (item.node.getBoundingClientRect().top < limit) {
      item.reveal();
      pending.delete(item);
    }
  }
  if (pending.size === 0) stopListening();
}

function schedule() {
  if (frame) return;
  frame = requestAnimationFrame(flush);
}

function startListening() {
  if (listening) return;
  listening = true;
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
}

function stopListening() {
  if (!listening) return;
  listening = false;
  window.removeEventListener("scroll", schedule);
  window.removeEventListener("resize", schedule);
  if (frame) {
    cancelAnimationFrame(frame);
    frame = 0;
  }
}

function watch(item: Pending) {
  pending.add(item);
  startListening();
  return () => {
    pending.delete(item);
    if (pending.size === 0) stopListening();
  };
}

/* ------------------------------------------------------------------------ */

interface RevealProps {
  children: React.ReactNode;
  /** Stagger, in ms. Keep under ~240 or the page feels slow. */
  delay?: number;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}

/**
 * Reveal-on-scroll, as progressive enhancement.
 *
 * `.reveal` starts at opacity 0 and `.no-js .reveal` in globals.css keeps
 * content visible if this never runs. Under `prefers-reduced-motion` the
 * transition is neutralised in CSS, so this component needs no knowledge of it.
 */
export function Reveal({ children, delay = 0, className, as: Tag = "div" }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let done = false;
    const reveal = () => {
      if (done) return;
      done = true;
      setRevealed(true);
    };

    if (typeof IntersectionObserver === "undefined") {
      reveal();
      return;
    }

    // Already in view, or already scrolled past, on mount.
    if (node.getBoundingClientRect().top < window.innerHeight * 0.94) {
      reveal();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
            reveal();
            observer.disconnect();
            return;
          }
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0 }
    );
    observer.observe(node);

    const unwatch = watch({
      node,
      reveal: () => {
        reveal();
        observer.disconnect();
      },
    });

    return () => {
      observer.disconnect();
      unwatch();
    };
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={cn("reveal", revealed && "is-revealed", className)}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
