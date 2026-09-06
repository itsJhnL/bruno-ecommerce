import { NextResponse } from "next/server";

import { getUserId } from "@/lib/auth/session";
import { getWishlistProductIds } from "@/lib/queries/account";
import { getCart, getStoreHealth } from "@/lib/queries/cart";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Everything about the current visitor that the storefront chrome needs: their
 * bag, whether they are signed in, and which pieces they have saved.
 *
 * It is one endpoint rather than three because it is one round trip on every
 * page load, and because all three answers come from the same session. It
 * exists at all so the storefront layout never has to read cookies — doing so
 * would make every page under it dynamic and cost the prerendering the
 * catalogue depends on (Memory.md D-020).
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getUserId();

  const [cart, health, savedProductIds] = await Promise.all([
    getCart(),
    getStoreHealth(),
    userId ? getWishlistProductIds() : Promise.resolve(new Set<string>()),
  ]);

  return NextResponse.json(
    {
      configured: isSupabaseConfigured,
      health,
      cart,
      viewer: {
        signedIn: Boolean(userId),
        savedProductIds: [...savedProductIds],
      },
    },
    {
      headers: {
        // Personal, and stale the moment anything is added or saved.
        "Cache-Control": "private, no-store",
      },
    }
  );
}
