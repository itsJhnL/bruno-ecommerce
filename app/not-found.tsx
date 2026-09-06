import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-[70dvh] place-items-center px-6 py-24">
      <div className="max-w-md text-center">
        <p className="eyebrow">404</p>
        <h1 className="display-l mt-6 text-ink-primary">This piece is not in the archive</h1>
        <p className="lede mx-auto mt-5 text-sm">
          The page you were looking for has moved, sold out, or never existed. The collection is
          still here.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/collection">Browse the collection</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Return home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
