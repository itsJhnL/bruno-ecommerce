import { Link } from "react-router-dom";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

export default function ProductCard({ product }) {
  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-brand-900/8 bg-white/80 shadow-soft transition hover:-translate-y-1">
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <span className="absolute right-4 top-4 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
            {product.badge}
          </span>
        </div>
        <div className="space-y-2 px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-brand-900">{product.name}</h3>
              <p className="text-sm text-brand-500">{product.category}</p>
            </div>
            <span className="text-sm font-semibold text-brand-900">
              {currency.format(product.price)}
            </span>
          </div>
          <p className="text-sm leading-6 text-brand-600">{product.description}</p>
        </div>
      </Link>
    </article>
  );
}
