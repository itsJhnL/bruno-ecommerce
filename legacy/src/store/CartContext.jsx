import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CART_STORAGE_KEY = "bruno-premium-cart";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const storedItems = window.localStorage.getItem(CART_STORAGE_KEY);

    if (storedItems) {
      setItems(JSON.parse(storedItems));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (product, size) => {
    const lineId = `${product.id}-${size}`;

    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.lineId === lineId);

      if (existingItem) {
        return currentItems.map((item) =>
          item.lineId === lineId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...currentItems,
        {
          lineId,
          productId: product.id,
          name: product.name,
          price: product.price,
          size,
          image: product.image,
          quantity: 1
        }
      ];
    });
  };

  const updateQuantity = (lineId, nextQuantity) => {
    setItems((currentItems) =>
      currentItems
        .map((item) =>
          item.lineId === lineId ? { ...item, quantity: nextQuantity } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const value = useMemo(() => {
    const itemCount = items.reduce((total, item) => total + item.quantity, 0);
    const subtotal = items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    const shipping = items.length > 0 ? 12 : 0;
    const total = subtotal + shipping;

    return {
      items,
      itemCount,
      subtotal,
      shipping,
      total,
      addToCart,
      updateQuantity,
      clearCart
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
