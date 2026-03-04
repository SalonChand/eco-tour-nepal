import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext'; // 👤 Need this to know WHO is shopping!

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useContext(AuthContext); // Get the logged-in user

  // Load saved cart from browser memory on startup
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('ecoTourCart');
    return savedCart ? JSON.parse(savedCart) :[];
  });

  // 1. Save cart to browser memory (Local)
  useEffect(() => {
    localStorage.setItem('ecoTourCart', JSON.stringify(cart));
  }, [cart]);

  // 🤖 2. NEW: SILENTLY SYNC CART TO THE DATABASE (For Abandoned Cart Recovery!)
  useEffect(() => {
    if (user) {
      // Send the cart data to the backend in the background
      axios.post('http://localhost:5000/api/cart/sync', {
        user_id: user.id,
        cart_data: cart
      }).catch(err => console.error("Failed to sync cart to server:", err));
    }
  }, [cart, user]); // Runs every time the cart or user changes!

  // Add item to cart (increase quantity if it already exists)
  const addToCart = (product) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);
      if (existingItem) {
        return prev.map((item) => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // Remove item completely
  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  // Increase or decrease quantity
  const updateQuantity = (productId, amount) => {
    setCart((prev) => prev.map((item) => {
      if (item.id === productId) {
        const newQty = item.quantity + amount;
        return { ...item, quantity: newQty > 0 ? newQty : 1 }; // Prevents going below 1
      }
      return item;
    }));
  };

  // Empty cart after successful payment
  const clearCart = () => setCart([]);

  // Calculate totals
  const getCartTotal = () => cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const getCartCount = () => cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartCount }}>
      {children}
    </CartContext.Provider>
  );
};