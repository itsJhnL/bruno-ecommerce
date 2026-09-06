import type { Metadata } from "next";

import { CartPageContent } from "@/components/cart/cart-page-content";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const metadata: Metadata = {
  title: "Your bag",
  description: "Review the pieces in your bag before checkout.",
  // A bag is personal and has no search intent. Keeping it out of the index
  // also keeps crawl budget on the pages that can rank.
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <div className="shell pb-16 pt-10 md:pt-14">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Bag", href: "/cart" },
        ]}
      />

      <header className="mt-8 max-w-3xl">
        <p className="eyebrow">Your bag</p>
        <h1 className="display-l mt-5 text-ink-primary">Ready when you are</h1>
      </header>

      <div className="mt-12">
        <CartPageContent />
      </div>
    </div>
  );
}
