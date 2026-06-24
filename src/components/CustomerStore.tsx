import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { 
  ShoppingBag, 
  Sparkles, 
  Heart, 
  Search, 
  Filter, 
  ShoppingCart, 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  Award, 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare, 
  AlertCircle, 
  X, 
  Check, 
  Plus, 
  Minus, 
  ArrowRight, 
  Info,
  Layers,
  Star,
  RefreshCw,
  Send,
  Loader2,
  Globe,
  Trash2
} from "lucide-react";
import { Product, CartItem, Order, BookingEvent, CMSPost, Promo } from "../types";

import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-hot-toast";

interface CustomerStoreProps {
  products: Product[];
  events: BookingEvent[];
  cmsPosts: CMSPost[];
  onAddOrder: (order: Order) => void;
  onRegisterEvent: (eventId: string, registrant: { name: string; email: string; phone: string }) => boolean;
  onUpdateProductStock: (productId: string, quantitySold: number) => void;
  promos: Promo[];
}

export default function CustomerStore({
  products,
  events,
  cmsPosts,
  onAddOrder,
  onRegisterEvent,
  onUpdateProductStock,
  promos
}: CustomerStoreProps) {
  // Storefront navigation
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("default");
  
  // Auth & Guest Registration
  const { user } = useAuth();
  const [guestPassword, setGuestPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  // Shopping Cart & Wishlist
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("aloeflora_cart");
    return saved ? JSON.parse(saved) : [];
  });
  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem("aloeflora_wishlist");
    return saved ? JSON.parse(saved) : [];
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      setTimeout(() => {
        const id = location.hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    }
  }, [location.hash]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState<boolean>(false);

  // Active product detail popup
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Product Comparison state
  const [compareProducts, setCompareProducts] = useState<Product[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);

  // Hero Slider
  const heroSlides = cmsPosts
    .filter((p) => p.type === "hero" && p.status === "published")
    .flatMap((p) => {
      const urls = p.imageUrl ? p.imageUrl.split(',') : [];
      return urls.map(url => ({ ...p, imageUrl: url }));
    })
    .slice(0, 25);
  const [heroIndex, setHeroIndex] = useState<number>(0);
  const heroRef = useRef<NodeJS.Timeout | null>(null);

  // Multi-step Checkout details
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [checkoutStep, setCheckoutStep] = useState<number>(1);
  const [checkoutConsent, setCheckoutConsent] = useState<boolean>(false);
  const [checkoutName, setCheckoutName] = useState<string>("");
  const [checkoutPhone, setCheckoutPhone] = useState<string>("");
  const [checkoutEmail, setCheckoutEmail] = useState<string>("");
  const [checkoutCounty, setCheckoutCounty] = useState<string>("Nairobi");
  const [checkoutSubCounty, setCheckoutSubCounty] = useState<string>("Westlands");
  const [checkoutEstate, setCheckoutEstate] = useState<string>("");
  const [checkoutBuilding, setCheckoutBuilding] = useState<string>("");
  const [checkoutHouseNum, setCheckoutHouseNum] = useState<string>("");
  const [checkoutNotes, setCheckoutNotes] = useState<string>("");
  const [isSTKSimulating, setIsSTKSimulating] = useState<boolean>(false);
  const [mpesaPinInput, setMpesaPinInput] = useState<string>("");
  const [stkStatus, setStkStatus] = useState<"not_sent" | "waiting_pin" | "verifying" | "success" | "failed">("not_sent");
  const [generatedOrderId, setGeneratedOrderId] = useState<string>("");

  // Loyalty Referral Engine
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0);
  const [referralCodeInput, setReferralCodeInput] = useState<string>("");
  const [referralMessage, setReferralMessage] = useState<string>("");
  const [activePromo, setActivePromo] = useState<Promo | null>(null);

  // Customer AI Specialist (Gemini assistant proxy)
  const [customerQuery, setCustomerQuery] = useState<string>("");
  const [aiChatHistory, setAiChatHistory] = useState<{ role: string; text: string }[]>([
    { role: "assistant", text: "Habari! I am ALOEFLORA PRODUCTS's AI Specialist from Nairobi. How can I assist you with your hair, body, or home care goals today? I can suggest products tailored precisely for curl moisture or skin repair." }
  ]);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [openAiAssistant, setOpenAiAssistant] = useState<boolean>(false);

  // Event Registration Panel
  const [regEventId, setRegEventId] = useState<string | null>(null);
  const [regName, setRegName] = useState<string>("");
  const [regEmail, setRegEmail] = useState<string>("");
  const [regPhone, setRegPhone] = useState<string>("");

  // Fetch user profile on login
  useEffect(() => {
    if (user) {
      const loadProfile = async () => {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
          if (data.wishlist && data.wishlist.length > 0) setWishlist(data.wishlist);
          if (data.cart && data.cart.length > 0) setCart(data.cart);
          if (data.loyalty_points) setLoyaltyPoints(data.loyalty_points);
        }
      };
      loadProfile();
    }
  }, [user]);

  // Save Cart to localstorage & Supabase
  useEffect(() => {
    localStorage.setItem("aloeflora_cart", JSON.stringify(cart));
    if (user) {
      supabase.from('profiles').update({ cart }).eq('id', user.id).then();
    }
  }, [cart, user]);

  // Save Wishlist
  useEffect(() => {
    localStorage.setItem("aloeflora_wishlist", JSON.stringify(wishlist));
    if (user) {
      supabase.from('profiles').update({ wishlist }).eq('id', user.id).then();
      supabase.auth.updateUser({ data: { wishlist } });
    }
  }, [wishlist, user]);

  // Save loyalty points
  useEffect(() => {
    if (user && loyaltyPoints > 0) {
       supabase.from('profiles').update({ loyalty_points: loyaltyPoints }).eq('id', user.id).then();
    }
  }, [loyaltyPoints, user]);

  // Auto-rotate hero slide every 5 seconds
  useEffect(() => {
    if (heroSlides.length > 0) {
      heroRef.current = setInterval(() => {
        setHeroIndex((prev) => (prev + 1) % heroSlides.length);
      }, 5500);
      return () => {
        if (heroRef.current) clearInterval(heroRef.current);
      };
    }
  }, [heroSlides.length]);

  // Add Item to cart
  const addToCart = (product: Product, variant?: string) => {
    const selectedVariant = variant || product.variants?.[0];
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.product.id === product.id && item.selectedVariant === selectedVariant
      );
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id && item.selectedVariant === selectedVariant
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, selectedVariant }];
    });
    // Trigger small animation feedback
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string, variant?: string) => {
    setCart((prev) => prev.filter(
      (item) => !(item.product.id === productId && item.selectedVariant === variant)
    ));
  };

  const updateCartQuantity = (productId: string, variant: string | undefined, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId && item.selectedVariant === variant) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  // Toggle Wishlist
  const toggleWishlist = (id: string) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Compute Cart Financial aggregates
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  
  // Custom Nairobi Delivery Logic:
  // CBD Starehe = KES 0. Outside Nairobi CBD = KES 250 unless subtotal > KES 3000 (Free standard shipping rule)
  const isCbd = checkoutSubCounty.toLowerCase().includes("cbd") || checkoutSubCounty.toLowerCase().includes("starehe");
  const deliveryFee = checkoutCounty !== "Nairobi" 
    ? 300 
    : isCbd 
      ? 0 
      : subtotal >= 3000 
        ? 0 
        : 250;

  const promoDiscount = activePromo ? Math.floor(subtotal * (activePromo.discountPercent / 100)) : 0;
  const total = subtotal - promoDiscount + deliveryFee;

  // Handles Product Compare Selection
  const toggleCompare = (product: Product) => {
    setCompareProducts((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= 3) {
        toast.error("You can compare up to 3 products at a time!");
        return prev;
      }
      return [...prev, product];
    });
  };

  // Filters and Sorters
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.subCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === "price_asc") return a.price - b.price;
    if (sortBy === "price_desc") return b.price - a.price;
    if (sortBy === "rating") return b.rating - a.rating;
    return 0; // default
  });

  // Call server-side Gemini endpoint for helpful natural counseling
  const handleAiConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerQuery.trim()) return;

    const userMessage = customerQuery;
    setAiChatHistory((prev) => [...prev, { role: "user", text: userMessage }]);
    setCustomerQuery("");
    setIsAiLoading(true);

    try {
      const response = await fetch("/api/gemini/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMessage,
          catalog: products.map((p) => ({ name: p.name, category: p.category, desc: p.description, price: p.price }))
        })
      });
      if (!response.ok) throw new Error("API Route failure");
      const data = await response.json();
      setAiChatHistory((prev) => [...prev, { role: "assistant", text: data.response }]);
    } catch (err) {
      // Graceful error message
      setAiChatHistory((prev) => [
        ...prev,
        { 
          role: "assistant", 
          text: "I'm sorry, our AI consultation service is currently unavailable. Please try again later or contact our support team." 
        }
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // STK PIN simulation submit / fallback
  const submitStkPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mpesaPinInput.length !== 4) return;
    setStkStatus("verifying");

    try {
      const orderId = "ORD-" + Math.floor(1000 + Math.random() * 9000);
      setGeneratedOrderId(orderId);

      const newOrder: Order = {
        id: orderId,
        customerName: checkoutName,
        phone: checkoutPhone,
        email: checkoutEmail,
        county: checkoutCounty,
        subCounty: checkoutSubCounty,
        estate: checkoutEstate,
        building: checkoutBuilding,
        houseNumber: checkoutHouseNum,
        deliveryNotes: checkoutNotes,
        items: cart.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          selectedVariant: item.selectedVariant
        })),
        subtotal,
        deliveryFee,
        total,
        paymentMethod: "mpesa_stk",
        paymentStatus: "paid",
        deliveryStatus: "pending",
        mpesaReceipt: "QFK" + Math.random().toString(36).substring(2, 9).toUpperCase(),
        createdAt: new Date().toISOString()
      };

      // Push to Supabase if configured
      try {
        const { error } = await supabase.from('orders').insert([
          {
            id: newOrder.id,
            customer_name: newOrder.customerName,
            phone: newOrder.phone,
            total_amount: newOrder.total,
            status: newOrder.paymentStatus,
            created_at: newOrder.createdAt
          }
        ]);
        if (error) console.warn("Supabase insertion skipped/failed:", error);
      } catch (dbErr) {
        console.warn("No Supabase schema active yet:", dbErr);
      }

      onAddOrder(newOrder);

      cart.forEach((item) => {
        onUpdateProductStock(item.product.id, item.quantity);
      });

      const pointsEarned = Math.floor(subtotal / 100);
      setLoyaltyPoints((prev) => prev + pointsEarned);

      setStkStatus("success");
      setCart([]);
    } catch (error) {
      console.error(error);
      setStkStatus("failed");
    }
  };

  // Launch STK simulation initial signal
  const handleInitiateSTK = async () => {
    if (!checkoutName || !checkoutPhone || !checkoutEmail || !checkoutEstate) {
      toast.error("Please fill in all standard delivery details first!");
      return;
    }
    setStkStatus("verifying");
    setIsSTKSimulating(true);

    try {
      // Point to Express backend running on 3001
      const res = await fetch("/api/mpesa/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: checkoutPhone, amount: total })
      });
      const data = await res.json();

      if (data.success) {
        // Switch to waiting pin UI
        setStkStatus("waiting_pin");
        setMpesaPinInput("");
      } else {
        throw new Error(data.error || "STK Failed");
      }
    } catch (err) {
      console.error("Backend unavailable.", err);
      toast.error("Payment service is currently unavailable. Please try again later.");
      setStkStatus("failed");
    }
  };

  const handleRegister = async (e: React.FormEvent, eventId: string) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPhone) {
      toast.error("Fields cannot be empty!");
      return;
    }

    const post = cmsPosts.find(p => p.id === eventId);
    if (!post) return;

    try {
      let { data: evtData, error: evtErr } = await supabase.from('events').select('*').eq('id', eventId).single();
      
      if (!evtData) {
         const newEvt = {
            id: post.id,
            title: post.title,
            date: post.seoTitle || "TBA",
            location: post.seoDesc || "TBA",
            description: post.content,
            image_url: post.imageUrl || null,
            capacity: parseInt(post.seoKeywords || "50") || 50,
            registrant_count: 0,
            registrants: []
         };
         await supabase.from('events').insert(newEvt);
         evtData = newEvt;
      }
      
      if (evtData.registrant_count >= evtData.capacity) {
         toast.error("Sorry, this event has reached full seating capacity.");
         return;
      }
      
      const newRegistrant = {
          name: regName,
          email: regEmail,
          phone: regPhone,
          registeredAt: new Date().toISOString()
      };
      
      const newRegistrants = [...evtData.registrants, newRegistrant];
      
      const { error: updateErr } = await supabase.from('events').update({
          registrant_count: evtData.registrant_count + 1,
          registrants: newRegistrants
      }).eq('id', eventId);
      
      if (updateErr) throw updateErr;

      onRegisterEvent(eventId, { name: regName, email: regEmail, phone: regPhone });
      toast.success(`Successfully registered ${regName} for the event!`);
      setRegEventId(null);
      setRegName("");
      setRegEmail("");
      setRegPhone("");
    } catch (err: any) {
      toast.error("Registration failed: " + err.message);
    }
  };

  const applyReferral = async () => {
    if (!referralCodeInput) return;
    const code = referralCodeInput.trim().toUpperCase();
    const promo = promos.find(p => p.code === code && p.isActive);
    
    if (promo) {
      setActivePromo(promo);
      setReferralMessage(`Success! ${promo.discountPercent}% discount applied.`);
      toast.success(`${promo.discountPercent}% discount applied!`);
    } else {
      setActivePromo(null);
      setReferralMessage("Invalid or expired promo code.");
      toast.error("Invalid or expired promo code.");
    }
  };

  return (
    <div id="customer-storefront-wrapper" className="space-y-10">
      
      {/* 1. HERO MAIN AREA: Featuring Logo Colors & 10-Product Sliding Carousel */}
      <section id="hero-slider-section" className="relative bg-emerald-950 text-white overflow-hidden shadow-2xl min-h-[calc(100vh-80px)] flex items-center w-[100vw] ml-[calc(50%-50vw)] rounded-b-[2rem] md:rounded-b-[4rem] mb-12">
        {/* Vector brand leaf backgrounds */}
        <div className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-20 bg-[url('https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?auto=format&fit=crop&q=80&w=1200')]"></div>
        <div className="absolute -left-10 -bottom-10 w-96 h-96 bg-gradient-to-tr from-emerald-600/30 via-lime-500/10 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute -right-10 -top-10 w-96 h-96 bg-gradient-to-bl from-lime-500/20 via-emerald-800/20 to-transparent rounded-full blur-2xl"></div>

        <div className="relative max-w-7xl mx-auto px-6 py-12 md:py-20 w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Brand messages */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 bg-emerald-900/50 backdrop-blur-sm border border-emerald-800 px-3 py-1.5 rounded-full text-xs font-semibold text-lime-400">
              <Sparkles className="w-4 h-4" /> Nairobi's Supreme Eco Formulations
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              {cmsPosts.find(p => p.id === 'hero-title')?.content || "Nature's Absolute Repair System"}
            </h1>
            
            <p className="text-sm md:text-base text-emerald-100 max-w-md leading-relaxed">
              {cmsPosts.find(p => p.id === 'hero-subtitle')?.content || "Locally sourced. Zero toxic components. Pure, intense hydration for Kenyan curl structures, skin cells, and healthy household surfaces."}
            </p>

            <div className="flex flex-wrap gap-3">
              <a href="#store-catalog" className="bg-lime-500 hover:bg-lime-400 text-emerald-950 font-bold px-6 py-3 rounded-xl transition duration-300 shadow-md text-sm text-center">
                Explore Products
              </a>
              <button 
                onClick={() => setOpenAiAssistant(true)} 
                className="bg-emerald-900/60 border border-emerald-800 hover:bg-emerald-800 text-white font-medium px-5 py-3 rounded-xl transition duration-300 text-sm"
              >
                Consult Assistant
              </button>
            </div>

            {/* Loyalty points card mock */}
            <div className="bg-emerald-900/40 backdrop-blur-sm border border-emerald-800/80 rounded-2xl p-4 flex items-center justify-between max-w-sm mt-4">
              <div className="flex items-center gap-3">
                <div className="bg-lime-500/10 p-2 rounded-xl text-lime-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-300">Loyalty Tracker</div>
                  <div className="text-xs font-semibold">Gold Member Referral Tier</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-extrabold text-lime-400">{loyaltyPoints}</div>
                <div className="text-[10px] text-emerald-200">Ksh points bank</div>
              </div>
            </div>
          </div>

          {/* CMS Hero Slider Section */}
          <div className="lg:col-span-7 flex flex-col justify-center h-full relative">
            <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden min-h-[300px] flex items-center">
              
              {heroSlides.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center w-full">
                  <div className="md:col-span-5 h-48 md:h-56 rounded-2xl overflow-hidden shadow-lg border border-white/10 relative bg-emerald-950 flex items-center justify-center">
                    <img 
                      src={heroSlides[heroIndex]?.imageUrl || "https://images.unsplash.com/photo-1596547609652-9cf5d8d76921"} 
                      alt={heroSlides[heroIndex]?.title} 
                      className="w-full h-full object-cover select-none"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="md:col-span-7 space-y-3.5 text-left">
                    <h3 className="text-lg md:text-xl font-bold font-sans tracking-tight line-clamp-2">
                      {heroSlides[heroIndex]?.title}
                    </h3>
                    <p className="text-xs text-emerald-100/90 line-clamp-3 leading-relaxed">
                      {heroSlides[heroIndex]?.content}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center w-full text-emerald-200">No Hero Slides configured.</div>
              )}

              {/* Slider Controls */}
              {heroSlides.length > 1 && (
                <>
                  <button 
                    onClick={() => setHeroIndex((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 p-3 rounded-full cursor-pointer transition select-none text-white border border-white/5 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setHeroIndex((prev) => (prev + 1) % heroSlides.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 p-3 rounded-full cursor-pointer transition select-none text-white border border-white/5 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Progress indicators */}
            <div className="flex gap-1.5 justify-center mt-4">
              {heroSlides.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${idx === heroIndex ? "bg-lime-400 w-6" : "bg-white/20 w-1.5"}`}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. MAIN CATALOG ZONE: With Dynamic Filters, Product Comparisons and CRUD operations */}
      <section id="organic-formulations" className="scroll-mt-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-100 dark:border-gray-800 gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest font-mono">Organic Formulations</span>
            <h2 className="text-2xl font-semibold text-gray-950 dark:text-white">Active Product Catalog</h2>
          </div>

          {/* Search, Sort and Filters bars */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white rounded-xl focus:outline-none focus:border-emerald-700 w-48 md:w-60"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="py-2 px-3 text-xs bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white rounded-xl focus:outline-none focus:border-emerald-700"
            >
              <option value="default">Default Sort</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>

            {compareProducts.length > 0 && (
              <button 
                onClick={() => setIsCompareOpen(true)}
                className="bg-emerald-900 border border-emerald-800 text-white font-semibold text-xs py-2 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer hover:bg-emerald-800"
              >
                <Layers className="w-3.5 h-3.5" /> Compare ({compareProducts.length})
              </button>
            )}
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex flex-wrap gap-1.5 py-4">
          {[
            { id: "all", label: "All Items" },
            { id: "hair", label: "Hair Care" },
            { id: "body", label: "Body Care" },
            { id: "home", label: "Home Care" }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold cursor-pointer transition ${
                selectedCategory === cat.id
                  ? "bg-emerald-800 text-white shadow"
                  : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Dynamic Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/20 rounded-2xl border border-dashed border-gray-200">
            <AlertCircle className="w-8 h-8 text-gray-400 mx-auto" />
            <h4 className="text-sm font-semibold text-gray-700 mt-2">No items match your criteria</h4>
            <p className="text-xs text-gray-500 mt-1">Try resetting search string or filtering metrics.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((p) => {
              const inWishlist = wishlist.includes(p.id);
              const isLowStock = p.stock <= p.safetyStock;
              const compareSelected = compareProducts.find((cp) => cp.id === p.id);

              return (
                <div 
                  key={p.id} 
                  className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition duration-300 relative flex flex-col h-full"
                >
                  {/* Badges / Controls */}
                  <div className="absolute top-6 left-6 z-10 flex flex-col gap-1">
                    {p.stock === 0 ? (
                      <span className="text-[9px] font-bold text-white bg-red-600 px-2 py-0.5 rounded uppercase">Out Of Stock</span>
                    ) : isLowStock ? (
                      <span className="text-[9px] font-bold text-emerald-950 bg-lime-400 px-2 py-0.5 rounded uppercase">Low Stock</span>
                    ) : null}
                  </div>

                  <button 
                    onClick={() => toggleWishlist(p.id)}
                    className={`absolute top-6 right-6 z-10 bg-white/80 dark:bg-gray-800/80 p-3 rounded-full shadow hover:scale-105 cursor-pointer transition min-h-[44px] min-w-[44px] flex items-center justify-center ${
                      inWishlist ? "text-red-500" : "text-gray-400"
                    }`}
                  >
                    <Heart className="w-5 h-5 fill-current" />
                  </button>

                  {/* Thumbnail */}
                  <div 
                    onClick={() => setSelectedProduct(p)}
                    className="h-44 w-full rounded-xl overflow-hidden bg-gray-50 group-hover:scale-[1.02] cursor-pointer transition duration-300 mb-4 bg-emerald-950/20 flex items-center justify-center relative"
                  >
                    <img 
                      src={p.imageUrl} 
                      alt={p.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Descriptions block */}
                  <div className="text-left flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-lime-600 dark:text-lime-400 uppercase tracking-widest leading-none">
                          {p.subCategory}
                        </span>
                        <div className="flex items-center gap-0.5 text-xs text-amber-500 font-bold">
                          <Star className="w-3 h-3 fill-current" /> {p.rating}
                        </div>
                      </div>

                      <h3 
                        onClick={() => setSelectedProduct(p)}
                        className="text-sm font-semibold text-gray-900 dark:text-white mt-1 hover:text-emerald-800 cursor-pointer line-clamp-2"
                      >
                        {p.name}
                      </h3>

                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800 mt-4">
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-[10px] text-gray-400 leading-none">Kenyan Price</div>
                          <div className="text-sm font-extrabold text-gray-900 dark:text-white mt-1">KES {p.price}</div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggleCompare(p)}
                            title="Compare specifications"
                            className={`p-2 rounded-lg border transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center ${
                              compareSelected
                                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                                : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                            }`}
                          >
                            <Layers className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => addToCart(p)}
                            disabled={p.stock === 0}
                            className="bg-emerald-800 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white p-2 md:p-3 rounded-xl text-xs font-bold shadow transition cursor-pointer flex items-center justify-center min-h-[44px] min-w-[44px]"
                          >
                            <ShoppingCart className="w-5 h-5 md:w-4 md:h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 2.5 AWARDS SHOWCASE SECTION */}
      {cmsPosts.filter(p => p.type === "award" && p.status === "published").length > 0 && (
        <section id="awards-section" className="mb-12 text-left">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-6">
            <div>
              <span className="text-[10px] text-emerald-800 dark:text-emerald-400 uppercase font-bold tracking-widest">Excellence</span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">Awards & Recognition</h3>
            </div>
            <Award className="w-5 h-5 text-emerald-800" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cmsPosts.filter(p => p.type === "award" && p.status === "published").map(award => (
              <div key={award.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm flex flex-col items-center text-center p-6">
                {award.imageUrl && (
                  <img src={award.imageUrl.split(',')[0]} alt={award.title} className="w-24 h-24 object-cover rounded-full border-4 border-lime-100 mb-4" />
                )}
                <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-2">{award.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{award.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. INFORMATION EVENTS / PROMOTIONS NEWSLETTER SECTION */}
      <section id="events-marketing-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Local Events list */}
        <div className="lg:col-span-8 bg-zinc-50 dark:bg-gray-800/10 border border-zinc-100 dark:border-gray-800 rounded-3xl p-6 text-left">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-6">
            <div>
              <span className="text-[10px] text-emerald-800 dark:text-emerald-400 uppercase font-bold tracking-widest">Wellness Promotion</span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">Kenyan Organic Expos & Farm Walks</h3>
            </div>
            <Calendar className="w-5 h-5 text-emerald-800" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cmsPosts.filter(p => p.type === 'promotion').map((evt) => (
              <div key={evt.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                <div>
                  <div className="h-32 bg-emerald-950 overflow-hidden relative">
                    <img 
                      src={evt.imageUrl} 
                      alt={evt.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute top-2 right-2 bg-emerald-900/90 backdrop-blur text-[10px] font-bold text-lime-400 px-2 py-0.5 rounded border border-emerald-800">
                      {evt.seoTitle || 'Upcoming'}
                    </span>
                  </div>
                  <div className="p-4 space-y-1.5">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{evt.title}</h4>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono">
                      <MapPin className="w-3.5 h-3.5 text-lime-600" /> {evt.seoDesc || 'TBA'}
                    </div>
                    <p className="text-[11px] text-gray-500 line-clamp-3 leading-relaxed pt-1">{evt.content}</p>
                  </div>
                </div>
                <div className="p-4 pt-0 border-t border-gray-50 dark:border-gray-800/60 mt-2 flex items-center justify-between">
                  <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                    Capacity: {evt.seoKeywords || 'Unlimited'}
                  </span>
                  <button 
                    onClick={() => setRegEventId(evt.id)}
                    className="text-xs font-bold text-emerald-800 underline hover:text-emerald-700 cursor-pointer p-2 min-h-[44px] flex items-center"
                  >
                    Register Seat
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Blogs Articles Column / Social Links / Contact Card */}
        <div className="lg:col-span-12 text-left mt-8">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-6">
            <div>
              <span className="text-[10px] text-emerald-800 dark:text-emerald-400 uppercase font-bold tracking-widest">Education</span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">Scientific Blog & Insights</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cmsPosts.filter(p => p.type === "blog" && p.status === "published").map(blog => (
              <div key={blog.id} className="bg-zinc-50 dark:bg-gray-800/10 border border-zinc-100 dark:border-gray-800 rounded-2xl p-5 hover:shadow-md transition">
                {blog.imageUrl && (
                  <div className="h-40 mb-4 rounded-xl overflow-hidden">
                    <img src={blog.imageUrl.split(',')[0]} alt={blog.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2">{blog.title}</h4>
                <p className="text-xs text-gray-500 mt-2 line-clamp-3 leading-relaxed">{blog.content}</p>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-[10px] text-gray-400 font-bold">
                  <span>{blog.author}</span>
                  <span>{blog.createdAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social Links / Contact Card */}
        <div className="lg:col-span-12 space-y-6 text-left mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Dr Dorcas Obondo contact Info Card */}
          <div className="bg-emerald-950 text-white rounded-3xl p-6 relative overflow-hidden shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-lime-500/10 rounded-full blur-xl"></div>
            <h4 className="font-bold text-md tracking-tight">Enterprise Contacts</h4>
            <p className="text-xs text-emerald-200 mt-1 pb-4 border-b border-emerald-800">For enquiries, custom partnerships & stock queries:</p>
            
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 text-xs">
                <div className="bg-emerald-900 p-2 rounded-lg text-lime-400">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[9px] text-emerald-300">Email Address</div>
                  <a href="mailto:obondodoris@gmail.com" className="font-semibold hover:underline">obondodoris@gmail.com</a>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="bg-emerald-900 p-2 rounded-lg text-lime-400">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[9px] text-emerald-300">Hotline Phone</div>
                  <a href="tel:+254702283637" className="font-semibold hover:underline">+254 702 283 637</a>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="bg-emerald-900 p-2 rounded-lg text-lime-400">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[9px] text-emerald-300">Social Accounts</div>
                  <div className="flex gap-2 font-semibold">
                    <a href="https://www.instagram.com/aloefloraproducts?igsh=YzljYTk1ODg3Zg==" target="_blank" referrerPolicy="no-referrer" rel="noreferrer" className="text-lime-400 hover:underline">Instagram</a>
                    <span className="text-emerald-700">|</span>
                    <a href="https://www.facebook.com/aloefloraproducts" target="_blank" referrerPolicy="no-referrer" rel="noreferrer" className="text-lime-400 hover:underline">Facebook</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ panel widget */}
          <div className="bg-zinc-50 dark:bg-gray-800/10 border border-zinc-100 dark:border-gray-800 p-6 rounded-3xl space-y-4">
            <h4 className="font-bold text-sm text-gray-950 dark:text-white">Customer FAQs</h4>
            <div className="space-y-3">
              {cmsPosts.filter(p => p.type === "faq").map((faq) => (
                <details key={faq.id} className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-3 rounded-xl cursor-all-scroll transition">
                  <summary className="text-xs font-semibold text-gray-900 dark:text-white list-none flex items-center justify-between cursor-pointer">
                    <span>{faq.title}</span>
                    <span className="text-emerald-600 font-bold group-open:rotate-45 transition-transform duration-200">+</span>
                  </summary>
                  <p className="text-[11px] text-gray-500 mt-2 leading-relaxed leading-normal">{faq.content}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. PRODUCT COMPARISON MODAL SLIDE-UP */}
      {isCompareOpen && (
        <div id="compare-modal-backdrop" className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-4xl w-full p-6 shadow-2xl relative border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in-95">
            <button 
              onClick={() => setIsCompareOpen(false)}
              className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full cursor-pointer text-gray-500"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-left mb-6">
              <h3 className="text-lg font-bold text-gray-950 dark:text-white">Active Product Comparison</h3>
              <p className="text-xs text-gray-500">Evaluating physical formulations, key attributes, and pricing brackets side-by-side.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-4">
              <div className="hidden md:flex flex-col justify-end text-xs font-bold text-gray-400 space-y-6 pb-4 border-r pr-4">
                <div>Retail Cost</div>
                <div>Category Range</div>
                <div>Moisture rating</div>
                <div>Active Elements</div>
                <div>Key benefits</div>
              </div>

              {compareProducts.map((p) => (
                <div key={p.id} className="bg-gray-50/40 dark:bg-gray-800/20 p-4 rounded-2xl border border-gray-100 text-left relative">
                  <button 
                    onClick={() => setCompareProducts(prev => prev.filter(cp => cp.id !== p.id))}
                    className="absolute top-2 right-2 text-rose-500 hover:scale-105 text-[10px] font-bold"
                  >
                    Remove
                  </button>
                  <div className="h-16 w-16 bg-white overflow-hidden rounded-lg mx-auto mb-3 border">
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <h4 className="font-bold text-xs truncate text-center">{p.name}</h4>
                  
                  <div className="md:hidden text-[10px] uppercase font-bold text-gray-300 tracking-wider text-center mt-2 border-b">Spec List</div>
                  
                  <div className="space-y-4 md:space-y-6 text-xs text-gray-700 dark:text-gray-300 mt-4">
                    <div className="flex justify-between md:block">
                      <span className="md:hidden font-bold text-gray-400">Cost: </span>
                      <span className="font-extrabold text-emerald-800">KES {p.price}</span>
                    </div>
                    <div className="flex justify-between md:block">
                      <span className="md:hidden font-bold text-gray-400">Category: </span>
                      <span className="capitalize">{p.category}</span>
                    </div>
                    <div className="flex justify-between md:block">
                      <span className="md:hidden font-bold text-gray-400">Moisture: </span>
                      <span>⭐ {p.rating} / 5</span>
                    </div>
                    <div className="flex justify-between md:block">
                      <span className="md:hidden font-bold text-gray-400">Elements: </span>
                      <span className="truncate block line-clamp-1">{p.features?.[0] || "Aloe Vera extract"}</span>
                    </div>
                    <div className="flex justify-between md:block">
                      <span className="md:hidden font-bold text-gray-400">Benefits: </span>
                      <span className="text-[11px] line-clamp-2 md:line-clamp-none">{p.features?.[1] || "Natural conditioning"}</span>
                    </div>
                  </div>
                </div>
              ))}

              {compareProducts.length < 3 && (
                <div className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-6 min-h-[250px]">
                  <Layers className="w-8 h-8 text-gray-300" />
                  <p className="text-xs text-gray-400 mt-2 text-center">Add another product from the list to populate comparison specs.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. PRODUCT DETAIL BACKDROP POPUP */}
      {selectedProduct && (
        <div id="product-detail-backdrop" className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in-95 text-left">
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full cursor-pointer text-gray-500"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mt-4">
              <div className="space-y-4">
                <div className="h-52 md:h-64 rounded-2xl overflow-hidden shadow-md bg-emerald-950/20 mb-2">
                  <img src={selectedProduct.mediaUrls && selectedProduct.mediaUrls.length > 0 ? selectedProduct.mediaUrls[0] : selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover" />
                </div>
                {selectedProduct.mediaUrls && selectedProduct.mediaUrls.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {selectedProduct.mediaUrls.map((url, idx) => (
                      <div key={idx} className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                        <img src={url} alt={`${selectedProduct.name} ${idx}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-1">
                  {selectedProduct.features?.map((fit, idx) => (
                    <span key={idx} className="bg-emerald-50 dark:bg-emerald-950/40 text-[10px] font-medium text-emerald-800 dark:text-emerald-400 px-2 py-1 rounded">
                      ✓ {fit}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-lime-600 uppercase tracking-widest">{selectedProduct.subCategory}</span>
                  <h3 className="text-xl font-bold leading-tight">{selectedProduct.name}</h3>
                  <div className="flex items-center gap-1.5 pt-1">
                    <Stars rating={selectedProduct.rating} />
                    <span className="text-xs text-gray-400">({selectedProduct.reviewsCount} verified reviews)</span>
                  </div>
                </div>

                <div className="text-lg font-extrabold text-emerald-800">KES {selectedProduct.price}</div>
                
                <p className="text-xs text-gray-500 leading-relaxed leading-normal">{selectedProduct.description}</p>
                
                {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Available size configs</span>
                    <div className="flex gap-2">
                      {selectedProduct.variants.map((v) => (
                        <span key={v} className="border border-emerald-900/30 text-xs px-2.5 py-1 rounded-lg bg-emerald-50/20 text-emerald-900">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProduct.specifications && selectedProduct.specifications.length > 0 && (
                  <div className="space-y-1.5 mt-4">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Specifications</span>
                    <ul className="text-xs text-gray-600 list-disc pl-4 space-y-1">
                      {selectedProduct.specifications.map((spec, idx) => (
                        <li key={idx}>{spec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-4 border-t flex items-center gap-3">
                  <button
                    onClick={() => {
                      addToCart(selectedProduct);
                      setSelectedProduct(null);
                    }}
                    disabled={selectedProduct.stock === 0}
                    className="flex-1 bg-emerald-800 text-white font-bold p-3 rounded-xl hover:bg-emerald-700 text-xs shadow flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <ShoppingCart className="w-4 h-4" /> Add To Shopping Basket
                  </button>
                </div>
              </div>
            </div>

            {/* Injected Customer reviews inside detail panel */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h4 className="text-xs font-bold uppercase text-gray-400 mb-3">Live Feedbacks ({selectedProduct.reviews.length})</h4>
              {selectedProduct.reviews.length === 0 ? (
                <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl text-xs text-gray-500 border border-dashed">
                  <Info className="w-4 h-4 text-emerald-700" />
                  <span>
                    No reviews logged yet. Accents for this batch: <strong>"{CUSTOMER_RATING_ACCENTS[Math.floor(Math.random() * CUSTOMER_RATING_ACCENTS.length)]}"</strong>.
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedProduct.reviews.map((rev) => (
                    <div key={rev.id} className="bg-zinc-50/50 p-3 rounded-xl border border-zinc-100/60 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{rev.author}</span>
                        <span className="text-[10px] text-gray-400">{rev.date}</span>
                      </div>
                      <div className="flex text-amber-500"><Stars rating={rev.rating} /></div>
                      <p className="text-gray-500 leading-relaxed italic">"{rev.comment}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. EVENT BOOKING REGISTRATION FORM POPUP */}
      {regEventId && (
        <div id="event-reg-backdrop" className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in-95 text-left">
            <button 
              onClick={() => setRegEventId(null)}
              className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full cursor-pointer text-gray-500"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-bold text-base text-gray-950 dark:text-white">Secure Event Reservation</h3>
            <p className="text-xs text-gray-500 mt-1">Please fill in details to confirm attendance. We will dispatch an SMS code instantly.</p>

            <form onSubmit={(e) => handleRegister(e, regEventId)} className="space-y-4 mt-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Amani Wanjiku" 
                  className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-700" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="amani.wanjiku@gmail.com" 
                  className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-700" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400">Kenya Safaricom Phone Number</label>
                <input 
                  type="text" 
                  required
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="e.g. +254 711 223344" 
                  className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-700" 
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold p-3 rounded-xl transition cursor-pointer text-xs uppercase tracking-wide shadow"
              >
                Confirm Spot Invitation
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 7. SHOPPING BASKET / CART SLIDE-OUT PANEL */}
      {isCartOpen && (
        <div id="cart-sidebar-backdrop" className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex justify-end">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md h-full shadow-2xl flex flex-col justify-between p-6 animate-in slide-in-from-right duration-250 relative">
            <button 
              onClick={() => setIsCartOpen(false)}
              className="absolute top-4 left-4 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full cursor-pointer text-gray-500"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex-1 overflow-y-auto text-left pt-10">
              <div className="flex items-center justify-between pb-4 border-b">
                <h3 className="text-md font-extrabold text-gray-950 dark:text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-800" /> Shopping Basket
                </h3>
                <span className="text-xs bg-emerald-50 text-emerald-900 border font-bold px-2 py-0.5 rounded-full">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} units
                </span>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-20">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto" />
                  <h4 className="font-bold text-sm text-gray-700 mt-2">Your basket is empty</h4>
                  <p className="text-xs text-gray-500 mt-1">Add items from our premium range to start.</p>
                </div>
              ) : (
                <div className="space-y-4 mt-6">
                  {cart.map((item) => (
                    <div key={`${item.product.id}-${item.selectedVariant}`} className="flex items-center gap-3 bg-zinc-50/50 p-3 rounded-xl border border-zinc-100/60">
                      <div className="h-12 w-12 bg-white rounded-lg overflow-hidden border">
                        <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs truncate text-gray-900 dark:text-white">{item.product.name}</h4>
                        {item.selectedVariant && (
                          <span className="text-[10px] text-gray-400 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                            {item.selectedVariant}
                          </span>
                        )}
                        <div className="text-xs font-semibold text-emerald-800 mt-1">KES {item.product.price * item.quantity}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button 
                          onClick={() => removeFromCart(item.product.id, item.selectedVariant)}
                          className="p-1 hover:bg-red-50 text-red-500 rounded cursor-pointer transition"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2 bg-white border rounded bg-transparent">
                          <button 
                            onClick={() => updateCartQuantity(item.product.id, item.selectedVariant, -1)}
                            className="p-1 hover:bg-gray-50 text-gray-500 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateCartQuantity(item.product.id, item.selectedVariant, 1)}
                            className="p-1 hover:bg-gray-50 text-gray-500 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Loyalty and Summary checkout footer */}
            {cart.length > 0 && (
              <div className="border-t pt-4 space-y-4 text-left">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Retail Subtotal</span>
                    <span className="font-bold">KES {subtotal}</span>
                  </div>
                  {activePromo && (
                    <div className="flex justify-between text-xs text-emerald-600 font-bold">
                      <span>Discount ({activePromo.discountPercent}%)</span>
                      <span>-KES {promoDiscount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Nairobi Delivery</span>
                    <span>KES {deliveryFee}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold pb-2 border-b">
                    <span>Est. Total</span>
                    <span>KES {subtotal - promoDiscount + deliveryFee}</span>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                    setCheckoutStep(1);
                  }}
                  className="w-full bg-emerald-800 hover:bg-emerald-800 text-white font-bold p-3.5 rounded-xl transition cursor-pointer text-xs uppercase tracking-wide shadow flex items-center justify-center gap-1.5"
                >
                  Proceed to Secure Checkout <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. DARAJA M-PESA POPUP & MULTISTEP CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div id="checkout-modal-backdrop" className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-3xl w-full p-6 shadow-2xl relative border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in-95 text-left grid grid-cols-1 md:grid-cols-12 gap-6">
            <button 
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full cursor-pointer text-gray-500 z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Left side: Form inputs based on current step */}
            <div className="md:col-span-7 space-y-4 pt-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs bg-emerald-900 text-lime-400 font-bold px-2 py-0.5 rounded-full">
                  Step {checkoutStep}/2
                </span>
                <h3 className="text-md font-bold text-gray-950 dark:text-white">ALOEFLORA PRODUCTS Multi-Step Checkout</h3>
              </div>

              {checkoutStep === 1 ? (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <p className="text-xs text-gray-500">Please provide standard user credentials so we can confirm delivery and loyalty points.</p>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Full Customer Name</label>
                    <input 
                      type="text" 
                      value={checkoutName}
                      onChange={(e) => setCheckoutName(e.target.value)}
                      placeholder="e.g. Amani Wanjiku" 
                      className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-700" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Email Address (Invoices)</label>
                    <input 
                      type="email" 
                      value={checkoutEmail}
                      onChange={(e) => setCheckoutEmail(e.target.value)}
                      placeholder="amani@gmail.com" 
                      className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-700" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Phone for Lipa na M-Pesa STK push</label>
                    <input 
                      type="text" 
                      value={checkoutPhone}
                      onChange={(e) => setCheckoutPhone(e.target.value)}
                      placeholder="e.g. 254702283637" 
                      className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-700" 
                    />
                    <span className="text-[10px] text-gray-400 italic block mt-0.5">Format MUST follow 2547XXXXXXXX to align with Daraja APIs.</span>
                  </div>

                  <button 
                    onClick={() => {
                      if (!checkoutName || !checkoutEmail || !checkoutPhone) {
                        toast.error("Please fill in all personal credentials!");
                        return;
                      }
                      setCheckoutStep(2);
                    }}
                    className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold p-3 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer shadow mt-4"
                  >
                    Select Delivery Zone <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 animate-in fade-in duration-200">
                  <p className="text-xs text-gray-500">Zones outside Nairobi CBD incur KES 250 fee, or FREE on baskets exceeding KES 3,000.</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-gray-400">County</label>
                      <select 
                        value={checkoutCounty}
                        onChange={(e) => setCheckoutCounty(e.target.value)}
                        className="w-full text-xs p-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-emerald-700"
                      >
                        <option value="Nairobi">Nairobi</option>
                        <option value="Kiambu">Kiambu</option>
                        <option value="Mombasa">Mombasa</option>
                        <option value="Nakuru">Nakuru</option>
                        <option value="Kisumu">Kisumu</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-gray-400">Sub County</label>
                      <select 
                        value={checkoutSubCounty}
                        onChange={(e) => setCheckoutSubCounty(e.target.value)}
                        className="w-full text-xs p-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-emerald-700"
                      >
                        <option value="Westlands">Westlands</option>
                        <option value="Starehe (CBD)">Starehe (CBD)</option>
                        <option value="Langata">Langata</option>
                        <option value="Kasarani">Kasarani</option>
                        <option value="Dagoretti">Dagoretti</option>
                        <option value="Embakaasi">Embakaasi</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-gray-400">Estate / Road Name</label>
                      <input 
                        type="text" 
                        required
                        value={checkoutEstate}
                        onChange={(e) => setCheckoutEstate(e.target.value)}
                        placeholder="e.g. Kitisuru Lane" 
                        className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none" 
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-gray-400">Building Name</label>
                      <input 
                        type="text" 
                        value={checkoutBuilding}
                        onChange={(e) => setCheckoutBuilding(e.target.value)}
                        placeholder="e.g. Trust Heights (Optional)" 
                        className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1 space-y-1">
                      <label className="text-[10px] uppercase font-bold text-gray-400">House / Room</label>
                      <input 
                        type="text" 
                        value={checkoutHouseNum}
                        onChange={(e) => setCheckoutHouseNum(e.target.value)}
                        placeholder="e.g. Apt A4" 
                        className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none" 
                      />
                    </div>

                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] uppercase font-bold text-gray-400">Delivery Notes</label>
                      <input 
                        type="text" 
                        value={checkoutNotes}
                        onChange={(e) => setCheckoutNotes(e.target.value)}
                        placeholder="e.g. Ring bell at main iron gate" 
                        className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none" 
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-start gap-2 cursor-pointer p-3 bg-gray-50 border border-gray-100 rounded-xl mb-4 text-xs">
                      <input 
                        type="checkbox" 
                        required
                        className="mt-0.5" 
                        checked={checkoutConsent}
                        onChange={(e) => setCheckoutConsent(e.target.checked)}
                      />
                      <span className="text-gray-600">
                        I confirm that my billing details are correct, and I explicitly agree to the ALOEFLORA PRODUCTS 
                        <span className="font-bold text-emerald-800"> Privacy Policy</span> and 
                        <span className="font-bold text-emerald-800"> Terms of Service</span>.
                      </span>
                    </label>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => setCheckoutStep(1)}
                        className="border border-gray-200 hover:bg-gray-50 p-3 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Back
                      </button>
                      <button 
                        onClick={handleInitiateSTK}
                        disabled={!checkoutConsent}
                        className={`flex-1 font-bold p-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition ${
                          checkoutConsent ? 'bg-emerald-800 hover:bg-emerald-700 text-white cursor-pointer' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Make Payment
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right side: Shopping Basket billing ledger review */}
            <div className="md:col-span-5 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border flex flex-col justify-between pt-6">
              <div>
                <h4 className="text-xs font-extrabold uppercase text-gray-400 pb-3 border-b">Billing Manifest</h4>
                
                <div className="space-y-3 mt-4 overflow-y-auto max-h-48 pr-1">
                  {cart.map((item) => (
                    <div key={`${item.product.id}-${item.selectedVariant}`} className="flex justify-between items-start text-xs text-gray-600 dark:text-gray-400">
                      <div className="truncate pr-2">
                        <span className="font-bold text-gray-800 dark:text-white mr-1">{item.quantity}x</span>
                        <span>{item.product.name}</span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">KES {item.product.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-dashed mt-6 space-y-2 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Cart Subtotal</span>
                  <span className="font-bold text-gray-900 dark:text-white">KES {subtotal}</span>
                </div>
                {activePromo && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount ({activePromo.discountPercent}%)</span>
                    <span>-KES {promoDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-500">
                  <span>Delivery fee</span>
                  <span className="font-bold text-gray-900 dark:text-white">KES {deliveryFee}</span>
                </div>
                {checkoutCounty === "Nairobi" && isCbd && (
                  <div className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-center">
                    CBD Starehe Free Delivery Applied!
                  </div>
                )}
                {checkoutCounty === "Nairobi" && !isCbd && subtotal >= 3000 && (
                  <div className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-center">
                    Subtotal exceeds KES 3,000! Standard Delivery Free!
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-gray-950 dark:text-white pt-2 border-t">
                  <span>Total Payable</span>
                  <span>KES {total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. LIPANAM-PESA STK DIALOG SIMULATION (Safaricom visual mockup) */}
      {isSTKSimulating && (
        <div id="mpesa-simulation-backdrop" className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-gradient-to-b from-gray-900 to-black text-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative border border-gray-800 overflow-hidden animate-in fade-in zoom-in-95 text-center">
            
            {/* Dark green Safaricom header bar */}
            <div className="bg-emerald-600 h-1 absolute top-0 left-0 right-0"></div>
            
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-emerald-600/10 text-emerald-500 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-widest flex items-center gap-1.5 border border-emerald-500/20">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Safaricom Daraja v2.0
              </div>

              {stkStatus === "waiting_pin" && (
                <div className="space-y-4 w-full">
                  <div className="space-y-1">
                    <h4 className="font-bold text-md text-emerald-400">Lipa Na M-Pesa STK Push</h4>
                    <p className="text-xs text-gray-400">Simulating push triggered to standard client numbers: {checkoutPhone}</p>
                  </div>

                  {/* Micro phone interface mockup */}
                  <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 text-left space-y-3 font-mono text-xs">
                    <div className="text-gray-400 border-b border-gray-800 pb-2">STK Push Message Dialog:</div>
                    <div className="text-emerald-400 font-bold">Pay Bill: 174379 (ALOEFLORA PRODUCTS)</div>
                    <div>Account No: ORD-{generatedOrderId || "9281"}</div>
                    <div>Amount: KES {total}</div>
                    <div className="text-gray-400">Enter Your 4-Digit M-Pesa Secret PIN:</div>
                    
                    {/* Dots indicator */}
                    <div className="flex justify-center gap-3 py-2">
                      {Array.from({ length: 4 }).map((_, idx) => (
                        <div 
                          key={idx} 
                          className={`w-3.5 h-3.5 rounded-full border border-gray-700 ${
                            mpesaPinInput.length > idx ? "bg-emerald-500 shadow-emerald-500/30 shadow" : "bg-gray-900"
                          }`}
                        ></div>
                      ))}
                    </div>
                  </div>

                  {/* Form Submission numeric buttons pad */}
                  <form onSubmit={submitStkPush} className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-sm font-bold">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "Submit"].map((btn) => (
                        <button
                          key={btn}
                          type="button"
                          onClick={() => {
                            if (btn === "C") {
                              setMpesaPinInput("");
                            } else if (btn === "Submit") {
                              if (mpesaPinInput.length === 4) {
                                submitStkPush({ preventDefault: () => {} } as any);
                              }
                            } else {
                              if (mpesaPinInput.length < 4) {
                                setMpesaPinInput(prev => prev + btn);
                              }
                            }
                          }}
                          className={`p-3 rounded-xl bg-gray-950 hover:bg-gray-800 select-none cursor-pointer transition border border-gray-800 active:bg-gray-800 ${
                            btn === "Submit" ? "text-emerald-400 col-span-1" : ""
                          }`}
                        >
                          {btn}
                        </button>
                      ))}
                    </div>
                  </form>
                </div>
              )}

              {stkStatus === "verifying" && (
                <div className="py-8 space-y-4">
                  <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto" />
                  <div>
                    <h4 className="font-bold text-emerald-400">Safaricom Callback Processing</h4>
                    <p className="text-xs text-gray-400 mt-1">Interrogating Daraja Webhooks queue to confirm customer's payment balance ledger...</p>
                  </div>
                </div>
              )}

              {stkStatus === "success" && (
                <div className="py-6 space-y-4 w-full text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
                    <Check className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-emerald-400">KES {total} Paid Successfully</h4>
                    <p className="text-xs text-gray-400">Safaricom Receipt Ref: QFF{Math.random().toString(36).substring(2, 8).toUpperCase()}</p>
                    <p className="text-[10px] text-gray-500 px-4 mt-2">ALOEFLORA PRODUCTS Nairobi accounts sync cleared. Your order is registered in our dashboard.</p>
                  </div>

                  {!user && !registrationSuccess && (
                    <div className="mt-4 p-4 bg-emerald-950/40 rounded-xl border border-emerald-500/20 text-left">
                      <h4 className="text-emerald-400 font-bold mb-1 text-sm">Save your details for next time!</h4>
                      <p className="text-xs text-gray-400 mb-3 leading-relaxed">Create a secure account with your email <strong>{checkoutEmail}</strong> to easily track your orders and earn exclusive flora loyalty points.</p>
                      
                      <div className="flex items-center gap-2">
                        <input 
                          type="password"
                          value={guestPassword}
                          onChange={(e) => setGuestPassword(e.target.value)}
                          placeholder="Set a password..."
                          className="flex-1 bg-gray-900 border border-gray-700 text-white rounded-lg p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                        />
                        <button 
                          onClick={async () => {
                            if(!guestPassword) return toast.error("Please enter a password.");
                            setIsRegistering(true);
                            const { error } = await supabase.auth.signUp({ 
                              email: checkoutEmail, 
                              password: guestPassword,
                              options: {
                                emailRedirectTo: `${window.location.origin}/customer/dashboard`,
                              }
                            });
                            setIsRegistering(false);
                            if(error) toast.error(error.message);
                            else setRegistrationSuccess(true);
                          }}
                          disabled={isRegistering}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-2.5 rounded-lg text-xs transition disabled:opacity-50"
                        >
                          {isRegistering ? "Saving..." : "Create Account"}
                        </button>
                      </div>
                    </div>
                  )}

                  {(!user && registrationSuccess) && (
                    <div className="mt-4 p-3 bg-emerald-900/40 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-bold">
                      Account successfully created! You are now logged in.
                    </div>
                  )}

                  <button 
                    onClick={() => {
                      setIsSTKSimulating(false);
                      setIsCheckoutOpen(false);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs p-3 rounded-xl w-full cursor-pointer transition mt-4"
                  >
                    Return to ALOEFLORA PRODUCTS Store
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 10. LOYALTY PORTAL SLIDE PANEL */}
      {isWishlistOpen && (
        <div id="wishlist-sidebar-backdrop" className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex justify-end">
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm h-full shadow-2xl flex flex-col justify-between p-6 animate-in slide-in-from-right duration-250 relative">
            <button 
              onClick={() => setIsWishlistOpen(false)}
              className="absolute top-4 left-4 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full cursor-pointer text-gray-500"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex-1 overflow-y-auto text-left pt-10">
              <h3 className="text-md font-extrabold pb-3 border-b text-gray-950 dark:text-white flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" /> Saved Favourites
              </h3>
              
              {wishlist.length === 0 ? (
                <div className="text-center py-20">
                  <Heart className="w-12 h-12 text-gray-300 mx-auto" />
                  <p className="text-xs text-gray-400 mt-2">Your wishlist is currently empty.</p>
                </div>
              ) : (
                <div className="space-y-4 mt-6">
                  {wishlist.map((id) => {
                    const matched = products.find((p) => p.id === id);
                    if (!matched) return null;
                    return (
                      <div key={id} className="flex gap-3 bg-zinc-50/50 p-2.5 rounded-xl border">
                        <div className="h-10 w-10 bg-white rounded overflow-hidden shadow-sm">
                          <img src={matched.imageUrl} alt={matched.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs truncate">{matched.name}</h4>
                          <span className="text-xs font-semibold text-emerald-800">KES {matched.price}</span>
                        </div>
                        <button 
                          onClick={() => {
                            addToCart(matched);
                            toggleWishlist(matched.id);
                          }}
                          className="bg-emerald-800 p-1.5 rounded text-white self-center cursor-pointer hover:bg-emerald-800"
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
      )}

      {/* 11. DOCK FLOATING WIDGETS: Chat & Cart */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-4">
        {/* Floating Cart Button */}
        {cart.length > 0 && (
          <button 
            onClick={() => setIsCartOpen(true)}
            className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-emerald-800 dark:text-lime-400 rounded-full p-4 shadow-2xl hover:scale-105 active:scale-95 transition cursor-pointer relative border border-gray-200 dark:border-gray-800 flex items-center justify-center"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 min-w-[24px] h-6 px-1 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white dark:border-gray-900">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </button>
        )}

        {/* Floating Chat Button */}
        <button 
          onClick={() => setOpenAiAssistant((prev) => !prev)}
          className="bg-emerald-800 hover:bg-emerald-700 text-white rounded-full p-4 shadow-2xl hover:scale-105 active:scale-95 transition cursor-pointer relative border border-emerald-800 flex items-center justify-center"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="absolute top-0 right-0 w-3 h-3 bg-lime-400 rounded-full border-2 border-emerald-950"></span>
        </button>

        {openAiAssistant && (
          <div id="ai-specialist-terminal" className="absolute bottom-16 right-0 bg-white dark:bg-gray-900 w-80 md:w-96 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden text-left flex flex-col h-[450px] animate-in fade-in slide-in-from-bottom duration-200">
            {/* Header branding */}
            <div className="bg-emerald-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-lime-500/10 p-2 rounded-xl text-lime-400 font-bold border border-emerald-800/80">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-normal">ALOEFLORA PRODUCTS AI Expert</h4>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-pulse"></span>
                    <span className="text-[9px] text-emerald-300">Grounded in Raw Flora Formulas</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setOpenAiAssistant(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat History screen */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-zinc-55/30">
              {aiChatHistory.map((message, index) => (
                <div 
                  key={index} 
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div 
                    className={`max-w-[85%] text-xs p-3 rounded-2xl leading-relaxed ${
                      message.role === "user" 
                        ? "bg-emerald-800 text-white rounded-tr-none" 
                        : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 rounded-tl-none border border-gray-100 dark:border-gray-700"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
              {isAiLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-500 max-w-[85%] text-xs p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Gathering green botanical analysis...
                  </div>
                </div>
              )}
            </div>

            {/* Form Input fields */}
            <form onSubmit={handleAiConsultation} className="p-3 border-t flex gap-2 bg-white">
              <input 
                type="text"
                value={customerQuery}
                onChange={(e) => setCustomerQuery(e.target.value)}
                placeholder="Ask me about dry curl care or acne soaps..."
                className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-700"
              />
              <button 
                type="submit"
                className="bg-emerald-800 text-white p-2.5 rounded-xl hover:bg-emerald-700 shadow flex items-center justify-center cursor-pointer transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// Subordinate rating stars vector auxiliary
function Stars({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <div className="flex text-amber-500 gap-0.5 select-none">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className="text-xs">
          {i < rounded ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
}
