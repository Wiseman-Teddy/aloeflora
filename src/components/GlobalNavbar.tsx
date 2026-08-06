import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    setIsMobileMenuOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (window.location.pathname !== '/store') {
      navigate('/store');
    }
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const wishlistItemCount = wishlist.length;

  const navLinks = [
    { name: "Home", path: "/store", isAnchor: false },
    { name: "Products", path: "/store#organic-formulations", isAnchor: true },
    { name: "About Us", path: "/about", isAnchor: false },
    { name: "Blogs", path: "/blogs", isAnchor: false },
    { name: "FAQ", path: "/faq", isAnchor: false },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4 lg:gap-8">
        
        {/* 1. BRAND LOGO & IDENTITY (FAR LEFT - INDUSTRY STANDARD) */}
        <Link to="/store" className="flex items-center gap-3 shrink-0 group">
          <div className="bg-white p-1 rounded-2xl shadow-xs border border-emerald-900/10 dark:border-gray-800 group-hover:scale-105 transition duration-200">
            <img src="/logo.jpeg" alt="ALOEFLORA Logo" className="h-10 w-auto object-contain rounded-xl" />
          </div>
          <div className="text-left select-none hidden sm:block">
            <div className="text-sm font-black tracking-tight leading-none uppercase">
              <span className="text-[#348C21]">ALOE F</span>
              <span className="text-[#152E15] dark:text-emerald-300">LORA</span>
            </div>
            <div className="text-[9px] font-extrabold tracking-widest text-[#2B4E22] dark:text-emerald-400 mt-0.5 uppercase leading-none">
              PRODUCTS
            </div>
          </div>
        </Link>

        {/* 2. CENTER-LEFT: CLEAN TOP NAVIGATION LINKS */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-gray-50/80 dark:bg-gray-900/80 p-1.5 rounded-full border border-gray-200/60 dark:border-gray-800/80 shadow-2xs">
          {navLinks.map((link) => {
            const isActive = !link.isAnchor && location.pathname === link.path;
            if (link.isAnchor) {
              return (
                <a
                  key={link.name}
                  href={link.path}
                  className="px-4 py-2 rounded-full text-xs font-extrabold transition-all duration-200 text-gray-700 dark:text-gray-300 hover:text-emerald-700 hover:bg-white dark:hover:bg-gray-800"
                >
                  {link.name}
                </a>
              );
            }
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all duration-200 ${
                  isActive
                    ? "bg-[#348C21] text-white shadow-xs"
                    : "text-gray-700 dark:text-gray-300 hover:text-emerald-700 hover:bg-white dark:hover:bg-gray-800"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* 3. CENTER: UNIVERSAL SEARCH BAR */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-xs xl:max-w-sm relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search organic products..."
            className="w-full pl-9 pr-8 py-2.5 text-xs font-medium bg-gray-50/90 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 dark:text-white transition shadow-2xs"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          {searchQuery && (
            <button 
              type="button" 
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {/* 4. FAR RIGHT: USER CONTROLS & CART */}
        <div className="flex items-center gap-2.5 shrink-0">
          
          {/* Wishlist Button */}
          <button 
            onClick={() => setIsWishlistOpen(true)}
            title="Wishlist"
            className="relative p-2.5 rounded-full bg-gray-50 hover:bg-red-50 border border-gray-200/80 dark:bg-gray-900 dark:border-gray-800 cursor-pointer transition-all duration-200 text-gray-600 hover:text-red-500 shadow-2xs hover:scale-105 active:scale-95"
          >
            <Heart className="w-4 h-4" />
            {wishlistItemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-black shadow-xs animate-in zoom-in">
                {wishlistItemCount}
              </span>
            )}
          </button>

          {/* Cart Button */}
          <button 
            onClick={() => setIsCartOpen(true)}
            title="Shopping Cart"
            className="relative flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200/80 dark:bg-emerald-950/60 dark:border-emerald-800/80 cursor-pointer transition-all duration-200 text-[#152E15] dark:text-emerald-300 shadow-2xs hover:scale-105 active:scale-95"
          >
            <div className="relative">
              <ShoppingCart className="w-4 h-4 text-[#348C21] dark:text-lime-400" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[16px] h-4 px-1 bg-[#348C21] text-white rounded-full flex items-center justify-center text-[9px] font-black shadow-xs">
                  {cartItemCount}
                </span>
              )}
            </div>
            {cartSubtotal > 0 && (
              <span className="hidden sm:inline text-xs font-black text-[#152E15] dark:text-emerald-300">
                KES {cartSubtotal.toLocaleString()}
              </span>
            )}
          </button>

          {/* Dark Mode Button */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="p-2.5 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-200/80 dark:bg-gray-900 dark:border-gray-800 cursor-pointer transition-all duration-200 text-gray-600 dark:text-lime-400 shadow-2xs hover:scale-105 active:scale-95"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Auth State & User Menu */}
          {user ? (
            <div className="flex items-center gap-2">
              {role === 'admin' && (
                <Link 
                  to="/admin/dashboard" 
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold transition shadow-xs"
                >
                  <Lock className="w-3.5 h-3.5" /> Admin Console
                </Link>
              )}
              {role === 'customer' && (
                <Link 
                  to="/customer/dashboard" 
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-extrabold transition"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" /> My Account
                </Link>
              )}
              <button 
                onClick={handleSignOut} 
                title="Sign Out"
                className="p-2.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 cursor-pointer transition shadow-2xs"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#348C21] hover:bg-[#2b751c] text-white text-xs font-extrabold transition-all duration-200 shadow-md hover:shadow-emerald-600/30 active:scale-95 cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            className="lg:hidden p-2.5 rounded-full border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-100 transition"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 dark:border-gray-800 bg-white/98 dark:bg-gray-950/98 backdrop-blur-xl p-5 space-y-4 shadow-xl absolute w-full max-h-[85vh] overflow-y-auto z-50 animate-in slide-in-from-top-2">
          {/* Mobile Search */}
          <form onSubmit={(e) => { handleSearchSubmit(e); setIsMobileMenuOpen(false); }} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search organic products..."
              className="w-full pl-10 pr-4 py-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 dark:text-white"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          </form>

          {/* Mobile Navigation Links */}
          <nav className="flex flex-col gap-1.5 pt-2">
            {navLinks.map((link) => {
              const isActive = !link.isAnchor && location.pathname === link.path;
              if (link.isAnchor) {
                return (
                  <a
                    key={link.name}
                    href={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-3 rounded-xl font-extrabold text-sm text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-gray-800 hover:text-emerald-700"
                  >
                    {link.name}
                  </a>
                );
              }
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`p-3 rounded-xl font-extrabold text-sm transition ${
                    isActive
                      ? "bg-[#348C21] text-white"
                      : "text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-gray-800 hover:text-emerald-700"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3">
            <button 
              onClick={() => { setDarkMode(!darkMode); }} 
              className="p-3 rounded-xl flex items-center justify-between bg-gray-50 dark:bg-gray-900 font-extrabold text-sm text-gray-700 dark:text-gray-200 w-full"
            >
              <span>Appearance Theme</span>
              {darkMode ? <Sun className="w-4 h-4 text-lime-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
            </button>

            {user ? (
              <div className="flex flex-col gap-2 pt-2">
                {role === 'admin' && (
                  <Link 
                    to="/admin/dashboard" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="p-3 bg-emerald-700 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" /> Admin Console
                  </Link>
                )}
                {role === 'customer' && (
                  <Link 
                    to="/customer/dashboard" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="p-3 bg-emerald-100 text-emerald-900 font-extrabold text-sm rounded-xl flex items-center justify-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" /> My Account
                  </Link>
                )}
                <button 
                  onClick={handleSignOut} 
                  className="p-3 bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 w-full"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="p-3.5 bg-[#348C21] text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 w-full shadow-md"
              >
                <UserIcon className="w-4 h-4" /> Sign In to Account
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
