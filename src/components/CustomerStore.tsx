import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  Trash2,
  LayoutGrid,
  List as ListIcon
} from "lucide-react";
import { Product, CartItem, Order, BookingEvent, CMSPost, Promo } from "../types";

import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-hot-toast";

const CUSTOMER_RATING_ACCENTS = ["Amazing!", "Loved it.", "Smells great.", "Good texture.", "Highly recommended!", "Will buy again."];

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
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
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

  // Product display config
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [visibleCount, setVisibleCount] = useState<number>(12);
  const navigate = useNavigate();
  
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
  const [eventsData, setEventsData] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('events').select('*, event_registrations(role)').then(({data}) => setEventsData(data || []));
  }, []);

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
  const [aiChatHistory, setAiChatHistory] = useState<{ role: string; text: string }[]>(() => {
    const saved = localStorage.getItem("aloeflora_ai_chat");
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      { role: "assistant", text: "Habari! I am ALOEFLORA PRODUCTS's AI Specialist from Nairobi. How can I assist you with your hair, body, or home care goals today? I can suggest products tailored precisely for curl moisture or skin repair." }
    ];
  });
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [openAiAssistant, setOpenAiAssistant] = useState<boolean>(false);

  // Event Registration Panel
  const [regEventId, setRegEventId] = useState<string | null>(null);
  const [regName, setRegName] = useState<string>("");
  const [regEmail, setRegEmail] = useState<string>("");
  const [regPhone, setRegPhone] = useState<string>("");
  const [regRole, setRegRole] = useState<"attendee" | "vendor">("attendee");
  const [regQuantity, setRegQuantity] = useState<number>(1);
  const [regStep, setRegStep] = useState<1 | 2>(1);
  const [paymentContext, setPaymentContext] = useState<"order" | "event">("order");
  const [pendingEventRegId, setPendingEventRegId] = useState<string | null>(null);
  const [pendingEventPrice, setPendingEventPrice] = useState<number>(0);

  // Fetch user profile on login
  useEffect(() => {
    if (user) {
      const loadProfile = async () => {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
          if (data.wishlist && data.wishlist.length > 0) {
            setWishlist(prev => Array.from(new Set([...prev, ...data.wishlist])));
          }
          if (data.cart && data.cart.length > 0) {
            setCart(prev => {
              const newCart = [...prev];
              data.cart.forEach((remoteItem: CartItem) => {
                const existing = newCart.find(localItem => 
                  localItem.product.id === remoteItem.product.id && 
                  localItem.selectedVariant === remoteItem.selectedVariant
                );
                if (!existing) {
                  newCart.push(remoteItem);
                } else {
                  existing.quantity = Math.max(existing.quantity, remoteItem.quantity);
                }
              });
              return newCart;
            });
          }
          if (data.loyalty_points) setLoyaltyPoints(data.loyalty_points);
          if (data.ai_chat_history && data.ai_chat_history.length > 1) {
            setAiChatHistory(prev => prev.length > 1 ? prev : data.ai_chat_history);
          }
        }
        setIsProfileLoaded(true);
      };
      loadProfile();
    } else {
      setIsProfileLoaded(false);
    }
  }, [user]);

  // Save Cart to localstorage & Supabase
  useEffect(() => {
    localStorage.setItem("aloeflora_cart", JSON.stringify(cart));
    if (user && isProfileLoaded) {
      supabase.from('profiles').update({ cart }).eq('id', user.id).then();
    }
  }, [cart, user, isProfileLoaded]);

  // Save Wishlist
  useEffect(() => {
    localStorage.setItem("aloeflora_wishlist", JSON.stringify(wishlist));
    if (user && isProfileLoaded) {
      supabase.from('profiles').update({ wishlist }).eq('id', user.id).then();
      supabase.auth.updateUser({ data: { wishlist } });
    }
  }, [wishlist, user, isProfileLoaded]);

  // Save loyalty points
  useEffect(() => {
    if (user && loyaltyPoints > 0 && isProfileLoaded) {
       supabase.from('profiles').update({ loyalty_points: loyaltyPoints }).eq('id', user.id).then();
    }
  }, [loyaltyPoints, user, isProfileLoaded]);

  // Save AI Chat History
  useEffect(() => {
    localStorage.setItem("aloeflora_ai_chat", JSON.stringify(aiChatHistory));
    if (user && isProfileLoaded) {
      supabase.from('profiles').update({ ai_chat_history: aiChatHistory }).eq('id', user.id).then();
    }
  }, [aiChatHistory, user, isProfileLoaded]);

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
          catalog: products.map((p) => ({ name: p.name, category: p.category, desc: p.description, price: p.price })),
          faqs: cmsPosts.filter(p => p.type === "faq").map(p => ({ question: p.title, answer: p.content }))
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
      if (paymentContext === "event") {
        const ticketId = "TKT-" + Math.floor(100000 + Math.random() * 900000);
        setGeneratedOrderId(ticketId); // reuse for display
        const mpesaRef = "QFF" + Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const { error } = await supabase.from('event_registrations').insert({
          event_id: pendingEventRegId,
          role: regRole,
          name: regName,
          email: regEmail,
          phone: regPhone,
          payment_status: "paid",
          amount_paid: pendingEventPrice,
          ticket_number: ticketId,
          mpesa_receipt: mpesaRef,
          quantity: regQuantity,
          total_cost: pendingEventPrice
        });
        
        if (error) throw error;
        
        // Send Email Confirmation
        const evTitle = cmsPosts.find(p => p.id === pendingEventRegId)?.title || 'ALOEFLORA Event';
        fetch('/api/email/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: regEmail, name: regName, role: regRole, eventTitle: evTitle, ticketNumber: ticketId, paymentStatus: "Paid", amount: pendingEventPrice })
        }).catch(err => console.error("Email send error", err));
        
        setTimeout(() => {
          setStkStatus("success");
          toast.success(`Payment confirmed! Your ticket is ${ticketId}. Email sent.`);
          // onRegisterEvent removed: handled by supabase
          setRegEventId(null);
          setRegName("");
          setRegEmail("");
          setRegPhone("");
        }, 3000);
        return;
      }

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
    setPaymentContext("order");
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
      // Check for duplicate registration
      const { data: existingReg, error: existingErr } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('event_id', eventId)
        .eq('email', regEmail)
        .limit(1);

      if (existingReg && existingReg.length > 0) {
        const wantsMultiple = window.confirm("You have already registered for this event with this email. Do you want to register again to buy an additional ticket?");
        if (!wantsMultiple) {
          return;
        }
      }

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
            price: 0,
            vendor_enabled: true,
            vendor_price: 2000,
            vendor_capacity: 10,
            attendee_enabled: true,
            attendee_price: 0,
            status: 'upcoming'
         };
         const { error: insError } = await supabase.from('events').insert(newEvt);
         if (insError) {
             console.error("Failed to create event fallback:", insError);
             toast.error("Error setting up event registration record.");
             return;
         }
         evtData = newEvt;
      }
      
      const { count: currentVendors } = await supabase.from('event_registrations').select('*', { count: 'exact', head: true }).eq('event_id', eventId).eq('role', 'vendor');
      const { count: currentAttendees } = await supabase.from('event_registrations').select('*', { count: 'exact', head: true }).eq('event_id', eventId).eq('role', 'attendee');
      
      if (regRole === 'vendor') {
        if (evtData.vendor_enabled === false) {
          toast.error("Vendor registration is not enabled for this event."); return;
        }
        if ((currentVendors || 0) >= (evtData.vendor_capacity || 10)) {
          toast.error("Sorry, vendor slots are fully booked."); return;
        }
      } else {
        if (evtData.attendee_enabled === false) {
          toast.error("Attendee registration is not enabled for this event."); return;
        }
        if ((currentAttendees || 0) >= (evtData.capacity || 50)) {
          toast.error("Sorry, attendee tickets are sold out."); return;
        }
      }
      
      const unitPrice = regRole === 'vendor' ? (Number(evtData.vendor_price) || 0) : (Number(evtData.price) || 0);
      const price = unitPrice * regQuantity;
      
      if (price > 0) {
        setPendingEventRegId(eventId);
        setPendingEventPrice(price);
        setPaymentContext("event");
        setStkStatus("waiting_pin");
        setIsSTKSimulating(true);
      } else {
        const { error: insErr } = await supabase.from('event_registrations').insert({
            event_id: eventId,
            role: regRole,
            name: regName,
            email: regEmail,
            phone: regPhone,
            payment_status: "free",
            quantity: regQuantity,
            total_cost: 0
        });
        
        if (insErr) throw insErr;
        
        fetch('/api/email/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: regEmail, name: regName, role: regRole, eventTitle: post.title, paymentStatus: "Free" })
        }).catch(err => console.error("Email send error", err));

        // onRegisterEvent removed: handled by supabase
        toast.success(`Successfully registered ${regName} as ${regRole}! Email sent.`);
        setRegEventId(null);
        setRegName("");
        setRegEmail("");
        setRegPhone("");
        setRegQuantity(1);
        setRegStep(1);
      }
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
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest font-mono">OUR ORGANIC PRODUCTS</span>
            <h2 className="text-2xl font-semibold text-gray-950 dark:text-white">Active Product Catalog</h2>
          </div>

          {/* Search, Sort and Filters bars */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white rounded-xl focus:outline-none focus:border-emerald-700 w-48 md:w-60 transition-all"
              />
              {/* Auto-suggest dropdown */}
              {searchQuery.length > 1 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden hidden group-focus-within:block">
                  {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 4).map(suggest => (
                    <div 
                      key={suggest.id} 
                      onMouseDown={() => {
                        setSearchQuery(suggest.name);
                        navigate(`/product/${suggest.id}`);
                      }}
                      className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 cursor-pointer flex items-center justify-between"
                    >
                      <span className="font-semibold">{suggest.name}</span>
                      <span className="text-[10px] bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-500">{suggest.category}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden p-0.5">
              <button 
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition ${viewMode === "grid" ? "bg-white dark:bg-gray-700 shadow-sm text-emerald-700 dark:text-emerald-400" : "text-gray-400 hover:text-gray-600"}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition ${viewMode === "list" ? "bg-white dark:bg-gray-700 shadow-sm text-emerald-700 dark:text-emerald-400" : "text-gray-400 hover:text-gray-600"}`}
                title="List View"
              >
                <ListIcon className="w-4 h-4" />
              </button>
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
            { id: "home", label: "Home Care" },
            { id: "coffee", label: "Coffee" }
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
          <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6" : "flex flex-col gap-4"}>
            {filteredProducts.slice(0, visibleCount).map((p) => {
              const inWishlist = wishlist.includes(p.id);
              const isLowStock = p.stock <= p.safetyStock;
              const compareSelected = compareProducts.find((cp) => cp.id === p.id);

              return (
                <div 
                  key={p.id} 
                  className={`group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition duration-300 relative ${viewMode === 'grid' ? 'flex flex-col h-full' : 'flex flex-row items-center gap-6 h-auto'}`}
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
                    onClick={() => navigate(`/product/${p.id}`)}
                    className="aspect-[4/5] w-full rounded-xl overflow-hidden bg-gray-50 group-hover:scale-[1.02] cursor-pointer transition duration-300 mb-4 bg-emerald-950/20 flex items-center justify-center relative"
                  >
                    <img 
                      src={(p.mediaUrls && p.mediaUrls.length > 0) ? p.mediaUrls[0] : p.imageUrl?.split(',')[0]} 
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
                        onClick={() => navigate(`/product/${p.id}`)}
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
        
        {/* Load More Button */}
        {filteredProducts.length > visibleCount && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setVisibleCount(prev => prev + 12)}
              className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-full text-sm font-bold transition cursor-pointer"
            >
              Load More Products
            </button>
          </div>
        )}
      </section>

      {/* ABOUT US SECTION MOVED TO SEPARATE PAGE */}

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
              <span className="text-[10px] text-emerald-800 dark:text-emerald-400 uppercase font-bold tracking-widest">EVENTS & WELLNESS PROMOTION</span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">Kenyan Organic Expos & Farm Walks</h3>
            </div>
            <Calendar className="w-5 h-5 text-emerald-800" />
          </div>

          {(() => {
            const promotionalEvents = cmsPosts.filter(p => p.type === 'promotion');
            return (
              <div className={promotionalEvents.length === 1 ? "grid grid-cols-1 gap-6" : "grid grid-cols-1 md:grid-cols-2 gap-6"}>
                {promotionalEvents.map((evt) => (
                  <div key={evt.id} className={`bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm flex ${promotionalEvents.length === 1 ? 'flex-col md:flex-row' : 'flex-col'} justify-between`}>
                    <div className={promotionalEvents.length === 1 ? 'md:w-1/2 flex flex-col justify-between' : ''}>
                      <div className="aspect-video bg-emerald-950 overflow-hidden relative">
                        <img 
                          src={evt.imageUrl?.split(',')[0] || '/placeholder.png'} 
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
                    <div className={`p-4 ${promotionalEvents.length === 1 ? 'md:w-1/2 flex flex-col justify-center border-t md:border-l md:border-t-0' : 'pt-0 border-t'} border-gray-50 dark:border-gray-800/60 mt-2`}>
                      <div className="flex flex-col gap-1 mb-2">
                        {(() => {
                          const evState = eventsData.find(e => e.id === evt.id);
                          if (!evState) return null;
                          const aCount = evState.event_registrations?.filter((r: any) => r.role === 'attendee').length || 0;
                          const vCount = evState.event_registrations?.filter((r: any) => r.role === 'vendor').length || 0;
                          return (
                            <>
                              {evState.attendee_enabled && (
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-gray-500">Attendee: {evState.price > 0 ? `KES ${evState.price}` : 'Free'}</span>
                                    <span className="text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">{Math.max(0, evState.capacity - aCount)} slots left</span>
                                </div>
                              )}
                              {evState.vendor_enabled && (
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-gray-500">Vendor: {evState.vendor_price > 0 ? `KES ${evState.vendor_price}` : 'Free'}</span>
                                    <span className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded">{Math.max(0, (evState.vendor_capacity || 10) - vCount)} slots left</span>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                      <button 
                        onClick={() => {
                          setRegEventId(evt.id);
                          setRegStep(1);
                          setRegQuantity(1);
                        }}
                        className="w-full text-center text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg cursor-pointer p-2 transition shadow-sm"
                      >
                        View Registration Options
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* SCIENTIFIC BLOGS MOVED TO SEPARATE PAGE */}

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
                    <img src={(p.mediaUrls && p.mediaUrls.length > 0) ? p.mediaUrls[0] : p.imageUrl?.split(',')[0]} alt={p.name} className="w-full h-full object-cover" />
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

            <form onSubmit={(e) => {
              e.preventDefault();
              if (regStep === 1) {
                if (!regName || !regEmail || !regPhone) { toast.error("Fields cannot be empty!"); return; }
                setRegStep(2);
              } else {
                handleRegister(e, regEventId);
              }
            }} className="space-y-4 mt-4">
              {regStep === 1 ? (
                <>
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
                      placeholder="2547XXXXXXXX" 
                      className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-700" 
                    />
                  </div>

                  <div className="space-y-2 mt-2">
                    <label className="text-[10px] uppercase font-bold text-gray-400 block">Registration Type</label>
                    {(() => {
                      const evState = eventsData.find(e => e.id === regEventId);
                      return (
                        <div className="grid grid-cols-2 gap-3">
                          {(!evState || evState.attendee_enabled !== false) && (
                            <label className={`cursor-pointer border-2 rounded-2xl p-4 transition text-center flex flex-col items-center justify-center ${regRole === 'attendee' ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 shadow-sm' : 'border-gray-100 hover:border-gray-200 dark:border-gray-800'}`}>
                              <input type="radio" name="regRole" value="attendee" checked={regRole === 'attendee'} onChange={() => setRegRole('attendee')} className="hidden" />
                              <div className="font-bold text-sm text-gray-900 dark:text-white">Attendee</div>
                              <div className="text-[10px] text-emerald-600 font-bold mt-1 uppercase">{evState && evState.price > 0 ? `KES ${evState.price}` : 'Free Admission'}</div>
                            </label>
                          )}
                          {(!evState || evState.vendor_enabled !== false) && (
                            <label className={`cursor-pointer border-2 rounded-2xl p-4 transition text-center flex flex-col items-center justify-center ${regRole === 'vendor' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 shadow-sm' : 'border-gray-100 hover:border-gray-200 dark:border-gray-800'}`}>
                              <input type="radio" name="regRole" value="vendor" checked={regRole === 'vendor'} onChange={() => setRegRole('vendor')} className="hidden" />
                              <div className="font-bold text-sm text-gray-900 dark:text-white">Vendor</div>
                              <div className="text-[10px] text-amber-600 font-bold mt-1 uppercase">{evState && evState.vendor_price > 0 ? `KES ${evState.vendor_price}` : 'Free'}</div>
                            </label>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  
                  <div className="space-y-1 mt-2">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Quantity</label>
                    <input 
                      type="number" 
                      min="1"
                      max="10"
                      required
                      value={regQuantity}
                      onChange={(e) => setRegQuantity(parseInt(e.target.value) || 1)}
                      className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-700" 
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold p-3 rounded-xl transition cursor-pointer text-xs uppercase tracking-wide shadow mt-4"
                  >
                    Review Registration
                  </button>
                </>
              ) : (
                <>
                  {(() => {
                    const post = cmsPosts.find(p => p.id === regEventId);
                    const evState = eventsData.find(e => e.id === regEventId);
                    const price = regRole === 'vendor' ? (Number(evState?.vendor_price) || 0) : (Number(evState?.price) || 0);
                    const isFree = price === 0;
                    return (
                      <div className="space-y-3 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl text-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                          <span className="text-gray-500">Event</span>
                          <span className="font-bold text-right pl-2 truncate" title={post?.title}>{post?.title}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                          <span className="text-gray-500">Ticket Type</span>
                          <span className="font-bold capitalize">{regRole}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                          <span className="text-gray-500">Quantity</span>
                          <span className="font-bold">{regQuantity}</span>
                        </div>
                        <div className="flex justify-between pt-2 items-center">
                          <span className="text-gray-500 font-bold">Total Cost</span>
                          <span className="font-extrabold text-emerald-600 text-lg">{isFree ? 'FREE' : `KES ${price * regQuantity}`}</span>
                        </div>
                      </div>
                    );
                  })()}
                  <div className="flex gap-3 mt-4">
                    <button type="button" onClick={() => setRegStep(1)} className="w-1/3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold p-3 rounded-xl transition cursor-pointer text-xs uppercase tracking-wide shadow">
                      Back
                    </button>
                    {(() => {
                      const evState = eventsData.find(e => e.id === regEventId);
                      const price = regRole === 'vendor' ? (Number(evState?.vendor_price) || 0) : (Number(evState?.price) || 0);
                      return (
                        <button type="submit" className="w-2/3 bg-emerald-800 hover:bg-emerald-700 text-white font-bold p-3 rounded-xl transition cursor-pointer text-xs uppercase tracking-wide shadow">
                          {price === 0 ? "Confirm Registration" : "Proceed to Payment"}
                        </button>
                      );
                    })()}
                  </div>
                </>
              )}
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
                {/* Coupon Input UI */}
                <div className="space-y-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Promo Code"
                      value={referralCodeInput}
                      onChange={(e) => setReferralCodeInput(e.target.value)}
                      className="flex-1 text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-700 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white uppercase"
                    />
                    <button
                      onClick={applyReferral}
                      className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-lg transition cursor-pointer text-xs uppercase"
                    >
                      Apply
                    </button>
                  </div>
                  {referralMessage && (
                    <div className={`text-[10px] font-bold ${activePromo ? 'text-emerald-600' : 'text-red-500'}`}>
                      {referralMessage}
                    </div>
                  )}
                </div>

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
                    navigate('/checkout'); setIsCartOpen(false);
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
                      placeholder="e.g. 254116794448" 
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
                    <div>Account No: {paymentContext === "event" ? "" : "ORD-"}{generatedOrderId || "9281"}</div>
                    <div>Amount: KES {paymentContext === "event" ? pendingEventPrice : total}</div>
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
                    <h4 className="font-bold text-emerald-400">KES {paymentContext === "event" ? pendingEventPrice : total} Paid Successfully</h4>
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


