import { Link } from "react-router-dom";

export default function HeroSection() {
  return (
    <section className="shell mt-6">
      <div className="panel overflow-hidden bg-hero-glow px-6 py-8 md:px-10 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-500">
              Elevated daily uniform
            </p>
            <div className="space-y-4">
              <h1 className="max-w-[9ch] font-display text-6xl leading-none text-brand-900 md:text-8xl">
                Minimal pieces, premium presence.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-brand-700 md:text-lg">
                BRUNO is a modern apparel store built for streamlined shopping,
                refined essentials, and a clean visual identity that keeps the
                product at the center.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <a href="#catalog" className="primary-button">
                Shop Collection
              </a>
              <Link to="/checkout" className="pill-button">
                View Cart & Checkout
              </Link>
            </div>
          </div>

          <div className="grid gap-4 rounded-[1.75rem] bg-brand-900 p-6 text-stone-50">
            <Stat label="Curated styles" value="18 core pieces" />
            <Stat label="Average rating" value="4.9 / 5" />
            <Stat label="Ships to" value="Local & global markets" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="border-b border-white/10 pb-4 last:border-b-0 last:pb-0">
      <p className="text-xs uppercase tracking-[0.25em] text-stone-300">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}
