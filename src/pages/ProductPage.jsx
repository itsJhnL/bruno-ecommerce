import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CartSummary from "../components/CartSummary";
import { getProductById, products } from "../data/products";
import { useCart } from "../store/CartContext";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

export default function ProductPage() {
  const { productId } = useParams();
  const product = getProductById(productId);
  const [selectedSize, setSelectedSize] = useState(product?.sizes?.[0] ?? "");
  const { addToCart, subtotal, shipping, total } = useCart();

  useEffect(() => {
    setSelectedSize(product?.sizes?.[0] ?? "");
  }, [product]);

  const relatedProducts = useMemo(() => {
    if (!product) {
      return [];
    }

    return products
      .filter((item) => item.id !== product.id && item.category === product.category)
      .slice(0, 3);
  }, [product]);

  if (!product) {
    return (
      <section className="shell mt-6">
        <div className="panel px-6 py-12 text-center md:px-8">
          <h1 className="section-title">Product not found</h1>
          <p className="mt-4 text-brand-600">
            That item is no longer available. Explore the current collection instead.
          </p>
          <Link to="/" className="primary-button mt-6">
            Back to shop
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="shell mt-6">
      <div className="panel px-6 py-8 md:px-8 md:py-10">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="overflow-hidden rounded-[2rem] bg-white/80">
            <img
              src={product.image}
              alt={product.name}
              className="aspect-[4/5] h-full w-full object-cover"
            />
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-500">
                {product.badge}
              </p>
              <h1 className="mt-3 font-display text-5xl leading-none text-brand-900">
                {product.name}
              </h1>
              <p className="mt-4 text-xl font-semibold text-brand-900">
                {currency.format(product.price)}
              </p>
              <p className="mt-4 max-w-xl text-base leading-8 text-brand-600">
                {product.description}
              </p>
            </div>

            <div className="grid gap-5 rounded-[1.5rem] border border-brand-900/10 bg-white/75 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-500">
                  Colors
                </p>
                <p className="mt-2 text-sm text-brand-700">
                  {product.colors.join(" / ")}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-500">
                  Select size
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={
                        size === selectedSize
                          ? "rounded-full bg-brand-900 px-5 py-2.5 text-sm font-semibold text-stone-50"
                          : "rounded-full border border-brand-900/10 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700"
                      }
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-500">
                  Product details
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-brand-600">
                  {product.details.map((detail) => (
                    <li key={detail}>• {detail}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => addToCart(product, selectedSize)}
                className="primary-button"
              >
                Add to Cart
              </button>
              <Link to="/checkout" className="pill-button">
                Go to Checkout
              </Link>
            </div>

            <CartSummary
              subtotal={subtotal}
              shipping={shipping}
              total={total}
              buttonLabel="Proceed to Checkout"
              onSubmit={() => {}}
              disabled
            />
          </div>
        </div>

        {relatedProducts.length > 0 ? (
          <div className="mt-10">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-500">
                Related
              </p>
              <h2 className="section-title text-3xl md:text-4xl">You may also like</h2>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {relatedProducts.map((item) => (
                <Link
                  key={item.id}
                  to={`/product/${item.id}`}
                  className="rounded-[1.5rem] border border-brand-900/10 bg-white/70 p-4 transition hover:-translate-y-1"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="aspect-[4/5] w-full rounded-[1.2rem] object-cover"
                  />
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-brand-900">{item.name}</h3>
                      <p className="text-sm text-brand-500">{item.category}</p>
                    </div>
                    <span className="text-sm font-semibold text-brand-900">
                      {currency.format(item.price)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
