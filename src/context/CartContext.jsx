import { createContext, useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";

export const CartContext = createContext();

function CartProvider({ children }) {
  const { user } = useAuth();

  // প্রতিটি User-এর জন্য আলাদা Cart Key
  const cartKey = user?.email
    ? `medpharm-cart-${user.email}`
    : "medpharm-cart-guest";

  const [cart, setCart] = useState([]);

  // User পরিবর্তন হলে Cart Load হবে
  useEffect(() => {
    const storedCart = localStorage.getItem(cartKey);

    if (storedCart) {
      setCart(JSON.parse(storedCart));
    } else {
      setCart([]);
    }
  }, [cartKey]);

  // Cart Save হবে User অনুযায়ী
  useEffect(() => {
    localStorage.setItem(cartKey, JSON.stringify(cart));
  }, [cart, cartKey]);

  // ==========================
  // Add To Cart
  // ==========================
  const addToCart = (medicine) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item._id === medicine._id);

      if (existing) {
        return prevCart.map((item) =>
          item._id === medicine._id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [...prevCart, { ...medicine, quantity: 1 }];
    });
  };

  // ==========================
  // Remove
  // ==========================
  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item._id !== id));
  };

  // ==========================
  // Increase
  // ==========================
  const increaseQuantity = (id) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item._id === id ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    );
  };

  // ==========================
  // Decrease
  // ==========================
  const decreaseQuantity = (id) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item._id === id ? { ...item, quantity: item.quantity - 1 } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  // ==========================
  // Clear Cart
  // ==========================
  const clearCart = () => {
    setCart([]);
    localStorage.removeItem(cartKey);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export default CartProvider;
