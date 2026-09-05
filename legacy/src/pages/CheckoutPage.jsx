import { useState } from "react";
import { Link } from "react-router-dom";
import CartSummary from "../components/CartSummary";
import { useCart } from "../store/CartContext";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

export default function CheckoutPage() {
  const { items, subtotal, shipping, total, updateQuantity, clearCart } = useCart();
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    address: ""
  });
  const [orderPlaced, setOrderPlaced] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  };

  const handleOrder = () => {
    if (!items.length || !formState.name || !formState.email || !formState.address) {
      return;
    }

    setOrderPlaced(true);
    clearCart();
    setFormState({
      name: "",
      email: "",
      address: ""
    });
  };

  if (orderPlaced) {
    return (
      <section className="shell mt-6">
        <div className="panel px-6 py-12 text-center md:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-500">
            Order Confirmed
          </p>
          <h1 className="mt-4 font-display text-5xl leading-none text-brand-900">
            Your BRUNO order is in.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-brand-600">
            A confirmation flow is complete and the cart has been cleared. You can
            continue shopping to create a new order.
          </p>
          <Link to="/" className="primary-button mt-8">
            Continue Shopping
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="shell mt-6">
      <div className="panel px-6 py-8 md:px-8 md:py-10">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-500">
            Checkout
          </p>
          <h1 className="section-title">Review your order</h1>
          <p className="max-w-2xl text-brand-600">
            Update quantities, confirm shipping details, and complete the BRUNO
            purchase flow.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_24rem]">
          <div className="space-y-5">
            <div className="rounded-[1.75rem] border border-brand-900/8 bg-white/80 p-5">
              <h2 className="text-xl font-semibold text-brand-900">Cart items</h2>

              {items.length === 0 ? (
                <div className="mt-5 rounded-[1.5rem] border border-dashed border-brand-900/15 bg-stone-50 px-5 py-10 text-center">
                  <p className="text-lg font-semibold text-brand-900">Your cart is empty</p>
                  <p className="mt-2 text-brand-600">
                    Add a product from the collection to continue checkout.
                  </p>
                  <Link to="/" className="pill-button mt-5">
                    Return to shop
                  </Link>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {items.map((item) => (
                    <article
                      key={item.lineId}
                      className="grid gap-4 rounded-[1.5rem] border border-brand-900/8 bg-stone-50 p-4 md:grid-cols-[6.5rem_1fr_auto]"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="aspect-[4/5] w-full rounded-[1.25rem] object-cover"
                      />
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-brand-900">{item.name}</h3>
                        <p className="text-sm text-brand-500">Size {item.size}</p>
                        <p className="text-sm font-medium text-brand-900">
                          {currency.format(item.price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 self-start rounded-full border border-brand-900/10 bg-white px-3 py-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                          className="text-lg leading-none text-brand-700"
                        >
                          -
                        </button>
                        <span className="min-w-6 text-center text-sm font-semibold text-brand-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                          className="text-lg leading-none text-brand-700"
                        >
                          +
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <form className="rounded-[1.75rem] border border-brand-900/8 bg-white/80 p-5">
              <h2 className="text-xl font-semibold text-brand-900">Shipping details</h2>
              <div className="mt-5 grid gap-4">
                <Field
                  label="Full name"
                  name="name"
                  value={formState.name}
                  onChange={handleChange}
                  placeholder="Jordan Reyes"
                />
                <Field
                  label="Email"
                  name="email"
                  value={formState.email}
                  onChange={handleChange}
                  placeholder="jordan@bruno.co"
                />
                <label className="grid gap-2 text-sm font-medium text-brand-700">
                  Shipping address
                  <textarea
                    name="address"
                    rows="4"
                    value={formState.address}
                    onChange={handleChange}
                    placeholder="Unit 14, 390 Mercer Street, New York, NY"
                    className="rounded-[1.25rem] border border-brand-900/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-brand-400"
                  />
                </label>
              </div>
            </form>
          </div>

          <div>
            <CartSummary
              subtotal={subtotal}
              shipping={shipping}
              total={total}
              buttonLabel="Place Order"
              onSubmit={handleOrder}
              disabled={
                items.length === 0 ||
                !formState.name ||
                !formState.email ||
                !formState.address
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, name, value, onChange, placeholder }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-brand-700">
      {label}
      <input
        type={name === "email" ? "email" : "text"}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="rounded-[1.25rem] border border-brand-900/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-brand-400"
      />
    </label>
  );
}
