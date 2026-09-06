"use client";

import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTransition } from "react";

import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import { toggleWishlist } from "@/lib/actions/account";
import { cn } from "@/lib/utils/cn";

/**
 * The heart.
 *
 * Saved state comes from the single viewer request the provider already makes,
 * so a product page can stay statically prerendered and still show the right
 * heart once hydrated. A signed-out visitor is sent to sign in and returned to
 * the piece they were looking at, rather than being told to go and find it
 * again.
 */
export function WishlistButton({
  productId,
  productName,
  className,
  onError,
}: {
  productId: string;
  productName: string;
  className?: string;
  /** Failures surface in the caller's error slot; a sighted user must see them. */
  onError?: (message: string) => void;
}) {
  const { isSignedIn, savedProductIds, setSaved, status } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const saved = savedProductIds.has(productId);
  const known = status !== "loading";

  const onClick = () => {
    onError?.("");

    if (known && !isSignedIn) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    startTransition(async () => {
      const result = await toggleWishlist({ productId });
      if (!result.ok) {
        onError?.(result.error);
        return;
      }
      setSaved(productId, result.data.saved);
    });
  };

  return (
    <Button
        variant="outline"
        size="icon"
        className={cn("size-14", saved && "border-accent-line/60 bg-accent-wash/40", className)}
        onClick={onClick}
        disabled={pending}
        aria-pressed={known ? saved : undefined}
        aria-label={saved ? `Remove ${productName} from saved` : `Save ${productName}`}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
        ) : (
          <Heart
            className={cn("size-4", saved && "fill-current text-accent")}
            strokeWidth={1.5}
          />
        )}
    </Button>
  );
}
