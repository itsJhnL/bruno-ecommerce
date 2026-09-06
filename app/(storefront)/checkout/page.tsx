import type { Metadata } from "next";

import { CancelledNotice } from "@/components/checkout/cancelled-notice";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getShippingOptions } from "@/lib/queries/cart";
import { isStripeConfigured } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your order.",
  robots: { index: false, follow: false },
};

// Reads the signed-in customer's details, so it cannot be prerendered.
export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const { cancelled } = await searchParams;
  const supabase = await createClient();
  const [options, auth] = await Promise.all([
    getShippingOptions(),
    supabase?.auth.getUser() ?? Promise.resolve(null),
  ]);

  let defaults: { email: string; phone: string } | null = null;
  const user = auth?.data.user ?? null;

  if (user && supabase) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, phone")
      .eq("id", user.id)
      .maybeSingle();

    defaults = {
      email: profile?.email ?? user.email ?? "",
      phone: profile?.phone ?? "",
    };
  }

  return (
    <div className="shell pb-20 pt-10 md:pt-14">
      <header className="max-w-3xl">
        <p className="eyebrow">Checkout</p>
        <h1 className="display-l mt-5 text-ink-primary">A few details</h1>
      </header>

      <div className="mt-12">
        {cancelled && <CancelledNotice orderNumber={cancelled} />}

        <CheckoutForm
          shippingOptions={options}
          defaults={defaults}
          storeReady={isSupabaseConfigured}
          paymentsReady={isStripeConfigured}
        />
      </div>
    </div>
  );
}
