import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

interface ShopContextType {
  cart: CartItem[];
  wishlist: string[];
  searchQuery: string;
  isCartOpen: boolean;
  isWishlistOpen: boolean;
  setSearchQuery: (q: string) => void;
  setIsCartOpen: (v: boolean) => void;
  setIsWishlistOpen: (v: boolean) => void;
  addToCart: (product: Product, quantity: number, variant?: string) => void;
  removeFromCart: (productId: string, variant?: string) => void;
  updateCartItemQuantity: (productId: string, variant: string | undefined, quantity: number) => void;
  toggleWishlist: (productId: string) => void;
  clearCart: () => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  // State
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("aloeflora_cart");
    return saved ? JSON.parse(saved) : [];
  });
  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem("aloeflora_wishlist");
    return saved ? JSON.parse(saved) : [];
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);

  // Sync profile data on mount or user change
  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase.from('profiles').select('cart, wishlist').eq('id', user.id).single();
        if (data) {
          if (data.cart && data.cart.length > 0) setCart(data.cart);
          if (data.wishlist && data.wishlist.length > 0) setWishlist(data.wishlist);
        }
        setIsProfileLoaded(true);
      };
      fetchProfile();
    } else {
      setIsProfileLoaded(false);
    }
  }, [user]);

  // Sync Cart
  useEffect(() => {
    localStorage.setItem("aloeflora_cart", JSON.stringify(cart));
    if (user && isProfileLoaded) {
      supabase.from('profiles').update({ cart }).eq('id', user.id).then();
    }
  }, [cart, user, isProfileLoaded]);

  // Sync Wishlist
  useEffect(() => {
    localStorage.setItem("aloeflora_wishlist", JSON.stringify(wishlist));
    if (user && isProfileLoaded) {
      supabase.from('profiles').update({ wishlist }).eq('id', user.id).then();
      supabase.auth.updateUser({ data: { wishlist } }).then();
    }
  }, [wishlist, user, isProfileLoaded]);

  // Actions
  const addToCart = (product: Product, quantity: number, variant?: string) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.product.id === product.id && item.selectedVariant === variant);
      if (existingIdx >= 0) {
        const newCart = [...prev];
        newCart[existingIdx].quantity += quantity;
        return newCart;
      }
      return [...prev, { product, quantity, selectedVariant: variant }];
    });
    toast.success(`${quantity}x ${product.name} added to cart`);
  };

  const updateCartItemQuantity = (productId: string, variant: string | undefined, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, variant);
      return;
    }
    setCart(prev => prev.map(item => {
      if (item.product.id === productId && item.selectedVariant === variant) {
        return { ...item, quantity };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string, variant?: string) => {
    setCart(prev => prev.filter(item => !(item.product.id === productId && item.selectedVariant === variant)));
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => {
      const isWished = prev.includes(productId);
      const newWishlist = isWished ? prev.filter(id => id !== productId) : [...prev, productId];
      if (!isWished) toast.success("Added to Wishlist");
      return newWishlist;
    });
  };

  return (
    <ShopContext.Provider value={{
      cart, wishlist, searchQuery, isCartOpen, isWishlistOpen,
      setSearchQuery, setIsCartOpen, setIsWishlistOpen,
      addToCart, removeFromCart, updateCartItemQuantity, toggleWishlist, clearCart
    }}>
      {children}
    </ShopContext.Provider>
  );
}

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShop must be used within a ShopProvider");
  }
  return context;
};
