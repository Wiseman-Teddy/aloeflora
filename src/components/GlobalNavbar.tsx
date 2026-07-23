import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sun, Moon, Lock, LayoutDashboard, LogOut, User as UserIcon, Menu, X, 
  Search, ShoppingCart, Heart 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useShop } from '../contexts/ShopContext';

interface GlobalNavbarProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

export default function GlobalNavbar({ darkMode, setDarkMode }: GlobalNavbarProps) {
  const { user, role, signOut } = useAuth();
  const { cart, wishlist, searchQuery, setSearchQuery, setIsCartOpen, setIsWishlistOpen } = useShop();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (window.location.pathname !== '/store') {
      navigate('/store');
    }
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistItemCount = wishlist.length;

  return (
    <header id="enterprise-header" className="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <div className="bg-white p-0.5 rounded-xl shadow-sm border border-emerald-900/10 dark:border-gray-800">
            <img src="/logo.jpeg" alt="ALOEFLORA Logo" className="h-10 w-auto object-contain rounded-lg" />
          </div>
          <div className="text-left select-none hidden sm:block">
            <div className="text-sm font-extrabold tracking-tight text-emerald-800 dark:text-lime-400 block scale-y-105 leading-none uppercase whitespace-nowrap">
              ALOEFLORA PRODUCTS
            </div>
            <div className="text-[9px] uppercase font-bold tracking-wider text-gray-400 mt-1 block font-mono leading-none whitespace-nowrap">
              Quality, Affordable & Natural
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden xl:flex items-center gap-1 bg-neutral-100/70 dark:bg-zinc-900/60 p-1 rounded-full border border-neutral-150/40">
          <Link to="/store" className="px-3 py-1.5 rounded-full text-xs font-semibold transition text-gray-600 dark:text-gray-300 hover:text-gray-950 hover:bg-white dark:hover:bg-gray-800">Home</Link>
          <a href="/store#organic-formulations" className="px-3 py-1.5 rounded-full text-xs font-semibold transition text-gray-600 dark:text-gray-300 hover:text-gray-950 hover:bg-white dark:hover:bg-gray-800">Products</a>
          <Link to="/about" className="px-3 py-1.5 rounded-full text-xs font-semibold transition text-gray-600 dark:text-gray-300 hover:text-gray-950 hover:bg-white dark:hover:bg-gray-800">About Us</Link>
          <Link to="/blogs" className="px-3 py-1.5 rounded-full text-xs font-semibold transition text-gray-600 dark:text-gray-300 hover:text-gray-950 hover:bg-white dark:hover:bg-gray-800">Blogs</Link>
          <Link to="/faq" className="px-3 py-1.5 rounded-full text-xs font-semibold transition text-gray-600 dark:text-gray-300 hover:text-gray-950 hover:bg-white dark:hover:bg-gray-800">FAQ</Link>
        </nav>

        {/* Global Search Bar (Desktop) */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-sm relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full focus:outline-none focus:border-emerald-600 dark:text-white"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1.5" />
        </form>

        {/* Interactive controls */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Wishlist Button */}
          <button 
            onClick={() => setIsWishlistOpen(true)}
            className="relative p-2.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-neutral-150/50 dark:bg-zinc-900 dark:border-gray-800 cursor-pointer transition text-gray-500 hover:text-red-500"
          >
            <Heart className="w-4 h-4" />
            {wishlistItemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px] font-bold">
                {wishlistItemCount}
              </span>
            )}
          </button>

          {/* Cart Button */}
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-neutral-150/50 dark:bg-zinc-900 dark:border-gray-800 cursor-pointer transition text-gray-500 hover:text-emerald-600"
          >
            <ShoppingCart className="w-4 h-4" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[8px] font-bold">
                {cartItemCount}
              </span>
            )}
          </button>

          {/* Dark mode button */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="hidden sm:block p-2.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-neutral-150/50 dark:bg-zinc-900 dark:border-gray-800 cursor-pointer transition text-gray-500 dark:text-lime-400"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Auth Buttons & Roles */}
          {user ? (
            <div className="hidden lg:flex items-center gap-2">
              {role === 'admin' && (
                <Link to="/admin/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold transition">
                  <Lock className="w-3.5 h-3.5" /> Console
                </Link>
              )}
              {role === 'customer' && (
                <Link to="/customer/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold transition">
                  <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                </Link>
              )}
              <button onClick={signOut} className="p-2 rounded-full bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer transition">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-2">
              <Link to="/login" className="px-4 py-1.5 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5" /> Sign In
              </Link>
            </div>
          )}

          {/* Mobile menu trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="xl:hidden p-2 rounded-xl border cursor-pointer hover:bg-neutral-50 dark:hover:bg-gray-800"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile navigation drawer */}
      {isMobileMenuOpen && (
        <div className="xl:hidden border-t bg-white dark:bg-gray-900 p-4 space-y-4 shadow-lg absolute w-full max-h-[80vh] overflow-y-auto z-50 animate-in slide-in-from-top-2">
          {/* Mobile Search */}
          <form onSubmit={(e) => { handleSearchSubmit(e); setIsMobileMenuOpen(false); }} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-emerald-600 dark:text-white"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
          </form>

          <nav className="flex flex-col gap-2">
            <Link to="/store" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-white">Home</Link>
            <a href="/store#organic-formulations" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-white">Products</a>
            <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-white">About Us</Link>
            <Link to="/blogs" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-white">Blogs</Link>
            <Link to="/faq" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-white">FAQ</Link>
          </nav>

          <div className="border-t dark:border-gray-700 pt-4 flex items-center justify-between">
            <button onClick={() => setDarkMode(!darkMode)} className="p-3 rounded-xl flex items-center gap-2 bg-gray-50 dark:bg-gray-800 font-bold dark:text-white w-full">
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              Toggle Theme
            </button>
          </div>

          <div className="pt-2">
            {user ? (
              <div className="flex flex-col gap-2">
                {role === 'admin' && (
                  <Link to="/admin/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="p-3 bg-emerald-100 text-emerald-800 font-bold rounded-xl flex justify-center gap-2">
                    <Lock className="w-4 h-4" /> Admin Console
                  </Link>
                )}
                {role === 'customer' && (
                  <Link to="/customer/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="p-3 bg-emerald-100 text-emerald-800 font-bold rounded-xl flex justify-center gap-2">
                    <LayoutDashboard className="w-4 h-4" /> My Dashboard
                  </Link>
                )}
                <button onClick={() => { signOut(); setIsMobileMenuOpen(false); }} className="p-3 bg-red-100 text-red-600 font-bold rounded-xl flex justify-center gap-2 w-full">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            ) : (
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="p-3 bg-emerald-800 text-white font-bold rounded-xl flex justify-center gap-2 w-full">
                <UserIcon className="w-4 h-4" /> Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
