import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Sun, Moon, Lock, LayoutDashboard, LogOut, User as UserIcon, Menu, X, 
  Search, ShoppingCart, Heart, ChevronDown, HelpCircle, Phone, 
  ShieldCheck, Truck, Banknote, RotateCcw, Award, Sparkles, ExternalLink,
  Layers, Tag, MessageSquare, ShoppingBag, ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useShop } from '../contexts/ShopContext';
import { Product } from '../types';

interface GlobalNavbarProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  products?: Product[];
}

export default function GlobalNavbar({ darkMode, setDarkMode, products = [] }: GlobalNavbarProps) {
  const { user, role, signOut } = useAuth();
  const { cart, wishlist, searchQuery, setSearchQuery, setIsCartOpen, setIsWishlistOpen } = useShop();
  
  // Navigation & Dropdown states
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isHelpMenuOpen, setIsHelpMenuOpen] = useState(false);
  const [isAppBannerOpen, setIsAppBannerOpen] = useState(true);
  const [isCategoriesDropdownOpen, setIsCategoriesDropdownOpen] = useState(false);
  
  // Search Focus State for Live Interactive Dropdown
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const accountMenuRef = useRef<HTMLDivElement>(null);
  const helpMenuRef = useRef<HTMLDivElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdowns & search overlays on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
      if (helpMenuRef.current && !helpMenuRef.current.contains(event.target as Node)) {
        setIsHelpMenuOpen(false);
      }
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setIsCategoriesDropdownOpen(false);
      }
      if (
        searchRef.current && !searchRef.current.contains(event.target as Node) &&
        mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    setIsMobileMenuOpen(false);
    setIsAccountMenuOpen(false);
  };

  // Submit Search & Smooth Scroll to Store Catalog
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearchFocused(false);
    if (location.pathname !== '/store') {
      navigate('/store');
    }
    setTimeout(() => {
      const element = document.getElementById('organic-formulations') || document.getElementById('product-catalog');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Select item from live search dropdown
  const handleSelectProduct = (productId: string) => {
    setIsSearchFocused(false);
    navigate(`/product/${productId}`);
  };

  // Handle Home and Organic Products navigation clicks
  const handleNavClick = (linkName: string, e: React.MouseEvent) => {
    if (linkName === "Home") {
      setSearchQuery("");
      if (location.pathname === "/store" && !location.hash) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        navigate("/store");
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }, 100);
      }
    } else if (linkName === "Organic Products") {
      e.preventDefault();
      setSearchQuery("");
      navigate("/store?category=all#organic-formulations");
      setTimeout(() => {
        const el = document.getElementById("organic-formulations");
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  };

  // Compute Live Search Matches
  const matchingProducts = useMemo(() => {
    if (!searchQuery.trim() || !products || products.length === 0) return [];
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(q);
      const catMatch = p.category.toLowerCase().includes(q);
      const subMatch = p.subCategory ? p.subCategory.toLowerCase().includes(q) : false;
      const descMatch = p.description ? p.description.toLowerCase().includes(q) : false;
      return nameMatch || catMatch || subMatch || descMatch;
    }).slice(0, 5);
  }, [searchQuery, products]);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const wishlistItemCount = wishlist.length;

  const categoriesList = [
    { name: "Home Care & Cleaning", filter: "home", icon: "🧼" },
    { name: "Body & Personal Care", filter: "body", icon: "💆‍♀️" },
    { name: "Botanical Hair Care", filter: "hair", icon: "🧴" },
    { name: "Premium Coffee Line", filter: "coffee", icon: "☕" },
  ];

  return (
    <header className="w-full font-sans sticky top-0 z-50 shadow-md transition-all">
      
      {/* ========================================================================= */}
      {/* 1. MOBILE APP PROMO BANNER                                               */}
      {/* ========================================================================= */}
      {isAppBannerOpen && (
        <div className="lg:hidden bg-gray-950 text-white px-3 py-1.5 flex items-center justify-between text-xs border-b border-emerald-900/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <button 
              onClick={() => setIsAppBannerOpen(false)}
              className="text-gray-400 hover:text-white p-1 rounded-full cursor-pointer shrink-0"
              aria-label="Close app banner"
            >
              <X className="w-4 h-4" />
            </button>
            <img 
              src="/logo.jpeg" 
              alt="Aloeflora App Icon" 
              className="w-7 h-7 rounded-lg object-cover border border-emerald-500/40 shrink-0" 
            />
            <div className="truncate">
              <p className="font-bold text-[11px] leading-tight text-white truncate">
                Shop on the Aloeflora website
              </p>
              <p className="text-[9.5px] text-emerald-300/80 truncate">
                Free on web
              </p>
            </div>
          </div>
          <a
            href="/store"
            className="ml-2 px-3 py-1 bg-[#348C21] hover:bg-[#2b751c] text-white font-extrabold text-xs rounded-md shadow-xs shrink-0 transition"
          >
            Open
          </a>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TOP ANNOUNCEMENT & FEATURE BAR                                         */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-[#152E15] via-[#2B4E22] to-[#348C21] text-white py-1.5 px-4 sm:px-6 lg:px-8 text-xs font-bold shadow-inner border-b border-emerald-900/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Desktop/Tablet Feature Signals */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            <div className="flex items-center gap-1.5 text-emerald-100">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Quality Products</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-100">
              <Truck className="w-4 h-4 text-emerald-400" />
              <span>Fast Delivery</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-100">
              <Banknote className="w-4 h-4 text-emerald-400" />
              <span>Cash on Delivery</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-100">
              <RotateCcw className="w-4 h-4 text-emerald-400" />
              <span>Easy Returns</span>
            </div>
          </div>

          {/* Contact Phone & WhatsApp Info */}
          <div className="flex items-center justify-between w-full lg:w-auto gap-3">
            <a 
              href="https://wa.me/254116794448" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white hover:text-emerald-300 transition truncate"
            >
              <Phone className="w-3.5 h-3.5 shrink-0 text-emerald-400 fill-current" />
              <span className="text-[11px] sm:text-xs font-extrabold">
                Call or WhatsApp <span className="underline tracking-wide">0116 794 448</span>
              </span>
            </a>
            
            <Link 
              to="/store#organic-formulations" 
              className="bg-white hover:bg-emerald-50 text-[#152E15] px-3 py-1 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded transition shrink-0 shadow-xs"
            >
              SHOP NOW
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DESKTOP SECONDARY SUB-BAR                                              */}
      {/* ========================================================================= */}
      <div className="hidden lg:block bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-[11px] font-bold text-gray-700 dark:text-gray-300 py-1 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a 
            href="https://wa.me/254116794448?text=Hello%20Aloeflora,%20I%20am%20interested%20in%20becoming%20a%20partner/vendor" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[#348C21] dark:text-emerald-400 hover:underline font-extrabold"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 fill-current" />
            <span>Sell & Partner on Aloeflora</span>
          </a>

          <div className="flex items-center gap-6 uppercase tracking-wider font-extrabold text-[10px] text-gray-500 dark:text-gray-400">
            <Link to="/store" className="hover:text-[#348C21] dark:hover:text-emerald-400 transition flex items-center gap-1">
              <span className="text-[#348C21]">ALOELUXE</span>
            </Link>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <Link to="/store?category=home#organic-formulations" className="hover:text-[#348C21] dark:hover:text-emerald-400 transition">
              HYGIENE & CARE
            </Link>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <Link to="/store?category=hair#organic-formulations" className="hover:text-[#348C21] dark:hover:text-emerald-400 transition">
              BOTANICAL HAIR CARE
            </Link>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <Link to="/store?category=coffee#organic-formulations" className="hover:text-[#348C21] dark:hover:text-emerald-400 transition">
              PREMIUM COFFEE
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MAIN HEADER ROW WITH FULLY INTEGRATED LIVE SEARCH                      */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3 md:gap-8">
          
          {/* LEFT: Mobile Hamburger Menu Trigger + Clean Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle Menu"
              className="lg:hidden p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 hover:bg-gray-100 transition cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link to="/store" className="flex items-center gap-2.5 group">
              <div className="bg-white p-1 rounded-xl shadow-xs border border-emerald-900/10 dark:border-gray-800 group-hover:scale-105 transition duration-200">
                <img src="/logo.jpeg" alt="ALOEFLORA Logo" className="h-9 sm:h-11 w-auto object-contain rounded-lg" />
              </div>
              <div className="text-left select-none flex flex-col justify-center">
                <div className="text-sm sm:text-base font-black tracking-tight leading-none uppercase">
                  <span className="text-[#348C21]">ALOE F</span>
                  <span className="text-[#152E15] dark:text-emerald-300">LORA</span>
                </div>
                <div className="text-[8px] sm:text-[9.5px] font-extrabold tracking-widest text-[#2B4E22] dark:text-emerald-400 mt-0.5 uppercase leading-none">
                  PRODUCTS
                </div>
              </div>
            </Link>
          </div>

          {/* CENTER: DESKTOP FULLY INTEGRATED SEARCH BAR WITH LIVE SUGGESTIONS */}
          <div className="hidden md:flex flex-1 max-w-2xl relative" ref={searchRef}>
            <form 
              onSubmit={handleSearchSubmit} 
              className="w-full relative flex items-center"
            >
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                placeholder="Search products, brands and categories..."
                className="w-full pl-10 pr-24 py-2.5 text-xs font-semibold bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#348C21]/30 focus:border-[#348C21] dark:text-white transition shadow-2xs"
              />
              {searchQuery && (
                <button 
                  type="button" 
                  onClick={() => {
                    setSearchQuery("");
                    setIsSearchFocused(false);
                  }}
                  className="absolute right-24 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-0 top-0 bottom-0 px-6 bg-[#348C21] hover:bg-[#2b751c] text-white font-black text-xs uppercase tracking-wider rounded-r-lg transition flex items-center justify-center cursor-pointer shadow-xs"
              >
                Search
              </button>
            </form>

            {/* LIVE DESKTOP SEARCH SUGGESTIONS OVERLAY */}
            {isSearchFocused && searchQuery.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
                <div className="p-2.5 bg-gray-50 dark:bg-gray-950/60 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500 font-bold">
                  <span>Search Suggestions</span>
                  <span>{matchingProducts.length} matches</span>
                </div>

                {matchingProducts.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800/60 max-h-80 overflow-y-auto">
                    {matchingProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleSelectProduct(product.id)}
                        className="w-full p-3 flex items-center gap-3 hover:bg-emerald-50/60 dark:hover:bg-gray-800/80 transition text-left cursor-pointer group"
                      >
                        <img 
                          src={product.imageUrl?.split(',')[0]} 
                          alt={product.name} 
                          className="w-10 h-10 object-cover rounded-lg border border-gray-200 dark:border-gray-700 shrink-0" 
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate group-hover:text-[#348C21] dark:group-hover:text-emerald-400">
                            {product.name}
                          </p>
                          <p className="text-[10px] text-gray-400 uppercase font-semibold">
                            Category: {product.category}
                          </p>
                        </div>
                        <span className="text-xs font-black text-[#348C21] dark:text-emerald-400 shrink-0">
                          KES {product.price.toLocaleString()}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-gray-500 italic">
                    No products found matching "{searchQuery}". Try searching "shower", "hair", "coffee", or "soap".
                  </div>
                )}

                <button
                  onClick={handleSearchSubmit}
                  className="w-full p-2.5 bg-emerald-50 dark:bg-gray-950 text-[#348C21] dark:text-emerald-400 font-extrabold text-xs text-center border-t border-gray-100 dark:border-gray-800 hover:bg-emerald-100/60 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>View all results for "{searchQuery}"</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: USER CONTROLS, ACCOUNT, HELP & CART */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            
            {/* Account Dropdown */}
            <div className="hidden lg:block relative" ref={accountMenuRef}>
              <button
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-800 dark:text-gray-200 transition cursor-pointer font-bold text-xs"
              >
                <UserIcon className="w-5 h-5 text-[#348C21] dark:text-emerald-400" />
                <div className="text-left leading-tight hidden xl:block">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">
                    {user ? `Hi, ${user.email?.split('@')[0]}` : 'Welcome'}
                  </p>
                  <p className="font-extrabold text-xs text-gray-900 dark:text-white flex items-center gap-1">
                    Account <ChevronDown className="w-3 h-3 text-gray-500" />
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500 xl:hidden" />
              </button>

              {/* Dropdown Card */}
              {isAccountMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 p-3 z-50 animate-in fade-in slide-in-from-top-2">
                  {user ? (
                    <div className="space-y-2">
                      <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                        <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Signed in as</p>
                        <p className="text-xs font-black text-emerald-900 dark:text-emerald-300 truncate">{user.email}</p>
                      </div>

                      {role === 'admin' ? (
                        <Link 
                          to="/admin/dashboard" 
                          onClick={() => setIsAccountMenuOpen(false)}
                          className="flex items-center gap-2.5 p-2.5 rounded-lg text-xs font-extrabold text-gray-700 dark:text-gray-200 hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-gray-800 transition"
                        >
                          <Lock className="w-4 h-4 text-emerald-600" /> Admin Console
                        </Link>
                      ) : (
                        <Link 
                          to="/customer/dashboard" 
                          onClick={() => setIsAccountMenuOpen(false)}
                          className="flex items-center gap-2.5 p-2.5 rounded-lg text-xs font-extrabold text-gray-700 dark:text-gray-200 hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-gray-800 transition"
                        >
                          <LayoutDashboard className="w-4 h-4 text-emerald-600" /> My Account & Orders
                        </Link>
                      )}

                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 p-2.5 rounded-lg text-xs font-extrabold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer text-left"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 p-1">
                      <Link 
                        to="/login"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="w-full py-2.5 bg-[#348C21] hover:bg-[#2b751c] text-white font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 shadow-xs transition"
                      >
                        <UserIcon className="w-4 h-4" /> SIGN IN
                      </Link>
                      <div className="border-t border-gray-100 dark:border-gray-800 pt-2 space-y-1">
                        <Link 
                          to="/customer/dashboard" 
                          onClick={() => setIsAccountMenuOpen(false)}
                          className="flex items-center gap-2.5 p-2 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-gray-800 transition"
                        >
                          <ShoppingBag className="w-4 h-4 text-gray-500" /> My Account & Orders
                        </Link>
                        <Link 
                          to="/policies/returns" 
                          onClick={() => setIsAccountMenuOpen(false)}
                          className="flex items-center gap-2.5 p-2 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-gray-800 transition"
                        >
                          <RotateCcw className="w-4 h-4 text-gray-500" /> Track & Returns
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Help Dropdown */}
            <div className="hidden lg:block relative" ref={helpMenuRef}>
              <button
                onClick={() => setIsHelpMenuOpen(!isHelpMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-800 dark:text-gray-200 transition cursor-pointer font-extrabold text-xs"
              >
                <HelpCircle className="w-5 h-5 text-[#348C21] dark:text-emerald-400" />
                <span>Help</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              </button>

              {isHelpMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 p-2 z-50 animate-in fade-in slide-in-from-top-2 space-y-1">
                  <Link 
                    to="/faq" 
                    onClick={() => setIsHelpMenuOpen(false)}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-gray-800 transition"
                  >
                    <HelpCircle className="w-4 h-4 text-[#348C21]" /> Help Center & FAQ
                  </Link>
                  <Link 
                    to="/about" 
                    onClick={() => setIsHelpMenuOpen(false)}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-gray-800 transition"
                  >
                    <Sparkles className="w-4 h-4 text-[#348C21]" /> About Aloeflora
                  </Link>
                  <Link 
                    to="/blogs" 
                    onClick={() => setIsHelpMenuOpen(false)}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-gray-800 transition"
                  >
                    <Tag className="w-4 h-4 text-[#348C21]" /> Blogs & Articles
                  </Link>
                  <Link 
                    to="/policies/returns" 
                    onClick={() => setIsHelpMenuOpen(false)}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-gray-800 transition"
                  >
                    <RotateCcw className="w-4 h-4 text-[#348C21]" /> Returns & Refund Policy
                  </Link>
                  <a 
                    href="https://wa.me/254116794448" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={() => setIsHelpMenuOpen(false)}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 transition"
                  >
                    <MessageSquare className="w-4 h-4" /> Live WhatsApp Support
                  </a>
                </div>
              )}
            </div>

            {/* Mobile Account Quick Button */}
            <Link
              to={user ? (role === 'admin' ? '/admin/dashboard' : '/customer/dashboard') : '/login'}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-800 dark:text-gray-200 transition"
              title="Account"
            >
              <UserIcon className="w-6 h-6 text-[#348C21] dark:text-emerald-400" />
            </Link>

            {/* Wishlist Button */}
            <button 
              onClick={() => setIsWishlistOpen(true)}
              title="Wishlist"
              className="relative p-2 sm:p-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-700 dark:text-gray-300 hover:text-red-500 transition cursor-pointer"
            >
              <Heart className="w-5 h-5" />
              {wishlistItemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-black shadow-xs">
                  {wishlistItemCount}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button 
              onClick={() => setIsCartOpen(true)}
              title="Shopping Cart"
              className="relative flex items-center gap-2 px-2.5 sm:px-3.5 py-2 rounded-lg bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200/80 dark:bg-emerald-950/60 dark:border-emerald-800/80 text-gray-900 dark:text-white transition cursor-pointer shadow-2xs"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 text-[#348C21] dark:text-emerald-400" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 min-w-[18px] h-4 px-1 bg-[#348C21] text-white rounded-full flex items-center justify-center text-[9.5px] font-black shadow-xs">
                    {cartItemCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline text-xs font-black text-[#152E15] dark:text-emerald-300">
                Cart
              </span>
              {cartSubtotal > 0 && (
                <span className="hidden lg:inline text-xs font-black text-[#348C21] dark:text-emerald-400">
                  (KES {cartSubtotal.toLocaleString()})
                </span>
              )}
            </button>

            {/* Dark Mode Toggle (Desktop only; mobile uses the mobile navigation menu drawer toggle) */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? "Light Mode" : "Dark Mode"}
              className="hidden md:flex p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300 transition cursor-pointer"
            >
              {darkMode ? <Sun className="w-5 h-5 text-emerald-400" /> : <Moon className="w-5 h-5 text-gray-700" />}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MOBILE SEARCH BAR WITH LIVE SUGGESTIONS OVERLAY                        */}
      {/* ========================================================================= */}
      <div className="md:hidden bg-white dark:bg-gray-950 px-4 pb-3 pt-1 border-b border-gray-100 dark:border-gray-800 relative" ref={mobileSearchRef}>
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchFocused(true);
            }}
            placeholder="Search products, brands and categories..."
            className="w-full pl-10 pr-9 py-2.5 text-xs font-medium bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-[#348C21]/30 focus:border-[#348C21] dark:text-white transition"
          />
          {searchQuery && (
            <button 
              type="button" 
              onClick={() => {
                setSearchQuery("");
                setIsSearchFocused(false);
              }}
              className="absolute right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {/* LIVE MOBILE SEARCH SUGGESTIONS OVERLAY */}
        {isSearchFocused && searchQuery.trim().length > 0 && (
          <div className="absolute top-full left-4 right-4 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
            <div className="p-2 bg-gray-50 dark:bg-gray-950/60 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500 font-bold">
              <span>Suggestions ({matchingProducts.length})</span>
            </div>

            {matchingProducts.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800/60 max-h-64 overflow-y-auto">
                {matchingProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleSelectProduct(product.id)}
                    className="w-full p-2.5 flex items-center gap-3 hover:bg-emerald-50/60 dark:hover:bg-gray-800/80 transition text-left cursor-pointer"
                  >
                    <img 
                      src={product.imageUrl?.split(',')[0]} 
                      alt={product.name} 
                      className="w-9 h-9 object-cover rounded-lg border border-gray-200 dark:border-gray-700 shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {product.name}
                      </p>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">
                        {product.category}
                      </p>
                    </div>
                    <span className="text-xs font-black text-[#348C21] dark:text-emerald-400 shrink-0">
                      KES {product.price.toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-gray-500 italic">
                No products found.
              </div>
            )}

            <button
              onClick={handleSearchSubmit}
              className="w-full p-2.5 bg-emerald-50 dark:bg-gray-950 text-[#348C21] dark:text-emerald-400 font-extrabold text-xs text-center border-t border-gray-100 dark:border-gray-800 hover:bg-emerald-100/60 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>See results for "{searchQuery}"</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 6. DESKTOP CATEGORY & NAVIGATION BAR                                      */}
      {/* ========================================================================= */}
      <nav className="hidden lg:block bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Category Selector Dropdown */}
          <div className="relative" ref={categoryMenuRef}>
            <button
              onClick={() => setIsCategoriesDropdownOpen(!isCategoriesDropdownOpen)}
              className="flex items-center gap-2.5 px-4 py-3 bg-[#152E15] hover:bg-[#2B4E22] text-white font-extrabold text-xs tracking-wide uppercase transition cursor-pointer"
            >
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>All Categories</span>
              <ChevronDown className="w-3.5 h-3.5 ml-1" />
            </button>

            {isCategoriesDropdownOpen && (
              <div className="absolute left-0 mt-0 w-64 bg-white dark:bg-gray-900 shadow-2xl border border-gray-100 dark:border-gray-800 rounded-b-xl p-2 z-50 animate-in fade-in slide-in-from-top-1">
                {categoriesList.map((cat) => (
                  <Link
                    key={cat.name}
                    to={`/store?category=${cat.filter}#organic-formulations`}
                    onClick={() => setIsCategoriesDropdownOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-lg text-xs font-bold text-gray-800 dark:text-gray-200 hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-gray-800 transition"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">{cat.icon}</span>
                      {cat.name}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Page Links */}
          <div className="flex items-center gap-1">
            {[
              { name: "Home", path: "/store" },
              { name: "Organic Products", path: "/store?category=all#organic-formulations" },
              { name: "About Us", path: "/about" },
              { name: "Blogs & News", path: "/blogs" },
              { name: "Help & FAQ", path: "/faq" },
              { name: "Policies", path: "/policies/returns" },
            ].map((link) => {
              const isActive = 
                link.name === "Home" 
                  ? location.pathname === "/store" && !location.hash
                  : link.name === "Organic Products"
                    ? location.pathname === "/store" && (location.hash === "#organic-formulations" || location.search.includes("category=all"))
                    : location.pathname === link.path;

              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={(e) => handleNavClick(link.name, e)}
                  className={`px-4 py-3 text-xs font-extrabold transition-colors border-b-2 cursor-pointer ${
                    isActive 
                      ? "border-[#348C21] text-[#348C21] dark:text-emerald-400" 
                      : "border-transparent text-gray-700 dark:text-gray-300 hover:text-[#348C21] dark:hover:text-emerald-400"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Live Contact Quicklink */}
          <a
            href="https://wa.me/254116794448"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-extrabold text-[#348C21] dark:text-emerald-400 hover:underline"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Need Help? Chat Now</span>
          </a>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* 7. MOBILE NAVIGATION DRAWER                                               */}
      {/* ========================================================================= */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Slide-out Drawer */}
          <div className="relative w-4/5 max-w-xs bg-white dark:bg-gray-950 h-full shadow-2xl flex flex-col z-50 overflow-y-auto animate-in slide-in-from-left duration-300">
            
            {/* Drawer Header */}
            <div className="p-4 bg-gradient-to-r from-[#152E15] to-[#348C21] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img src="/logo.jpeg" alt="Aloeflora" className="w-8 h-8 rounded-lg border border-white/30" />
                <span className="font-black text-sm uppercase tracking-wider">ALOEFLORA</span>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Account Status Card */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
              {user ? (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">Welcome back,</p>
                  <p className="text-xs font-black text-gray-900 dark:text-white truncate">{user.email}</p>
                  <Link
                    to={role === 'admin' ? '/admin/dashboard' : '/customer/dashboard'}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#348C21] text-white text-xs font-bold rounded-lg shadow-xs mt-1"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600 dark:text-gray-300 font-bold">Sign in for orders & rewards</p>
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-2 bg-[#348C21] hover:bg-[#2b751c] text-white text-xs font-black uppercase rounded-lg flex items-center justify-center gap-2 shadow-xs"
                  >
                    <UserIcon className="w-4 h-4" /> SIGN IN / REGISTER
                  </Link>
                </div>
              )}
            </div>

            {/* Drawer Category Navigation */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">OUR CATEGORIES</p>
              {categoriesList.map((cat) => (
                <Link
                  key={cat.name}
                  to={`/store?category=${cat.filter}#organic-formulations`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-2 rounded-lg text-xs font-bold text-gray-800 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-gray-900 transition"
                >
                  <span className="text-base">{cat.icon}</span>
                  <span>{cat.name}</span>
                </Link>
              ))}
            </div>

            {/* Drawer Quick Links */}
            <div className="p-4 space-y-1 flex-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">PAGES & HELP</p>
              <Link
                to="/store"
                onClick={(e) => { setIsMobileMenuOpen(false); handleNavClick("Home", e); }}
                className="block p-2 text-xs font-extrabold text-gray-700 dark:text-gray-300 hover:text-[#348C21]"
              >
                Store Home
              </Link>
              <Link
                to="/store?category=all#organic-formulations"
                onClick={(e) => { setIsMobileMenuOpen(false); handleNavClick("Organic Products", e); }}
                className="block p-2 text-xs font-extrabold text-gray-700 dark:text-gray-300 hover:text-[#348C21]"
              >
                Organic Products
              </Link>
              <Link
                to="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block p-2 text-xs font-extrabold text-gray-700 dark:text-gray-300 hover:text-[#348C21]"
              >
                About Us
              </Link>
              <Link
                to="/blogs"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block p-2 text-xs font-extrabold text-gray-700 dark:text-gray-300 hover:text-[#348C21]"
              >
                Blogs & News
              </Link>
              <Link
                to="/faq"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block p-2 text-xs font-extrabold text-gray-700 dark:text-gray-300 hover:text-[#348C21]"
              >
                Help & FAQ
              </Link>
              <Link
                to="/policies/returns"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block p-2 text-xs font-extrabold text-gray-700 dark:text-gray-300 hover:text-[#348C21]"
              >
                Return Policies
              </Link>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 space-y-3">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-950"
              >
                <span>Appearance Mode</span>
                {darkMode ? <Sun className="w-4 h-4 text-emerald-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
              </button>

              {user && (
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 text-xs font-black transition"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </header>
  );
}
