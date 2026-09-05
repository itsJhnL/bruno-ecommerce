import CatalogSection from "../components/CatalogSection";
import HeroSection from "../components/HeroSection";

export default function HomePage() {
  return (
    <>
      <HeroSection />

      <section className="shell mt-6">
        <div className="panel grid gap-6 px-6 py-8 md:grid-cols-3 md:px-8">
          <ValueCard
            title="Minimal design language"
            text="Clean layouts, calm contrast, and premium typography keep the brand identity polished."
          />
          <ValueCard
            title="Functional storefront flow"
            text="Browse products, open detail pages, choose sizes, add items, and complete checkout."
          />
          <ValueCard
            title="Responsive and scalable"
            text="Built with React, Vite, and TailwindCSS so the frontend stays fast and easy to extend."
          />
        </div>
      </section>

      <CatalogSection />
    </>
  );
}

function ValueCard({ title, text }) {
  return (
    <article className="rounded-[1.5rem] border border-brand-900/8 bg-white/70 p-5">
      <h3 className="text-lg font-semibold text-brand-900">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-brand-600">{text}</p>
    </article>
  );
}
