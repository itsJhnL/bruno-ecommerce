import { CartDrawer } from "@/components/cart/cart-drawer";
import { CartProvider } from "@/components/cart/cart-provider";
import { SiteFooter } from "@/components/storefront/site-footer";
import { SiteHeader } from "@/components/storefront/site-header";
import { getBanner, getNavigation } from "@/lib/queries/content";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const [nav, shop, house, care, legal, announcement] = await Promise.all([
    getNavigation("header"),
    getNavigation("footer-shop"),
    getNavigation("footer-house"),
    getNavigation("footer-care"),
    getNavigation("footer-legal"),
    getBanner("ANNOUNCEMENT_BAR"),
  ]);

  return (
    // The provider holds cart state on the client so this layout can stay
    // static. Reading the cart cookie here would make every storefront page
    // dynamic (Memory.md D-020).
    <CartProvider>
      <SiteHeader
        nav={nav}
        announcement={
          announcement?.title
            ? {
                text: announcement.title,
                ctaLabel: announcement.ctaLabel,
                ctaHref: announcement.ctaHref,
              }
            : null
        }
      />
      <main id="main">{children}</main>
      <SiteFooter shop={shop} house={house} care={care} legal={legal} />
      <CartDrawer />
    </CartProvider>
  );
}
