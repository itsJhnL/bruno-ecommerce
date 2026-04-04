import { useDeferredValue, useState } from "react";
import { categories, products } from "../data/products";
import ProductGrid from "./ProductGrid";

export default function CatalogSection() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      activeCategory === "All" || product.category === activeCategory;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      `${product.name} ${product.category} ${product.description}`
        .toLowerCase()
        .includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });

  return (
    <section id="catalog" className="shell mt-6">
      <div className="panel px-6 py-8 md:px-8 md:py-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-end">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-500">
              Catalog
            </p>
            <h2 className="section-title">Explore the collection</h2>
            <p className="max-w-2xl text-brand-600">
              Browse premium t-shirts, hoodies, outerwear, and accessories
              designed with a clean silhouette and a sharp finish.
            </p>
          </div>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-brand-500">
              Search
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tees, hoodies, accessories..."
              className="w-full rounded-[1.25rem] border border-brand-900/10 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-brand-400"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={
                category === activeCategory
                  ? "rounded-full bg-brand-900 px-5 py-2.5 text-sm font-semibold text-stone-50"
                  : "rounded-full border border-brand-900/10 bg-white/80 px-5 py-2.5 text-sm font-semibold text-brand-700 transition hover:-translate-y-0.5"
              }
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mt-8">
          <ProductGrid products={filteredProducts} />
        </div>
      </div>
    </section>
  );
}
