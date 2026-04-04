import ProductCard from "./ProductCard";

export default function ProductGrid({ products }) {
  if (products.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-brand-900/15 bg-white/60 px-6 py-12 text-center">
        <h3 className="text-xl font-semibold text-brand-900">No products found</h3>
        <p className="mt-2 text-brand-600">
          Try another category or search for a different item.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
