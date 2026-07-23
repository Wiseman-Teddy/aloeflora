import React from 'react';
import { Heart, ShoppingCart, X } from 'lucide-react';
import { useShop } from '../contexts/ShopContext';
import { Product } from '../types';

interface WishlistSidebarProps {
  products: Product[];
}

export default function WishlistSidebar({ products }: WishlistSidebarProps) {
  const { wishlist, isWishlistOpen, setIsWishlistOpen, toggleWishlist, addToCart } = useShop();

  if (!isWishlistOpen) return null;

  return (
    <div id="wishlist-sidebar-backdrop" className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex justify-end">
      <div className="bg-white dark:bg-gray-900 w-full max-w-sm h-full shadow-2xl flex flex-col justify-between p-6 animate-in slide-in-from-right duration-250 relative">
        <button 
          onClick={() => setIsWishlistOpen(false)}
          className="absolute top-4 left-4 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full cursor-pointer text-gray-500"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex-1 overflow-y-auto text-left pt-10">
          <h3 className="text-md font-extrabold pb-3 border-b border-gray-100 dark:border-gray-800 text-gray-950 dark:text-white flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" /> Saved Favourites
          </h3>
          
          {wishlist.length === 0 ? (
            <div className="text-center py-20">
              <Heart className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto" />
              <p className="text-xs text-gray-400 mt-2">Your wishlist is currently empty.</p>
            </div>
          ) : (
            <div className="space-y-4 mt-6">
              {wishlist.map((id) => {
                const matched = products.find((p) => p.id === id);
                if (!matched) return null;
                return (
                  <div key={id} className="flex gap-3 bg-zinc-50/50 dark:bg-gray-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="h-10 w-10 bg-white dark:bg-gray-700 rounded overflow-hidden shadow-sm">
                      <img src={matched.imageUrl} alt={matched.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs truncate dark:text-white">{matched.name}</h4>
                      <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">KES {matched.price}</span>
                    </div>
                    <button 
                      onClick={() => {
                        addToCart(matched, 1);
                        toggleWishlist(matched.id);
                      }}
                      className="bg-emerald-800 p-1.5 rounded text-white self-center cursor-pointer hover:bg-emerald-700 transition shadow-sm"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
