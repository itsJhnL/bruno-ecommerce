import { WishlistGrid } from "@/components/account/wishlist-grid";
import { getWishlist } from "@/lib/queries/account";

export default async function WishlistPage() {
  const items = await getWishlist();
  return <WishlistGrid items={items} />;
}
