import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Heart, 
  MapPin, 
  CreditCard, 
  Star, 
  RefreshCcw, 
  Bell, 
  Settings, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  Gift,
  HeadphonesIcon,
  Calendar,
  MessageSquare,
  FileText,
  TrendingUp,
  Download,
  X,
  Sun,
  Moon,
  Menu,
  Search,
  LayoutGrid,
  List as ListIcon,
  ShoppingCart,
  Plus,
  ArrowRight,
  Store,
  Sparkles
} from "lucide-react";
import { exportToPDF, exportOrderInvoicePDF, exportLoyaltyStatementPDF } from "../utils/exportUtils";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useShop } from "../contexts/ShopContext";
import { toast } from "react-hot-toast";
import { Order, Product, BookingEvent, SupportTicket, CMSPost } from "../types";
import MediaUploader from "./MediaUploader";

interface UserDashboardProps {
  orders: Order[];
  products: Product[];
  events?: BookingEvent[];
  cmsPosts?: CMSPost[];
  onAddTicket?: (ticket: SupportTicket) => void;
  darkMode?: boolean;
  setDarkMode?: (val: boolean) => void;
}

export default function UserDashboard({ orders, products, events = [], cmsPosts = [], onAddTicket, darkMode, setDarkMode }: UserDashboardProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const shop = useShop();

  const cart = shop?.cart || [];
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const addToCart = shop?.addToCart || (() => {});
  const setIsCartOpen = shop?.setIsCartOpen || (() => {});
  const setIsWishlistOpen = shop?.setIsWishlistOpen || (() => {});

  const [activeTab, setActiveTab] = useState<"dashboard" | "store" | "orders" | "events" | "wishlist" | "profile" | "support">("dashboard");

  useEffect(() => {
    if (location.state && (location.state as any).tab) {
      setActiveTab((location.state as any).tab);
    }
  }, [location.state]);

  // Catalog State for Shop Tab
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [catalogSortBy, setCatalogSortBy] = useState("default");
  const [catalogViewMode, setCatalogViewMode] = useState<"grid" | "list">("grid");

  const getCategoryLabel = (cat: string) => {
    if (cat === "hair") return "Hair Care";
    if (cat === "body") return "Body Care";
    if (cat === "home") return "Home Care";
    if (cat === "coffee") return "Coffee";
    return cat.toUpperCase();
  };

  // Filtered Products for Catalog Tab
  const filteredCatalogProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(catalogSearch.toLowerCase()) || 
                          product.description.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                          product.category.toLowerCase().includes(catalogSearch.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (catalogSortBy === "price_asc") return a.price - b.price;
    if (catalogSortBy === "price_desc") return b.price - a.price;
    if (catalogSortBy === "rating") return (b.rating || 5) - (a.rating || 5);
    return 0;
  });

  const handleReorderOrder = (order: Order) => {
    order.items.forEach(item => {
      const fullProd = products.find(p => p.id === item.productId || p.name === item.productName);
      if (fullProd) {
        addToCart(fullProd, item.quantity, item.selectedVariant);
      } else {
        const fallbackProd: Product = {
          id: item.productId,
          name: item.productName,
          description: "Organic formulation",
          price: item.price,
          costPrice: item.price * 0.6,
          category: "hair",
          subCategory: "Treatment",
          imageUrl: "/logo.jpeg",
          stock: 50,
          safetyStock: 10,
          reorderLevel: 15,
          rating: 5,
          reviewsCount: 12,
          variants: [],
          features: [],
          mediaUrls: [],
          specifications: [],
          reviews: []
        };
        addToCart(fallbackProd, item.quantity, item.selectedVariant);
      }
    });
    toast.success(`Items from Order #${order.id.slice(0, 8).toUpperCase()} added to cart!`);
    setIsCartOpen(true);
  };

  const handleBuyAgainItem = (item: any) => {
    const fullProd = products.find(p => p.id === item.productId || p.name === item.productName);
    if (fullProd) {
      addToCart(fullProd, 1, item.selectedVariant);
    } else {
      const fallbackProd: Product = {
        id: item.productId,
        name: item.productName,
        description: "Organic formulation",
        price: item.price,
        costPrice: item.price * 0.6,
        category: "hair",
        subCategory: "Treatment",
        imageUrl: "/logo.jpeg",
        stock: 50,
        safetyStock: 10,
        reorderLevel: 15,
        rating: 5,
        reviewsCount: 12,
        variants: [],
        features: [],
        mediaUrls: [],
        specifications: [],
        reviews: []
      };
      addToCart(fallbackProd, 1, item.selectedVariant);
    }
    setIsCartOpen(true);
  };

  // Beauty Profile Form States
  const [name, setName] = useState(user?.user_metadata?.full_name || 'Customer');
  const [phone, setPhone] = useState(user?.user_metadata?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState(user?.user_metadata?.address || '');
  const [hairType, setHairType] = useState(user?.user_metadata?.hair_type || 'Type 4C');
  const [skinType, setSkinType] = useState(user?.user_metadata?.skin_type || 'Combination');
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.user_metadata?.avatar_url || '');

  // Wishlist State
  const [wishlistIds, setWishlistIds] = useState<string[]>(user?.user_metadata?.wishlist || []);

  // Support Form State
  const [supportSubject, setSupportSubject] = useState("Product Recommendation");
  const [supportMessage, setSupportMessage] = useState("");

  // Review Modal State
  const [reviewProductId, setReviewProductId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Tracking and Returns State
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Events & Wellness Promotions Integration State
  const [eventsSubTab, setEventsSubTab] = useState<"my_bookings" | "explore">("my_bookings");
  const [eventsData, setEventsData] = useState<any[]>([]);
  const [userRegistrations, setUserRegistrations] = useState<any[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState<boolean>(false);

  // Registration Modal state inside Dashboard
  const [regEventId, setRegEventId] = useState<string | null>(null);
  const [regStep, setRegStep] = useState<1 | 2>(1);
  const [regName, setRegName] = useState<string>(user?.user_metadata?.full_name || name || "");
  const [regEmail, setRegEmail] = useState<string>(user?.email || email || "");
  const [regPhone, setRegPhone] = useState<string>(user?.user_metadata?.phone || phone || "");
  const [regRole, setRegRole] = useState<"attendee" | "vendor">("attendee");
  const [regQuantity, setRegQuantity] = useState<number>(1);

  // Payment simulation state for Events
  const [paymentContext, setPaymentContext] = useState<"order" | "event">("event");
  const [pendingEventRegId, setPendingEventRegId] = useState<string | null>(null);
  const [pendingEventPrice, setPendingEventPrice] = useState<number>(0);
  const [stkStatus, setStkStatus] = useState<"idle" | "verifying" | "waiting_pin" | "success" | "failed">("idle");
  const [mpesaPinInput, setMpesaPinInput] = useState<string>("");
  const [isSTKSimulating, setIsSTKSimulating] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      if (!regName && (user.user_metadata?.full_name || name)) setRegName(user.user_metadata?.full_name || name);
      if (!regEmail && (user.email || email)) setRegEmail(user.email || email);
      if (!regPhone && (user.user_metadata?.phone || phone)) setRegPhone(user.user_metadata?.phone || phone);
    }
  }, [user, name, email, phone]);

  const fetchDashboardEventsData = async () => {
    setIsEventsLoading(true);
    try {
      const { data: evs } = await supabase.from('events').select('*, event_registrations(role)');
      setEventsData(evs || []);

      if (user?.email) {
        const { data: regs } = await supabase.from('event_registrations').select('*, events(*)').eq('email', user.email);
        setUserRegistrations(regs || []);
      }
    } catch (err) {
      console.error("Dashboard events fetch error:", err);
    } finally {
      setIsEventsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardEventsData();
  }, [user?.email]);

  const handleDashboardEventRegister = async (e: React.FormEvent, eventId: string) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPhone) {
      toast.error("Please fill in all registration details!");
      return;
    }

    const post = cmsPosts.find(p => p.id === eventId);

    try {
      const { data: existingReg } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('event_id', eventId)
        .eq('email', regEmail)
        .limit(1);

      if (existingReg && existingReg.length > 0) {
        const wantsMultiple = window.confirm("You have already registered for this event with this email. Do you want to register again to get an additional ticket?");
        if (!wantsMultiple) return;
      }

      let { data: evtData } = await supabase.from('events').select('*').eq('id', eventId).single();

      if (!evtData && post) {
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
         if (insError) console.error("Failed to create fallback event:", insError);
         evtData = newEvt;
      }

      const { count: currentVendors } = await supabase.from('event_registrations').select('*', { count: 'exact', head: true }).eq('event_id', eventId).eq('role', 'vendor');
      const { count: currentAttendees } = await supabase.from('event_registrations').select('*', { count: 'exact', head: true }).eq('event_id', eventId).eq('role', 'attendee');

      if (regRole === 'vendor') {
        if (evtData && evtData.vendor_enabled === false) {
          toast.error("Vendor registration is not enabled for this event."); return;
        }
        if ((currentVendors || 0) >= (evtData?.vendor_capacity || 10)) {
          toast.error("Sorry, vendor slots are fully booked."); return;
        }
      } else {
        if (evtData && evtData.attendee_enabled === false) {
          toast.error("Attendee registration is not enabled for this event."); return;
        }
        if ((currentAttendees || 0) >= (evtData?.capacity || 50)) {
          toast.error("Sorry, attendee tickets are sold out."); return;
        }
      }

      const unitPrice = regRole === 'vendor' ? (Number(evtData?.vendor_price) || 0) : (Number(evtData?.price) || 0);
      const price = unitPrice * regQuantity;

      if (price > 0) {
        setPendingEventRegId(eventId);
        setPendingEventPrice(price);
        setPaymentContext("event");
        setStkStatus("waiting_pin");
        setIsSTKSimulating(true);
      } else {
        const ticketNumber = "TKT-" + Math.floor(100000 + Math.random() * 900000);
        const { error: insErr } = await supabase.from('event_registrations').insert({
            event_id: eventId,
            role: regRole,
            name: regName,
            email: regEmail,
            phone: regPhone,
            payment_status: "free",
            amount_paid: 0,
            quantity: regQuantity,
            total_cost: 0,
            ticket_number: ticketNumber
        });
        
        if (insErr) throw insErr;
        
        fetch('/api/email/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: regEmail, 
            name: regName, 
            role: regRole, 
            eventTitle: post?.title || evtData?.title || 'ALOEFLORA Event', 
            ticketNumber, 
            paymentStatus: "Free" 
          })
        }).catch(err => console.error("Email send error", err));

        toast.success(`Successfully registered ${regName} as ${regRole}! Email confirmation sent.`);
        setRegEventId(null);
        setRegStep(1);
        setEventsSubTab("my_bookings");
        fetchDashboardEventsData();
      }
    } catch (err: any) {
      toast.error("Registration failed: " + err.message);
    }
  };

  const submitDashboardStkPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mpesaPinInput.length !== 4) return;
    setStkStatus("verifying");

    try {
      if (pendingEventRegId) {
        const ticketId = "TKT-" + Math.floor(100000 + Math.random() * 900000);
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
        
        const evTitle = cmsPosts.find(p => p.id === pendingEventRegId)?.title || 'ALOEFLORA Event';
        fetch('/api/email/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: regEmail, name: regName, role: regRole, eventTitle: evTitle, ticketNumber: ticketId, paymentStatus: "Paid", amount: pendingEventPrice })
        }).catch(err => console.error("Email send error", err));
        
        setTimeout(() => {
          setStkStatus("success");
          toast.success(`Payment confirmed! Ticket #${ticketId} created. Confirmation email sent.`);
          setIsSTKSimulating(false);
          setRegEventId(null);
          setEventsSubTab("my_bookings");
          fetchDashboardEventsData();
        }, 2000);
      }
    } catch (err: any) {
      toast.error("Payment failed: " + err.message);
      setStkStatus("failed");
    }
  };

  const handleDownloadRegTicket = (reg: any) => {
    const evTitle = reg.events?.title || cmsPosts.find(p => p.id === reg.event_id)?.title || "ALOEFLORA Event";
    const evDate = reg.events?.date || cmsPosts.find(p => p.id === reg.event_id)?.seoTitle || "Upcoming";
    const evLoc = reg.events?.location || cmsPosts.find(p => p.id === reg.event_id)?.seoDesc || "TBA";
    const tktNum = reg.ticket_number || `TKT-${reg.id.slice(0, 6).toUpperCase()}`;

    exportToPDF(
      `Event_Ticket_${tktNum}`,
      `Ticket - ${evTitle}`,
      ["Ticket #", "Role", "Name", "Email", "Phone", "Event Date", "Location", "Qty", "Payment Status", "Amount Paid"],
      [[
        tktNum, 
        (reg.role || 'attendee').toUpperCase(), 
        reg.name || name, 
        reg.email || user?.email || "", 
        reg.phone || "",
        evDate, 
        evLoc, 
        String(reg.quantity || 1), 
        (reg.payment_status || 'free').toUpperCase(), 
        reg.amount_paid ? `KES ${reg.amount_paid}` : 'FREE'
      ]]
    );
    toast.success("Your event ticket PDF has been downloaded successfully!");
  };

  const handleRequestReturn = (orderId: string) => {
    toast.success(`Return request initiated for Order #${orderId.slice(0, 8)}. Our support team will contact you shortly.`);
  };

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
        if (data) {
           if (data.address) setAddress(data.address);
           if (data.hair_type) setHairType(data.hair_type);
           if (data.skin_type) setSkinType(data.skin_type);
           if (data.avatar_url) setAvatarUrl(data.avatar_url);
           if (data.wishlist && data.wishlist.length > 0) setWishlistIds(data.wishlist);
        }
      });
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    toast.success("Signed out successfully.");
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error: authErr } = await supabase.auth.updateUser({
        data: {
          full_name: name,
          phone: phone,
          address: address,
          hair_type: hairType,
          skin_type: skinType,
          avatar_url: avatarUrl
        }
      });
      if (authErr) throw authErr;
      
      const { error: dbErr } = await supabase.from('profiles').update({
         full_name: name,
         phone: phone,
         address: address,
         hair_type: hairType,
         skin_type: skinType,
         avatar_url: avatarUrl
      }).eq('id', user?.id);
      
      if (dbErr) throw dbErr;

      toast.success('Beauty Profile updated and synced securely!');
    } catch (err: any) {
      toast.error(`Error updating profile: ${err.message}`);
    }
  };

  const handleToggleWishlist = async (productId: string) => {
    const isWished = wishlistIds.includes(productId);
    const newWishlist = isWished ? wishlistIds.filter(id => id !== productId) : [...wishlistIds, productId];
    setWishlistIds(newWishlist);
    
    if (user) {
      await supabase.auth.updateUser({ data: { wishlist: newWishlist } });
      await supabase.from('profiles').update({ wishlist: newWishlist }).eq('id', user.id);
    }
  };

  const handleSendSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddTicket) return;

    const newTicket: SupportTicket = {
      id: "TKT-" + Math.floor(100 + Math.random() * 900),
      customerName: name,
      email: email,
      phone: phone,
      subject: supportSubject,
      message: supportMessage,
      status: "open",
      createdAt: new Date().toISOString(),
      replies: [{ sender: "customer", message: supportMessage, timestamp: new Date().toISOString() }]
    };
    
    try {
      await supabase.from("support_tickets").insert({
        id: newTicket.id, customer_name: newTicket.customerName, email: newTicket.email, phone: newTicket.phone, subject: newTicket.subject, message: newTicket.message, status: newTicket.status, created_at: newTicket.createdAt, replies: newTicket.replies
      });
    } catch(err) { console.error("Ticket err", err); }

    onAddTicket(newTicket);
    setSupportMessage("");
    toast.success("Support ticket sent! Our team will contact you shortly.");
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewProductId || !user) return;
    setIsSubmittingReview(true);
    try {
      const { error } = await supabase.from('product_reviews').insert({
        product_id: reviewProductId,
        user_id: user.id,
        rating: reviewRating,
        review_text: reviewText
      });
      if (error) throw error;
      toast.success("Thank you! Your review has been submitted.");
      setReviewProductId(null);
      setReviewRating(5);
      setReviewText("");
    } catch (err: any) {
      toast.error(`Failed to submit review: ${err.message}`);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDownloadTicket = (evt: BookingEvent) => {
    exportToPDF(
      `Event_Ticket_${evt.id}`,
      `Ticket - ${evt.title}`,
      ["Attendee Name", "Event Date", "Event Time", "Location"],
      [[name, evt.date, evt.time, evt.location]]
    );
    toast.success("Your ticket PDF has been downloaded successfully!");
  };

  const handleDownloadInvoice = (order: Order) => {
    exportOrderInvoicePDF(order);
    toast.success(`Itemized Tax Invoice INV-${order.id.slice(0, 8).toUpperCase()} downloaded!`);
  };

  const handleDownloadLoyaltyStatement = () => {
    const mockProfile = {
      id: user?.id || "user-1",
      fullName: name,
      email: user?.email || "customer@aloeflora.com",
      loyaltyPoints: Math.floor(userOrders.reduce((sum, o) => sum + o.total, 0) / 100),
      totalSpending: totalSpent,
      orderCount: userOrders.length,
      role: "customer" as const,
      accountStatus: "active" as const,
      createdAt: new Date().toISOString()
    };
    exportLoyaltyStatementPDF(mockProfile, userOrders);
    toast.success("Loyalty & Rewards Statement downloaded successfully!");
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      const { error } = await supabase.from('orders').update({ delivery_status: 'cancelled' }).eq('id', orderId);
      if (error) throw error;
      toast.success("Order cancelled successfully.");
    } catch(err: any) {
      toast.error("Failed to cancel order: " + err.message);
    }
  };

  const handleDownloadSpendingReport = () => {
    const rows = userOrders.map(o => [
      o.id.slice(0, 8).toUpperCase(),
      new Date(o.createdAt).toLocaleDateString(),
      `${o.items.length} items`,
      `KES ${o.total}`,
      o.deliveryStatus
    ]);
    exportToPDF(
      `Spending_Report_${name.replace(/\s+/g, '_')}`,
      `Spending Report - ${name}`,
      ["Order ID", "Date", "Items", "Amount", "Status"],
      rows
    );
  };

  // Derived Data
  const userOrders = orders.filter(o => o.email === user?.email);
  const userEvents = events.filter(evt => evt.registrants.some(r => r.email === user?.email));
  const wishedProducts = products.filter(p => wishlistIds.includes(p.id));
  const totalSpent = userOrders.reduce((sum, order) => sum + order.total, 0);
  const pendingOrders = userOrders.filter(o => o.deliveryStatus === "pending").length;
  const deliveredOrders = userOrders.filter(o => o.deliveryStatus === "delivered").length;

  const sidebarLinks = [
    { id: "dashboard", label: "My Overview", icon: LayoutDashboard },
    { id: "store", label: "Shop Products", icon: Store },
    { id: "orders", label: "My Orders", icon: ShoppingBag },
    { id: "events", label: "Event Bookings", icon: Calendar },
    { id: "wishlist", label: "Wishlist", icon: Heart },
    { id: "profile", label: "Beauty Profile", icon: Settings },
    { id: "support", label: "Consultations", icon: MessageSquare },
  ];

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white flex flex-col">
      {/* SAAS TOPBAR HEADER */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-xl shadow-xs border border-emerald-900/10 dark:border-gray-800">
            <img src="/logo.jpeg" alt="ALOEFLORA Logo" className="h-8 w-auto object-contain rounded-lg" />
          </div>
          <div>
            <div className="text-sm font-black tracking-tight text-emerald-800 dark:text-lime-400 uppercase leading-none">
              ALOEFLORA
            </div>
            <div className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none mt-0.5">
              Customer Portal
            </div>
          </div>
        </div>

        {/* Topbar Controls */}
        <div className="flex items-center gap-2.5">
          {/* Wishlist Quick Action */}
          <button 
            onClick={() => setActiveTab("wishlist")}
            className="relative p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition cursor-pointer"
            title="Wishlist"
          >
            <Heart className="w-4 h-4" />
            {wishlistIds.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px] font-bold">
                {wishlistIds.length}
              </span>
            )}
          </button>

          {/* Cart Quick Action */}
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-200/50 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="Shopping Cart"
          >
            <ShoppingCart className="w-4 h-4 text-emerald-700 dark:text-lime-400" />
            <span className="hidden sm:inline">Cart</span>
            {cartItemCount > 0 && (
              <span className="min-w-[16px] h-4 px-1 bg-emerald-700 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                {cartItemCount}
              </span>
            )}
          </button>

          {setDarkMode && (
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-lime-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

          <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 hidden sm:block"></div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("profile")}
              title="Click to edit Beauty Profile Settings"
              className="flex items-center gap-2.5 px-2 py-1 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition cursor-pointer group border border-transparent hover:border-emerald-200/60 dark:hover:border-emerald-800/60 text-left"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center overflow-hidden border border-emerald-700 shadow-xs group-hover:scale-105 group-hover:ring-2 group-hover:ring-emerald-500/40 transition-all shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                  name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="text-left flex flex-col justify-center">
                <div className="text-xs font-bold text-gray-900 dark:text-white leading-none group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors flex items-center gap-1">
                  {name}
                  <Settings className="w-3 h-3 text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 truncate max-w-[120px] sm:max-w-[150px]">{email}</div>
              </div>
            </button>
            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* SAAS DASHBOARD CONTAINER */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
        {/* MOBILE TAB NAVIGATION (HORIZONTAL SCROLL) */}
        <div className="md:hidden flex overflow-x-auto gap-2 pb-2 scrollbar-none border-b border-gray-200 dark:border-gray-800">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? "bg-emerald-800 text-white shadow-sm"
                    : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </button>
            );
          })}
        </div>

        {/* SIDEBAR (DESKTOP) */}
        <div className="hidden md:flex flex-col w-64 shrink-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm h-fit">
          <div className="text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-3 mb-3">
            Navigation
          </div>
          
          <nav className="space-y-1">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id as any)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isActive 
                      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60" 
                      : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/60"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-emerald-700 dark:text-emerald-400" : ""}`} />
                  {link.label}
                </button>
              );
            })}
          </nav>

          <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold text-gray-600 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          {/* Special Banner */}
          <div className="mt-6 bg-gradient-to-br from-emerald-700 to-lime-600 rounded-xl p-4 text-white shadow-md shadow-emerald-900/10">
            <div className="font-extrabold text-xs mb-1 flex items-center gap-1">Exclusive Perk ✨</div>
            <p className="text-[11px] text-emerald-100 mb-3 leading-relaxed">
              Active members receive priority customer care & personalized organic consultations.
            </p>
            <button 
              onClick={() => setActiveTab("support")} 
              className="w-full text-center bg-white text-emerald-800 font-bold text-xs py-2 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
            >
              Contact Specialist
            </button>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 min-w-0">
        
        {activeTab === "dashboard" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Greeting & Beauty Profile Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900/5 via-emerald-800/5 to-transparent p-5 rounded-2xl border border-emerald-900/10 dark:border-emerald-800/20">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setActiveTab("profile")}
                  title="Click to edit Beauty Profile Settings"
                  className="relative group cursor-pointer shrink-0"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-800 text-white font-extrabold text-lg flex items-center justify-center overflow-hidden border-2 border-emerald-600 shadow-sm group-hover:scale-105 group-hover:ring-4 group-hover:ring-emerald-500/30 transition-all">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-900 p-1 rounded-full border border-gray-200 dark:border-gray-700 shadow-xs text-emerald-700 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Settings className="w-3 h-3" />
                  </div>
                </button>
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                    Welcome back, {name.split(' ')[0]}! 👋
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Hair Type: <span className="font-semibold text-emerald-700 dark:text-emerald-400">{hairType}</span> • Skin Type: <span className="font-semibold text-emerald-700 dark:text-emerald-400">{skinType}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("profile")}
                className="bg-white dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs shrink-0 self-start sm:self-auto cursor-pointer"
              >
                <Settings className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Edit Beauty Profile
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-500">Total Orders</div>
                    <div className="text-xl font-extrabold text-gray-900 dark:text-white">{userOrders.length}</div>
                  </div>
                </div>
                <button onClick={() => setActiveTab("orders")} className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-4 hover:underline">
                  View all orders <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                    <RefreshCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-500">Pending Orders</div>
                    <div className="text-xl font-extrabold text-gray-900 dark:text-white">{pendingOrders}</div>
                  </div>
                </div>
                <button onClick={() => setActiveTab("orders")} className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-4 hover:underline">
                  View pending <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-lime-50 dark:bg-lime-900/30 flex items-center justify-center text-lime-600">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-500">Delivered Orders</div>
                    <div className="text-xl font-extrabold text-gray-900 dark:text-white">{deliveredOrders}</div>
                  </div>
                </div>
                <button onClick={() => setActiveTab("orders")} className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-4 hover:underline">
                  View delivered <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-500">Total Spent</div>
                    <div className="text-xl font-extrabold text-gray-900 dark:text-white">KES {totalSpent.toLocaleString()}</div>
                  </div>
                </div>
                <button onClick={() => setActiveTab("orders")} className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-4 hover:underline">
                  View spending <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Recent Orders List */}
              <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-gray-900 dark:text-white">Recent Orders</h3>
                  <button onClick={() => setActiveTab("orders")} className="text-xs text-emerald-600 font-bold flex items-center gap-1 hover:underline">
                    View all orders <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {userOrders.map(order => (
                    <div key={order.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                          {/* Image placeholder */}
                          {order.items.length > 0 && products.find(p => p.id === order.items[0].productId) ? (
                            <img src={products.find(p => p.id === order.items[0].productId)?.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <ShoppingBag className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900 dark:text-white">
                            {order.items.length > 0 ? order.items[0].productName : "Multiple Items"}
                            {order.items.length > 1 && <span className="text-gray-400 text-xs font-normal"> + {order.items.length - 1} more</span>}
                          </div>
                          <div className="text-xs text-gray-500">Order #{order.id.slice(0, 8).toUpperCase()}</div>
                        </div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <div className={`text-xs font-bold px-2 py-0.5 rounded inline-block mb-1 ${
                          order.deliveryStatus === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
                          order.deliveryStatus === 'pending' ? 'bg-amber-50 text-amber-700' :
                          order.deliveryStatus === 'dispatched' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {order.deliveryStatus.charAt(0).toUpperCase() + order.deliveryStatus.slice(1)}
                        </div>
                        <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        KES {order.total.toLocaleString()}
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                    </div>
                  ))}
                  {userOrders.length === 0 && (
                    <div className="text-center py-8 text-sm text-gray-500">No orders found.</div>
                  )}
                </div>
              </div>

              {/* Sidebar Modules within Dashboard */}
              <div className="space-y-6">
                
                {/* Order Status Overview */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-6">Order Status Overview</h3>
                  <div className="flex items-center justify-center gap-6">
                    {/* SVG Donut Chart */}
                    <div className="relative w-24 h-24 shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" className="fill-none stroke-gray-100 dark:stroke-gray-800 stroke-[15]" />
                        <circle cx="50" cy="50" r="40" className="fill-none stroke-emerald-500 stroke-[15]" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - (deliveredOrders / Math.max(1, userOrders.length)))} />
                        <circle cx="50" cy="50" r="40" className="fill-none stroke-amber-400 stroke-[15]" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - (pendingOrders / Math.max(1, userOrders.length)))} />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-400">{userOrders.length}</span>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Delivered ({deliveredOrders})</div>
                      <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Pending ({pendingOrders})</div>
                      <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-400"></span> Cancelled (0)</div>
                    </div>
                  </div>
                </div>

                {/* Wishlist */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-900 dark:text-white">Wishlist</h3>
                    <button onClick={() => setActiveTab("wishlist")} className="text-xs text-emerald-600 font-bold hover:underline">View wishlist</button>
                  </div>
                  <div className="space-y-3">
                    {wishedProducts.slice(0, 3).map(p => (
                      <div key={p.id} className="flex items-center gap-3 border-b border-gray-50 dark:border-gray-800 pb-2 last:border-0 last:pb-0">
                        <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded border object-cover" />
                        <div className="flex-1">
                          <div className="text-xs font-bold text-gray-900 dark:text-white truncate">{p.name}</div>
                          <div className="text-[10px] text-emerald-800 dark:text-emerald-400 font-bold">KES {p.price.toLocaleString()}</div>
                        </div>
                        <Heart className="w-4 h-4 text-red-500 fill-red-500 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* My Reports Section */}
                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-gray-900 dark:text-white">My Personal Reports</h3>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                    Download itemized statements for historical spending trends, loyalty rewards, and tax accounting.
                  </p>
                  <div className="space-y-2">
                    <button onClick={handleDownloadSpendingReport} className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                      <Download className="w-4 h-4" /> Download Spending Report
                    </button>
                    <button onClick={handleDownloadLoyaltyStatement} className="w-full bg-white dark:bg-gray-800 border border-emerald-800/30 text-emerald-800 dark:text-emerald-400 font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer hover:bg-emerald-50">
                      <Gift className="w-4 h-4" /> Download Loyalty Statement
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Quick Restock & Recommended Products Section */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl shadow-sm mt-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <span className="text-[10px] font-extrabold text-emerald-800 dark:text-lime-400 uppercase tracking-widest font-mono">Quick Restock</span>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">Recommended Organic Formulations</h3>
                </div>
                <button onClick={() => setActiveTab("store")} className="text-xs text-emerald-600 font-bold flex items-center gap-1 hover:underline cursor-pointer">
                  Shop all catalog <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {products.slice(0, 4).map(p => (
                  <div key={p.id} className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl p-3 flex flex-col justify-between hover:shadow-md transition">
                    <div className="flex items-center gap-3 mb-3">
                      <img src={p.imageUrl} alt={p.name} className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">{p.name}</div>
                        <div className="text-[10px] text-emerald-700 dark:text-lime-400 font-black mt-0.5">KES {p.price.toLocaleString()}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => addToCart(p, 1)}
                      className="w-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ShoppingCart className="w-3 h-3" /> Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {/* Refer & Earn */}
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-2xl flex items-center gap-6">
                <div className="w-16 h-16 bg-white dark:bg-gray-900 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                  <Gift className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">Refer & Earn</h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 mb-3">Invite your friends and earn KES 500 for each successful referral.</p>
                  <button onClick={async () => {
                    const code = `REF-${name.split(' ')[0].toUpperCase()}-${user?.id.slice(0, 4).toUpperCase()}`;
                    const link = `https://aloeflora.com/invite/${code}`;
                    try {
                       const { data } = await supabase.from('promos').select('*').eq('code', code).single();
                       if (!data) {
                          await supabase.from('promos').insert({
                             code: code,
                             discount_percent: 10,
                             is_active: true
                          });
                       }
                    } catch(err) {}
                    navigator.clipboard.writeText(link);
                    toast.success("Referral link copied to clipboard! Promo generated.");
                  }} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer">
                    Refer Now
                  </button>
                </div>
              </div>

              {/* Help & Support */}
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl flex items-center gap-6 shadow-sm">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Need Help?</h3>
                  <p className="text-xs text-gray-500 mt-1 mb-3">Our support team is here to assist you with any questions.</p>
                  <button onClick={() => setActiveTab("support")} className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer">
                    Contact Support
                  </button>
                </div>
                <div className="w-20 h-20 shrink-0 text-emerald-500">
                  <HeadphonesIcon className="w-full h-full" />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ACTIVE PRODUCT CATALOG SHOP TAB */}
        {activeTab === "store" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Catalog Section Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800 gap-4">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-800 dark:text-lime-400 uppercase tracking-widest font-mono">
                  OUR ORGANIC PRODUCTS
                </span>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Active Product Catalog</h2>
              </div>

              {/* Search, Sort and Filters bars */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-white rounded-xl focus:outline-none focus:border-emerald-600 w-44 sm:w-56 transition-all"
                  />
                </div>

                <div className="flex bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden p-0.5">
                  <button 
                    onClick={() => setCatalogViewMode("grid")}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${catalogViewMode === "grid" ? "bg-white dark:bg-gray-700 shadow-xs text-emerald-700 dark:text-lime-400" : "text-gray-400 hover:text-gray-600"}`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setCatalogViewMode("list")}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${catalogViewMode === "list" ? "bg-white dark:bg-gray-700 shadow-xs text-emerald-700 dark:text-lime-400" : "text-gray-400 hover:text-gray-600"}`}
                    title="List View"
                  >
                    <ListIcon className="w-4 h-4" />
                  </button>
                </div>

                <select
                  value={catalogSortBy}
                  onChange={(e) => setCatalogSortBy(e.target.value)}
                  className="py-2 px-3 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-white rounded-xl focus:outline-none focus:border-emerald-600 cursor-pointer"
                >
                  <option value="default">Default Sort</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>

            {/* Categories Pills */}
            <div className="flex flex-wrap gap-2 pb-2">
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
                  className={`px-4 py-2 rounded-full text-xs font-bold cursor-pointer transition ${
                    selectedCategory === cat.id
                      ? "bg-emerald-800 text-white shadow-sm"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-emerald-600"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Product Catalog Display */}
            {catalogViewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCatalogProducts.map((p) => {
                  const isWished = wishlistIds.includes(p.id);
                  return (
                    <div key={p.id} className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden hover:shadow-lg transition flex flex-col justify-between">
                      <div className="h-52 overflow-hidden relative bg-gray-50 dark:bg-gray-800">
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                        <button 
                          onClick={() => handleToggleWishlist(p.id)} 
                          className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xs rounded-full shadow-md hover:scale-110 transition cursor-pointer"
                          title="Wishlist"
                        >
                          <Heart className={`w-4 h-4 ${isWished ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                        </button>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                            <span>{p.category}</span>
                            <span className="flex items-center gap-1 text-amber-500 font-extrabold">
                              ★ {p.rating || 5}
                            </span>
                          </div>
                          <h3 className="font-extrabold text-gray-900 dark:text-white text-sm line-clamp-1">{p.name}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                            {p.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold text-gray-400 block text-[9px] uppercase">Price</span>
                            <span className="text-base font-black text-emerald-800 dark:text-lime-400">
                              KES {p.price.toLocaleString()}
                            </span>
                          </div>

                          <button
                            onClick={() => addToCart(p, 1)}
                            className="bg-emerald-800 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCatalogProducts.map((p) => {
                  const isWished = wishlistIds.includes(p.id);
                  return (
                    <div key={p.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 hover:shadow-md transition">
                      <img src={p.imageUrl} alt={p.name} className="w-24 h-24 object-cover rounded-xl shrink-0" />
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{p.category}</span>
                          <span className="text-amber-500 font-extrabold text-xs">★ {p.rating || 5}</span>
                        </div>
                        <h3 className="font-extrabold text-gray-900 dark:text-white text-base mt-0.5">{p.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">{p.description}</p>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800">
                        <span className="text-lg font-black text-emerald-800 dark:text-lime-400">KES {p.price.toLocaleString()}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleToggleWishlist(p.id)} className="p-2 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer">
                            <Heart className={`w-4 h-4 ${isWished ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                          </button>
                          <button onClick={() => addToCart(p, 1)} className="bg-emerald-800 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                            <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {filteredCatalogProducts.length === 0 && (
              <div className="text-center py-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl">
                <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">No products found</h3>
                <p className="text-xs text-gray-500 mt-1">Try adjusting your search query or category filters.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm max-w-2xl animate-in fade-in duration-200">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Beauty Profile</h2>
            <p className="text-sm text-gray-500 mb-8">Personalize your ALOEFLORA experience for better product recommendations.</p>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="space-y-1.5 flex flex-col items-center sm:items-start pb-4 border-b border-gray-100 dark:border-gray-800">
                <label className="text-xs font-bold text-gray-500 uppercase">Profile Picture</label>
                <div className="w-full max-w-xs">
                  <MediaUploader
                    urls={avatarUrl ? [avatarUrl] : []}
                    onChange={(urls) => setAvatarUrl(urls[0] || '')}
                    multiple={false}
                    bucket="avatars"
                    label="Upload Avatar"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                  <input type="text" value={name} onChange={(e)=>setName(e.target.value)} required className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-emerald-600 text-sm dark:text-white transition" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
                  <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-emerald-600 text-sm dark:text-white transition" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Hair Type</label>
                  <select value={hairType} onChange={(e)=>setHairType(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-emerald-600 text-sm dark:text-white transition appearance-none">
                    <option>Type 1 (Straight)</option>
                    <option>Type 2 (Wavy)</option>
                    <option>Type 3 (Curly)</option>
                    <option>Type 4 (Coily/Kinky)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Skin Type</label>
                  <select value={skinType} onChange={(e)=>setSkinType(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-emerald-600 text-sm dark:text-white transition appearance-none">
                    <option>Normal</option>
                    <option>Dry</option>
                    <option>Oily</option>
                    <option>Combination</option>
                    <option>Sensitive</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">M-Pesa Phone Number</label>
                <input type="tel" value={phone} onChange={(e)=>setPhone(e.target.value)} required className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-emerald-600 text-sm dark:text-white transition" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Default Delivery Address</label>
                <input type="text" value={address} onChange={(e)=>setAddress(e.target.value)} placeholder="e.g. Westlands, Nairobi" required className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-emerald-600 text-sm dark:text-white transition" />
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 mt-6">
                <button type="submit" className="bg-emerald-800 text-white font-bold py-3 px-8 rounded-xl hover:bg-emerald-700 transition shadow cursor-pointer text-sm">
                  Save Beauty Profile
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Order History</h2>
                <p className="text-xs text-gray-500 mt-0.5">Track orders, download invoices, and reorder your organic favorites.</p>
              </div>
              <button 
                onClick={() => setActiveTab("store")} 
                className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm self-start sm:self-auto"
              >
                <Store className="w-4 h-4" /> Browse Catalog to Order
              </button>
            </div>

            <div className="space-y-4">
              {userOrders.map(order => (
                <div key={order.id} className="flex flex-col">
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-100 dark:border-gray-800 rounded-2xl transition hover:border-emerald-500/30">
                    <div className="flex items-center gap-4 mb-4 md:mb-0 cursor-pointer" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                        {order.items.length > 0 && products.find(p => p.id === order.items[0].productId) ? (
                          <img src={products.find(p => p.id === order.items[0].productId)?.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {order.items.length > 0 ? order.items[0].productName : "Multiple Items"}
                          {order.items.length > 1 && <span className="text-emerald-600 text-xs font-bold"> + {order.items.length - 1} more</span>}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Order #{order.id.slice(0, 8).toUpperCase()} • {new Date(order.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 md:w-auto">
                      <div className="flex items-center gap-2">
                        <div className={`text-xs font-bold px-3 py-1 rounded-full ${
                          order.deliveryStatus === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
                          order.deliveryStatus === 'pending' ? 'bg-amber-50 text-amber-700' :
                          order.deliveryStatus === 'dispatched' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {order.deliveryStatus.charAt(0).toUpperCase() + order.deliveryStatus.slice(1)}
                        </div>
                      </div>
                      <div className="text-sm font-extrabold text-gray-900 dark:text-white">
                        KES {order.total.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleDownloadInvoice(order)}
                          className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          title="Download Invoice PDF"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">Invoice</span>
                        </button>

                        <button 
                          onClick={() => handleReorderOrder(order)}
                          className="bg-emerald-800 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                          title="Reorder items from this order"
                        >
                          <RefreshCcw className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">Reorder All</span>
                        </button>

                        {order.deliveryStatus === 'pending' && (
                          <button 
                            onClick={() => handleCancelOrder(order.id)}
                            className="bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                        {order.deliveryStatus === 'delivered' && order.items.length > 0 && (
                          <button 
                            onClick={() => {
                              setReviewProductId(order.items[0].productId);
                              setReviewRating(5);
                              setReviewText("");
                            }}
                            className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Star className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Review</span>
                          </button>
                        )}
                        {order.deliveryStatus === 'delivered' && (
                          <button 
                            onClick={() => handleRequestReturn(order.id)}
                            className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <span className="hidden md:inline">Return</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {expandedOrder === order.id && (
                    <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 mt-[-1rem] rounded-b-2xl ml-4 mr-4 animate-in fade-in slide-in-from-top-2 space-y-6">
                      {/* Purchased Items List with Buy Again action */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Purchased Items</h4>
                        <div className="space-y-3">
                          {order.items.map((item, idx) => {
                            const fullProd = products.find(p => p.id === item.productId || p.name === item.productName);
                            return (
                              <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                  <img src={fullProd?.imageUrl || "/logo.jpeg"} alt={item.productName} className="w-10 h-10 object-cover rounded-lg border border-gray-200 dark:border-gray-700 shrink-0" />
                                  <div>
                                    <div className="text-xs font-bold text-gray-900 dark:text-white">{item.productName}</div>
                                    <div className="text-[10px] text-gray-500">Qty: {item.quantity} • KES {item.price.toLocaleString()}</div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleBuyAgainItem(item)}
                                  className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Buy Again
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Timeline Tracking */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Order Timeline Tracking</h4>
                        <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-3 space-y-6">
                          <div className="relative pl-6">
                            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-gray-900"></div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">Order Placed</div>
                            <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</div>
                          </div>
                          <div className="relative pl-6">
                            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full ${['dispatched', 'delivered'].includes(order.deliveryStatus) ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'} ring-4 ring-white dark:ring-gray-900`}></div>
                            <div className={`text-sm font-bold ${['dispatched', 'delivered'].includes(order.deliveryStatus) ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>Dispatched</div>
                          </div>
                          <div className="relative pl-6">
                            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full ${order.deliveryStatus === 'delivered' ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'} ring-4 ring-white dark:ring-gray-900`}></div>
                            <div className={`text-sm font-bold ${order.deliveryStatus === 'delivered' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>Delivered</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {userOrders.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="font-bold text-gray-700 dark:text-gray-300">You haven't placed any orders yet.</p>
                  <button onClick={() => setActiveTab("store")} className="inline-block mt-4 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer shadow-sm">
                    Browse Shop Catalog
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "events" && (
          <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm animate-in fade-in duration-200 text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <span className="text-[10px] text-emerald-800 dark:text-emerald-400 uppercase font-bold tracking-widest">EVENTS & WELLNESS PROMOTIONS</span>
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-0.5">Kenyan Organic Expos & Masterclasses</h2>
                <p className="text-xs text-gray-500 mt-1">Book your tickets, explore upcoming farm walks & expos, and manage active reservations.</p>
              </div>

              {/* Sub-tab switcher */}
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl self-start md:self-auto">
                <button 
                  onClick={() => setEventsSubTab("my_bookings")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${eventsSubTab === "my_bookings" ? "bg-emerald-800 text-white shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
                >
                  My Tickets ({userRegistrations.length + userEvents.length})
                </button>
                <button 
                  onClick={() => setEventsSubTab("explore")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${eventsSubTab === "explore" ? "bg-emerald-800 text-white shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
                >
                  Explore Events ({cmsPosts.filter(p => p.type === 'promotion' && p.status === 'published').length})
                </button>
              </div>
            </div>
            
            {/* SUB-TAB 1: MY BOOKINGS */}
            {eventsSubTab === "my_bookings" && (
              <div className="space-y-4">
                {/* 1. Supabase Event Registrations */}
                {userRegistrations.map(reg => {
                  const evTitle = reg.events?.title || cmsPosts.find(p => p.id === reg.event_id)?.title || "Organic Wellness Event";
                  const evDateStr = reg.events?.date || cmsPosts.find(p => p.id === reg.event_id)?.seoTitle || reg.created_at;
                  const dateObj = new Date(evDateStr);
                  const month = isNaN(dateObj.getTime()) ? 'EVENT' : dateObj.toLocaleString('default', { month: 'short' }).toUpperCase();
                  const day = isNaN(dateObj.getTime()) ? '🌿' : dateObj.getDate();
                  const evLoc = reg.events?.location || cmsPosts.find(p => p.id === reg.event_id)?.seoDesc || "Nairobi, Kenya";
                  const tktNum = reg.ticket_number || `TKT-${reg.id.slice(0, 6).toUpperCase()}`;

                  return (
                    <div key={reg.id} className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40 rounded-2xl p-5 flex flex-col md:flex-row gap-5 items-center justify-between shadow-xs">
                      <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left w-full md:w-auto">
                        <div className="w-24 h-24 bg-emerald-800 text-white rounded-xl flex flex-col items-center justify-center shrink-0 shadow-sm">
                          <span className="text-xs font-bold tracking-widest">{month}</span>
                          <span className="text-3xl font-black">{day}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap gap-2 items-center justify-center md:justify-start">
                            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold rounded uppercase tracking-wider">
                              {reg.role === 'vendor' ? 'Vendor Pass' : 'Attendee Ticket'}
                            </span>
                            <span className="px-2 py-0.5 bg-zinc-200 dark:bg-gray-800 text-gray-800 dark:text-gray-300 text-[10px] font-mono font-bold rounded">
                              #{tktNum}
                            </span>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${reg.payment_status === 'paid' ? 'bg-lime-100 text-emerald-900' : 'bg-gray-200 text-gray-700'}`}>
                              {reg.payment_status}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{evTitle}</h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1 justify-center md:justify-start">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {evLoc} • Qty: <span className="font-bold">{reg.quantity || 1}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 border-gray-100 dark:border-gray-800 pt-3 md:pt-0">
                        <button 
                          onClick={() => handleDownloadRegTicket(reg)} 
                          className="w-full md:w-auto bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" /> Download Ticket
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* 2. In-memory userEvents fallback */}
                {userEvents.map(evt => {
                  const dateObj = new Date(evt.date);
                  const month = isNaN(dateObj.getTime()) ? 'EVENT' : dateObj.toLocaleString('default', { month: 'short' });
                  const day = isNaN(dateObj.getTime()) ? '🌿' : dateObj.getDate();
                  return (
                    <div key={evt.id} className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center">
                      <div className="w-full md:w-32 h-32 bg-emerald-200 dark:bg-emerald-800 rounded-xl flex flex-col items-center justify-center text-emerald-800 dark:text-emerald-100 shrink-0">
                        <span className="text-sm font-bold uppercase tracking-widest">{month}</span>
                        <span className="text-4xl font-black">{day}</span>
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <div className="inline-block px-2 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded uppercase tracking-wider mb-2">Upcoming</div>
                        <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100">{evt.title}</h3>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-2">{evt.location} • {evt.time}</p>
                        <div className="mt-4 flex gap-3 justify-center md:justify-start">
                          <button onClick={() => handleDownloadTicket(evt)} className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer">Download Ticket</button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {userRegistrations.length === 0 && userEvents.length === 0 && (
                  <div className="text-center py-12 text-gray-500 bg-gray-50 dark:bg-gray-800/30 rounded-3xl border border-gray-100 dark:border-gray-800">
                    <Calendar className="w-12 h-12 mx-auto text-emerald-600 mb-3" />
                    <h4 className="font-bold text-gray-900 dark:text-white text-base">No active event bookings yet</h4>
                    <p className="text-xs text-gray-500 mt-1">Explore upcoming organic masterclasses, farm walks, and wellness expos.</p>
                    <button 
                      onClick={() => setEventsSubTab("explore")} 
                      className="inline-flex items-center gap-2 mt-4 bg-emerald-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition cursor-pointer"
                    >
                      Explore Available Events & Expos <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 2: EXPLORE PROMOTIONAL EVENTS & EXPOS */}
            {eventsSubTab === "explore" && (
              <div>
                {(() => {
                  const promotionalEvents = cmsPosts.filter(p => p.type === 'promotion' && p.status === 'published');
                  if (promotionalEvents.length === 0) {
                    return (
                      <div className="text-center py-12 text-gray-500">
                        <Sparkles className="w-10 h-10 mx-auto text-amber-500 mb-2" />
                        <p className="text-xs">No upcoming published promotional events scheduled at the moment. Check back soon!</p>
                      </div>
                    );
                  }

                  return (
                    <div className={promotionalEvents.length === 1 ? "grid grid-cols-1 gap-6" : "grid grid-cols-1 md:grid-cols-2 gap-6"}>
                      {promotionalEvents.map((evt) => (
                        <div key={evt.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between hover:shadow-md transition">
                          <div>
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
                                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> {evt.seoDesc || 'TBA'}
                              </div>
                              <p className="text-[11px] text-gray-500 line-clamp-3 leading-relaxed pt-1">{evt.content}</p>
                            </div>
                          </div>

                          <div className="p-4 border-t border-gray-100 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-800/20">
                            <div className="flex flex-col gap-1.5 mb-3">
                              {(() => {
                                const evState = eventsData.find(e => e.id === evt.id);
                                const aCount = evState?.event_registrations?.filter((r: any) => r.role === 'attendee').length || 0;
                                const vCount = evState?.event_registrations?.filter((r: any) => r.role === 'vendor').length || 0;
                                return (
                                  <>
                                    <div className="flex justify-between items-center text-[11px]">
                                      <span className="text-gray-600 dark:text-gray-400 font-medium">Attendee Rate: <strong className="text-emerald-700 dark:text-lime-400">{evState && evState.price > 0 ? `KES ${evState.price}` : 'Free'}</strong></span>
                                      <span className="text-emerald-800 dark:text-lime-300 font-bold bg-emerald-50 dark:bg-emerald-900/40 px-2 py-0.5 rounded text-[10px]">
                                        {evState ? Math.max(0, evState.capacity - aCount) : 50} slots left
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-[11px]">
                                      <span className="text-gray-600 dark:text-gray-400 font-medium">Vendor Pass: <strong className="text-amber-600 dark:text-amber-400">{evState && evState.vendor_price > 0 ? `KES ${evState.vendor_price}` : 'Free'}</strong></span>
                                      <span className="text-amber-800 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-900/40 px-2 py-0.5 rounded text-[10px]">
                                        {evState ? Math.max(0, (evState.vendor_capacity || 10) - vCount) : 10} vendor slots
                                      </span>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                            <button 
                              onClick={() => {
                                setRegEventId(evt.id);
                                setRegStep(1);
                                setRegQuantity(1);
                                if (!regName && (user?.user_metadata?.full_name || name)) setRegName(user?.user_metadata?.full_name || name);
                                if (!regEmail && (user?.email || email)) setRegEmail(user?.email || email);
                              }}
                              className="w-full text-center text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-xl cursor-pointer p-2.5 transition shadow-xs flex items-center justify-center gap-2"
                            >
                              View Registration Options <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {activeTab === "wishlist" && (
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm animate-in fade-in duration-200">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6">My Wishlist</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishedProducts.map(p => (
                <div key={p.id} className="group border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden hover:shadow-lg transition flex flex-col">
                  <div className="h-48 overflow-hidden relative bg-gray-50 dark:bg-gray-800">
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    <button onClick={() => handleToggleWishlist(p.id)} className="absolute top-3 right-3 p-2 bg-white/90 rounded-full text-red-500 hover:bg-red-50 transition cursor-pointer">
                      <Heart className="w-4 h-4 fill-red-500" />
                    </button>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 mb-1">{p.name}</h4>
                      <div className="text-xs text-gray-500 mb-3">{p.category}</div>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-400">KES {p.price.toLocaleString()}</span>
                      <button onClick={() => navigate('/store')} className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-800 dark:hover:bg-emerald-400 transition">
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {wishedProducts.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <Heart className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p>Your wishlist is empty.</p>
                  <Link to="/store" className="inline-block mt-4 text-emerald-600 font-bold hover:underline">Discover Products</Link>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "support" && (
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm animate-in fade-in duration-200">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Consultations & Support</h2>
            <p className="text-sm text-gray-500 mb-8">Reach out to our formulation experts or customer service.</p>
            
            <form onSubmit={handleSendSupport} className="space-y-4 max-w-xl">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Subject</label>
                <select value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-emerald-600 text-sm dark:text-white transition appearance-none">
                  <option value="Product Recommendation">Product Recommendation</option>
                  <option value="Order Inquiry">Order Inquiry</option>
                  <option value="Masterclass Details">Masterclass Details</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Message</label>
                <textarea rows={5} value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} placeholder="How can we help you today?" required className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-emerald-600 text-sm dark:text-white transition resize-none"></textarea>
              </div>
              <button type="submit" className="bg-emerald-800 text-white font-bold py-3 px-8 rounded-xl hover:bg-emerald-700 transition shadow text-sm">
                Send Message
              </button>
            </form>
          </div>
        )}

      </div>
      </div>
      
      {/* Review Modal Overlay */}
      {reviewProductId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Rate your purchase</h3>
              <button onClick={() => setReviewProductId(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmitReview} className="space-y-5">
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="transition transform hover:scale-110 cursor-pointer"
                  >
                    <Star className={`w-10 h-10 ${reviewRating >= star ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-700'}`} />
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Write a review (Optional)</label>
                <textarea 
                  rows={4} 
                  value={reviewText} 
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Tell others what you loved about this product..."
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-emerald-600 text-sm dark:text-white transition resize-none"
                ></textarea>
              </div>
              <button type="submit" disabled={isSubmittingReview} className="w-full bg-emerald-800 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition shadow disabled:opacity-50 cursor-pointer">
                {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DASHBOARD EVENT REGISTRATION POPUP MODAL */}
      {regEventId && (
        <div id="dashboard-event-reg-backdrop" className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in-95 text-left">
            <button 
              onClick={() => setRegEventId(null)}
              className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 p-1.5 rounded-full cursor-pointer text-gray-500 dark:text-gray-400"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-bold text-base text-gray-950 dark:text-white">Confirm Event Reservation</h3>
            <p className="text-xs text-gray-500 mt-1">Review your contact information to reserve your seat or vendor booth.</p>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (regStep === 1) {
                if (!regName || !regEmail || !regPhone) { toast.error("Fields cannot be empty!"); return; }
                setRegStep(2);
              } else {
                handleDashboardEventRegister(e, regEventId);
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
                      className="w-full text-xs p-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:border-emerald-700" 
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
                      className="w-full text-xs p-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:border-emerald-700" 
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
                      className="w-full text-xs p-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:border-emerald-700" 
                    />
                  </div>

                  <div className="space-y-2 mt-2">
                    <label className="text-[10px] uppercase font-bold text-gray-400 block">Registration Type</label>
                    {(() => {
                      const evState = eventsData.find(e => e.id === regEventId);
                      return (
                        <div className="grid grid-cols-2 gap-3">
                          {(!evState || evState.attendee_enabled !== false) && (
                            <label className={`cursor-pointer border-2 rounded-2xl p-4 transition text-center flex flex-col items-center justify-center ${regRole === 'attendee' ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 shadow-xs' : 'border-gray-100 hover:border-gray-200 dark:border-gray-800'}`}>
                              <input type="radio" name="regRoleDash" value="attendee" checked={regRole === 'attendee'} onChange={() => setRegRole('attendee')} className="hidden" />
                              <div className="font-bold text-sm text-gray-900 dark:text-white">Attendee</div>
                              <div className="text-[10px] text-emerald-600 font-bold mt-1 uppercase">{evState && evState.price > 0 ? `KES ${evState.price}` : 'Free Admission'}</div>
                            </label>
                          )}
                          {(!evState || evState.vendor_enabled !== false) && (
                            <label className={`cursor-pointer border-2 rounded-2xl p-4 transition text-center flex flex-col items-center justify-center ${regRole === 'vendor' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 shadow-xs' : 'border-gray-100 hover:border-gray-200 dark:border-gray-800'}`}>
                              <input type="radio" name="regRoleDash" value="vendor" checked={regRole === 'vendor'} onChange={() => setRegRole('vendor')} className="hidden" />
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
                      className="w-full text-xs p-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:border-emerald-700" 
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold p-3 rounded-xl transition cursor-pointer text-xs uppercase tracking-wide shadow-xs mt-4"
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
                    <button type="button" onClick={() => setRegStep(1)} className="w-1/3 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-bold p-3 rounded-xl transition cursor-pointer text-xs uppercase tracking-wide">
                      Back
                    </button>
                    {(() => {
                      const evState = eventsData.find(e => e.id === regEventId);
                      const price = regRole === 'vendor' ? (Number(evState?.vendor_price) || 0) : (Number(evState?.price) || 0);
                      return (
                        <button type="submit" className="w-2/3 bg-emerald-800 hover:bg-emerald-700 text-white font-bold p-3 rounded-xl transition cursor-pointer text-xs uppercase tracking-wide shadow-xs">
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

      {/* DASHBOARD M-PESA STK SIMULATION DIALOG */}
      {isSTKSimulating && (
        <div id="stk-push-backdrop-dash" className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[70] p-4">
          <div className="bg-white dark:bg-gray-900 border border-emerald-900/20 dark:border-emerald-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center relative animate-in fade-in zoom-in-95">
            <button 
              onClick={() => { setIsSTKSimulating(false); setStkStatus("idle"); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {stkStatus === "waiting_pin" && (
              <form onSubmit={submitDashboardStkPush} className="space-y-4">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto text-emerald-700 dark:text-lime-400">
                  <CreditCard className="w-7 h-7" />
                </div>
                <h3 className="font-extrabold text-base text-gray-900 dark:text-white">M-PESA Express Prompt</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Enter your 4-digit M-PESA PIN to complete payment of <strong className="text-emerald-600">KES {pendingEventPrice}</strong> for your ticket.
                </p>
                <div className="space-y-1">
                  <input 
                    type="password"
                    maxLength={4}
                    autoFocus
                    required
                    value={mpesaPinInput}
                    onChange={(e) => setMpesaPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full text-center tracking-[1em] text-lg font-bold p-3 border border-emerald-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={mpesaPinInput.length !== 4}
                  className="w-full bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold p-3 rounded-xl transition cursor-pointer text-xs uppercase tracking-wide shadow-xs"
                >
                  Pay KES {pendingEventPrice}
                </button>
              </form>
            )}

            {stkStatus === "verifying" && (
              <div className="py-6 space-y-4">
                <div className="animate-spin w-10 h-10 border-4 border-emerald-800 border-t-transparent rounded-full mx-auto"></div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">Verifying Transaction...</h3>
                <p className="text-xs text-gray-500">Contacting Safaricom Daraja Gateway...</p>
              </div>
            )}

            {stkStatus === "success" && (
              <div className="py-6 space-y-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto text-xl font-bold">✓</div>
                <h3 className="font-bold text-base text-emerald-900 dark:text-emerald-400">Payment Confirmed!</h3>
                <p className="text-xs text-gray-500">Your event ticket has been issued and stored in your dashboard.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

