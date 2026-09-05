import { Link, NavLink } from "react-router-dom";
import { useCart } from "../store/CartContext";

export default function Layout({ children }) {
  const { itemCount } = useCart();

  return (
    <div className="pb-10">
      <header className="shell pt-4 md:pt-6">
        <div className="panel flex flex-col gap-5 px-5 py-5 md:px-8 md:py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Link to="/" className="flex flex-col">
              <span className="font-display text-4xl tracking-[0.2em] text-brand-900">
                BRUNO
              </span>
              <span className="text-sm uppercase tracking-[0.22em] text-brand-500">
                Premium Apparel
              </span>
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <nav className="flex flex-wrap gap-2 rounded-full border border-brand-900/10 bg-white/70 p-1">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 text-sm font-medium transition ${
                      isActive ? "bg-brand-900 text-stone-50" : "text-brand-700"
                    }`
                  }
                >
                  Home
                </NavLink>
                <a href="/#catalog" className="rounded-full px-4 py-2 text-sm font-medium text-brand-700">
                  Shop
                </a>
                <NavLink
                  to="/checkout"
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 text-sm font-medium transition ${
                      isActive ? "bg-brand-900 text-stone-50" : "text-brand-700"
                    }`
                  }
                >
                  Checkout
                </NavLink>
              </nav>

              <Link to="/checkout" className="primary-button">
                Cart ({itemCount})
              </Link>
            </div>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
