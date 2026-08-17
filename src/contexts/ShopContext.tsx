import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, ProductVariant } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

interface ShopContextType {
  cart: CartItem[];
  wishlist: string[];
  searchQuery: string;
  isCartOpen: boolean;
  isWishlistOpen: boolean;
  isAiAssistantOpen: boolean;
  setSearchQuery: (q: string) => void;
  setIsCartOpen: (v: boolean) => void;
  setIsWishlistOpen: (v: boolean) => void;
  setIsAiAssistantOpen: (v: boolean) => void;
  addToCart: (product: Product, quantity: number, variant?: string | ProductVariant, variantObj?: ProductVariant) => void;
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
    try {
      const saved = localStorage.getItem("aloeflora_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("aloeflora_wishlist");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);

  // Sync and Merge profile data on mount or user change (Guest Cart Merging)
  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          const { data } = await supabase.from('profiles').select('cart, wishlist').eq('id', user.id).maybeSingle();
          if (data) {
            // Merge guest cart from localStorage with user's remote profile cart
            const localRaw = localStorage.getItem("aloeflora_cart");
            const localCart: CartItem[] = localRaw ? JSON.parse(localRaw) : [];
            const remoteCart: CartItem[] = Array.isArray(data.cart) ? data.cart : [];

            const mergedCart = [...remoteCart];
            localCart.forEach(localItem => {
              const existingIdx = mergedCart.findIndex(
                m => m.product.id === localItem.product.id && m.selectedVariant === localItem.selectedVariant
              );
              if (existingIdx >= 0) {
                mergedCart[existingIdx].quantity = Math.max(mergedCart[existingIdx].quantity, localItem.quantity);
              } else {
                mergedCart.push(localItem);
              }
            });

            setCart(mergedCart);

            // Merge wishlist
            const localWishlist: string[] = JSON.parse(localStorage.getItem("aloeflora_wishlist") || "[]");
            const remoteWishlist: string[] = Array.isArray(data.wishlist) ? data.wishlist : [];
            const mergedWishlist = Array.from(new Set([...remoteWishlist, ...localWishlist]));
            setWishlist(mergedWishlist);
          }
        } catch (err) {
          console.error("Error syncing profile cart/wishlist:", err);
        } finally {
          setIsProfileLoaded(true);
        }
      };
      fetchProfile();
    } else {
      setIsProfileLoaded(false);
    }
  }, [user]);

  // Persist Cart to localStorage & Supabase
  useEffect(() => {
    try {
      localStorage.setItem("aloeflora_cart", JSON.stringify(cart));
    } catch (e) {}

    if (user && isProfileLoaded) {
      supabase.from('profiles').update({ cart }).eq('id', user.id).then();
    }
  }, [cart, user, isProfileLoaded]);

  // Persist Wishlist to localStorage & Supabase
  useEffect(() => {
    try {
      localStorage.setItem("aloeflora_wishlist", JSON.stringify(wishlist));
    } catch (e) {}

    if (user && isProfileLoaded) {
      supabase.from('profiles').update({ wishlist }).eq('id', user.id).then();
      supabase.auth.updateUser({ data: { wishlist } }).then();
    }
  }, [wishlist, user, isProfileLoaded]);

  // Actions
  const addToCart = (product: Product, quantity: number, variant?: string | ProductVariant, variantObj?: ProductVariant) => {
    const variantName = typeof variant === 'object' ? variant.name : (variant || (variantObj ? variantObj.name : undefined));
    const finalVariantObj = typeof variant === 'object' ? variant : variantObj;
    const availableStock = finalVariantObj?.stock ?? product.stock;

    if (availableStock <= 0) {
      toast.error(`Sorry, ${product.name} is currently out of stock.`);
      return;
    }

    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.product.id === product.id && item.selectedVariant === variantName);
      if (existingIdx >= 0) {
        const currentQty = prev[existingIdx].quantity;
        const newQty = currentQty + quantity;
        if (newQty > availableStock) {
          toast.error(`Only ${availableStock} units available in stock.`);
          const newCart = [...prev];
          newCart[existingIdx].quantity = availableStock;
          return newCart;
        }
        const newCart = [...prev];
        newCart[existingIdx].quantity = newQty;
        if (finalVariantObj) newCart[existingIdx].selectedVariantObj = finalVariantObj;
        return newCart;
      }
      
      const safeQty = Math.min(quantity, availableStock);
      return [...prev, { product, quantity: safeQty, selectedVariant: variantName, selectedVariantObj: finalVariantObj }];
    });

    toast.success(`${quantity}x ${product.name} ${variantName ? `(${variantName})` : ''} added to cart`);
  };

  const updateCartItemQuantity = (productId: string, variant: string | undefined, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, variant);
      return;
    }

    setCart(prev => prev.map(item => {
      if (item.product.id === productId && item.selectedVariant === variant) {
        const availableStock = item.selectedVariantObj?.stock ?? item.product.stock;
        if (quantity > availableStock) {
          toast.error(`Only ${availableStock} units available in stock.`);
          return { ...item, quantity: availableStock };
        }
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
    try {
      localStorage.removeItem("aloeflora_cart");
    } catch (e) {}
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
      cart, wishlist, searchQuery, isCartOpen, isWishlistOpen, isAiAssistantOpen,
      setSearchQuery, setIsCartOpen, setIsWishlistOpen, setIsAiAssistantOpen,
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
