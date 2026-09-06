"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { EMPTY_CART } from "@/lib/cart/empty";
import type { CartPricing } from "@/types";

/**
 * Client-side cart state.
 *
 * It holds no pricing logic — every value here came from `price_cart()` in
 * Postgres, either from the initial fetch or from a Server Action's return
 * value. This exists so the header badge and the drawer can update without a
 * full navigation, and so the storefront layout can stay static.
 */

type Status = "loading" | "ready" | "unconfigured" | "unreachable";

interface CartState {
  cart: CartPricing;
  /** True once the viewer is known to have a session. */
  isSignedIn: boolean;
  /** Product ids this viewer has saved, for the heart on a card. */
  savedProductIds: Set<string>;
  /** Records a save/unsave locally so the heart settles without a refetch. */
  setSaved: (productId: string, saved: boolean) => void;
  status: Status;
  /** True when Supabase is not wired up, so nothing can be added at all. */
  isUnconfigured: boolean;
  /** True when Supabase answers but the schema has not been applied. */
  isUnreachable: boolean;
  /** Either of the above: the bag cannot work, and the UI must say why. */
  isBlocked: boolean;
  count: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  setCart: (cart: CartPricing) => void;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCartState] = useState<CartPricing>(EMPTY_CART);
  const [status, setStatus] = useState<Status>("loading");
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isSignedIn, setSignedIn] = useState(false);
  const [savedProductIds, setSavedProductIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/viewer", { cache: "no-store" });
      if (!response.ok) throw new Error(String(response.status));
      const body = (await response.json()) as {
        configured: boolean;
        health: "ready" | "unreachable" | "unconfigured";
        cart: CartPricing;
        viewer: { signedIn: boolean; savedProductIds: string[] };
      };
      setCartState(body.cart);
      setSignedIn(body.viewer.signedIn);
      setSavedProductIds(new Set(body.viewer.savedProductIds));
      setStatus(
        !body.configured ? "unconfigured" : body.health === "ready" ? "ready" : "unreachable"
      );
    } catch {
      // A failed read is not a failed write. Show an empty bag rather than an
      // error banner on every page; mutations report their own failures.
      setStatus("ready");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setCart = useCallback((next: CartPricing) => {
    setCartState(next);
    setStatus("ready");
  }, []);

  const setSaved = useCallback((productId: string, saved: boolean) => {
    setSavedProductIds((prev) => {
      const next = new Set(prev);
      if (saved) next.add(productId);
      else next.delete(productId);
      return next;
    });
  }, []);

  const value = useMemo<CartState>(
    () => ({
      cart,
      status,
      isSignedIn,
      savedProductIds,
      setSaved,
      isUnconfigured: status === "unconfigured",
      isUnreachable: status === "unreachable",
      isBlocked: status === "unconfigured" || status === "unreachable",
      count: cart.itemCount,
      isDrawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      setCart,
      refresh,
    }),
    [cart, status, isSignedIn, savedProductIds, setSaved, isDrawerOpen, setCart, refresh]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside <CartProvider>.");
  }
  return context;
}
