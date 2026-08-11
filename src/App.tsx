import React, { useState, useEffect, Suspense, lazy } from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { 
  ShoppingBag, 
  Sparkles, 
  Lock, 
  Eye, 
  FileCode2, 
  Database, 
  BookOpen, 
  ArrowLeftRight, 
  Sun, 
  Moon, 
  Heart,
  Mail,
  Phone,
  HelpCircle,
  Menu,
  X,
  MapPin,
  LogOut,
  Settings,
  LayoutDashboard,
  User as UserIcon,
  Globe,
  Search,
  Home,
  ShoppingCart,
  Instagram,
  Facebook,
  MessageCircle
} from "lucide-react";
import { supabase } from "./lib/supabase";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ShopProvider, useShop } from "./contexts/ShopContext";
import ProtectedRoute from "./components/ProtectedRoute";
import CustomerAuth from "./components/auth/CustomerAuth";
import AdminAuth from "./components/auth/AdminAuth";
import NotFound from './components/NotFound';
import GlobalNavbar from "./components/GlobalNavbar";
import { 
  Product, 
  Order, 
  SupportTicket, 
  MarketingCampaign, 
  BookingEvent, 
  CMSPost, 
  AuditAnomaly, 
  StoreSettings, 
  UserProfile, 
  Promo 
} from "./types";
import CartSidebar from "./components/CartSidebar";
import WishlistSidebar from "./components/WishlistSidebar";
import toast, { Toaster } from "react-hot-toast";
import { SEO } from "./components/SEO";
import { CookieBanner } from "./components/CookieBanner";
const CustomerStore = lazy(() => import("./components/CustomerStore"));
const AdminConsole = lazy(() => import("./components/AdminConsole"));
const ArchitectureDocs = lazy(() => import("./components/ArchitectureDocs"));
const UserDashboard = lazy(() => import("./components/UserDashboard"));
const FAQPage = lazy(() => import("./components/FAQPage"));
const AboutUsPage = lazy(() => import("./components/AboutUsPage"));
const BlogsPage = lazy(() => import("./components/BlogsPage"));
const ProductDetailPage = lazy(() => import("./components/ProductDetailPage"));
const CheckoutPage = lazy(() => import("./components/CheckoutPage"));
const PoliciesPage = lazy(() => import("./components/PoliciesPage"));

// Public-only route wrapper to redirect authenticated users to their respective SaaS dashboard
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  if (loading) return null;
  if (user) {
    if (role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  const isDashboardMode = !!user || location.pathname.includes('/dashboard') || location.pathname.includes('/admin');
  
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("aloeflora_dark_mode");
    return saved === "true";
  });

  // ERP Centralized Database States
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem("aloeflora_db_products");
    return saved ? JSON.parse(saved) : [];
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem("aloeflora_db_orders");
    return saved ? JSON.parse(saved) : [];
  });
  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem("aloeflora_db_tickets");
    return saved ? JSON.parse(saved) : [];
  });
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>(() => {
    const saved = localStorage.getItem("aloeflora_db_campaigns");
    return saved ? JSON.parse(saved) : [];
  });
  const [events, setEvents] = useState<BookingEvent[]>(() => {
    const saved = localStorage.getItem("aloeflora_db_events");
    return saved ? JSON.parse(saved) : [];
  });
  const [cmsPosts, setCmsPosts] = useState<CMSPost[]>(() => {
    const saved = localStorage.getItem("aloeflora_db_cms");
    return saved ? JSON.parse(saved) : [];
  });
  const [anomalies, setAnomalies] = useState<AuditAnomaly[]>(() => {
    const saved = localStorage.getItem("aloeflora_db_anomalies");
    return saved ? JSON.parse(saved) : [];
  });
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem("aloeflora_db_store_settings");
    return saved ? JSON.parse(saved) : ({} as StoreSettings);
  });
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);

  // Mobile menu visibility
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [showLegal, setShowLegal] = useState<boolean>(false);

  // One-time production rollout cache wipe to resolve any stale image references
  useEffect(() => {
    if (typeof window !== "undefined" && window.location && !localStorage.getItem("aloeflora_prod_v1")) {
      const isDarkMode = localStorage.getItem("aloeflora_dark_mode");
      localStorage.clear();
      if (isDarkMode) localStorage.setItem("aloeflora_dark_mode", isDarkMode);
      localStorage.setItem("aloeflora_prod_v1", "true");
      if (typeof process !== "undefined" && process.env && process.env.NODE_ENV === "test") {
        // Skip reload in test environment
      } else {
        try {
          if (typeof window.location.reload === 'function') {
            window.location.reload();
          }
        } catch (e) {
          // Ignored in test environment
        }
      }
    }
  }, []);

  // Sync state variables to LocalStorage on updates
  useEffect(() => {
    localStorage.setItem("aloeflora_db_products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("aloeflora_db_orders", JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem("aloeflora_db_tickets", JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem("aloeflora_db_campaigns", JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    localStorage.setItem("aloeflora_db_events", JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem("aloeflora_db_cms", JSON.stringify(cmsPosts));
  }, [cmsPosts]);


  useEffect(() => {
    localStorage.setItem("aloeflora_db_anomalies", JSON.stringify(anomalies));
  }, [anomalies]);

  useEffect(() => {
    localStorage.setItem("aloeflora_db_store_settings", JSON.stringify(storeSettings));
  }, [storeSettings]);

  // Apply visual theme tags
  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
    localStorage.setItem("aloeflora_dark_mode", String(darkMode));
  }, [darkMode]);

  // Real-time Supabase integration for all data
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Orders
        const { data: ordData, error: ordErr } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (ordData && !ordErr) {
          const mapped: Order[] = ordData.map((d: any) => ({
            id: d.id, customerName: d.customer_name, phone: d.phone, email: d.email || "", county: d.county || "", subCounty: d.sub_county || "", estate: d.estate || "", building: d.building || "", houseNumber: d.house_number || "", deliveryNotes: d.delivery_notes || "", items: d.items || [], subtotal: d.subtotal || d.total_amount, deliveryFee: d.delivery_fee || 0, total: d.total_amount, paymentMethod: d.payment_method || "mpesa_stk", paymentStatus: d.status, deliveryStatus: d.delivery_status || "pending", mpesaReceipt: d.mpesa_receipt || "", createdAt: d.created_at
          }));
          setOrders(mapped);
        }
        
        // Products
        const { data: prodData, error: prodErr } = await supabase.from('products').select('*');
        if (prodData && !prodErr) {
          const mappedProds: Product[] = prodData.map((p: any) => ({
            id: p.id, name: p.name, description: p.description, price: p.price, costPrice: p.cost_price,
            category: p.category as any, subCategory: p.sub_category, imageUrl: p.image_url, stock: p.stock,
            safetyStock: p.safety_stock, reorderLevel: p.reorder_level, rating: p.rating, reviewsCount: p.reviews_count,
            variants: p.variants || [], features: p.features || [], mediaUrls: p.media_urls || [], specifications: p.specifications || [], reviews: []
          }));
          setProducts(mappedProds);
        }

        // CMS
        const { data: cmsData, error: cmsErr } = await supabase.from('cms_posts').select('*').order('created_at', { ascending: false });
        if (cmsData && !cmsErr) {
          const mappedCms: CMSPost[] = cmsData.map((c: any) => ({
            id: c.id, title: c.title, content: c.content, type: c.type, status: c.status, author: c.author,
            imageUrl: c.image_url, createdAt: c.created_at, seoTitle: c.seo_title, seoDesc: c.seo_desc, seoKeywords: c.seo_keywords
          }));
          setCmsPosts(mappedCms);
        }

        // Tickets
        const { data: tktData, error: tktErr } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
        if (tktData && !tktErr) {
          const mappedTkts: SupportTicket[] = tktData.map((t: any) => ({
            id: t.id, customerName: t.customer_name, email: t.email, phone: t.phone, subject: t.subject,
            message: t.message, status: t.status, createdAt: t.created_at, replies: t.replies || []
          }));
          setTickets(mappedTkts);
        }

        // Events
        const { data: evtData, error: evtErr } = await supabase.from('events').select('*');
        if (evtData && !evtErr) {
          const mappedEvts: BookingEvent[] = evtData.map((e: any) => ({
            id: e.id, title: e.title, date: e.date, time: e.time || "TBA", location: e.location,
            description: e.description, imageUrl: e.image_url, capacity: e.capacity,
            registrantCount: e.registrant_count, registrants: e.registrants || [], status: e.status || "upcoming",
            price: e.price || 0
          }));
          setEvents(mappedEvts);
        }
        // Store Settings
        const { data: stData, error: stErr } = await supabase.from('store_settings').select('*').eq('id', 'global').single();
        if (stData && !stErr) {
          setStoreSettings({
            id: stData.id,
            adminName: stData.admin_name,
            adminEmail: stData.admin_email,
            seoTitle: stData.seo_title,
            seoDesc: stData.seo_desc,
            seoKeywords: stData.seo_keywords,
            seoRobots: stData.seo_robots,
            sitemapGeneratedAt: stData.sitemap_generated_at,
            updatedAt: stData.updated_at
          });
        }

        // Profiles / Users
        const { data: profData, error: profErr } = await supabase.from('profiles').select('*');
        if (profData && !profErr) {
          const mappedUsers: UserProfile[] = profData.map((u: any) => ({
            id: u.id, fullName: u.full_name, email: u.email, phone: u.phone, role: u.role, accountStatus: u.account_status,
            createdAt: u.created_at, lastLogin: u.last_login, totalSpending: u.total_spending, orderCount: u.order_count
          }));
          setUsers(mappedUsers);
        }

        // Campaigns
        const { data: campData, error: campErr } = await supabase.from('campaigns').select('*');
        if (campData && !campErr) {
          const mappedCamp: MarketingCampaign[] = campData.map((c: any) => ({
            id: c.id, name: c.name, platform: c.platform, status: c.status, budget: c.budget, impressions: c.impressions,
            clicks: c.clicks, conversions: c.conversions, roi: c.roi_percent, startDate: c.start_date, endDate: c.end_date
          }));
          setCampaigns(mappedCamp);
        }

        // Promos
        const { data: promoData, error: promoErr } = await supabase.from('promos').select('*');
        if (promoData && !promoErr) {
          const mappedPromos: Promo[] = promoData.map((p: any) => ({
            id: p.id, code: p.code, discountPercent: p.discount_percent, isActive: p.is_active, createdAt: p.created_at
          }));
          setPromos(mappedPromos);
        }

      } catch (err) { console.warn("Supabase not active", err); }
    };
    
    fetchAllData();
    const channels = supabase.channel('custom-all-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cms_posts' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'promos' }, fetchAllData)
      .subscribe();
      
    return () => { supabase.removeChannel(channels); };
  }, [user]);

  // Actions passed to children handlers
  const handleAddNewOrder = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
  };

  const handleUpdateProductStock = (productId: string, quantitySold: number) => {
    setProducts((prev) => prev.map((p) => {
      if (p.id === productId) {
        const nextStock = Math.max(0, p.stock - quantitySold);
        
        // Log a warn log if falls below safety stock
        if (nextStock <= p.safetyStock) {
          const alertMessage = `Reorder trigger warning: inventory item '${p.name}' fallen below safety limit. Active stock: ${nextStock}.`;
          
          // Inject anomaly alert
          const newAnomaly: AuditAnomaly = {
            id: "ANM-" + Math.floor(100 + Math.random() * 900),
            type: "stock_discrepancy",
            severity: "medium",
            message: alertMessage,
            timestamp: new Date().toISOString(),
            status: "unresolved"
          };
          setAnomalies((prevAnm) => [newAnomaly, ...prevAnm]);
        }
        return { ...p, stock: nextStock };
      }
      return p;
    }));
  };

  const handleRegisterEventSeat = (eventId: string, registrant: { name: string; email: string; phone: string }) => {
    let success = false;
    setEvents((prev) => prev.map((evt) => {
      if (evt.id === eventId) {
        if (evt.registrantCount < evt.capacity) {
          success = true;
          return {
            ...evt,
            registrantCount: evt.registrantCount + 1,
            registrants: [
              ...evt.registrants,
              {
                name: registrant.name,
                email: registrant.email,
                phone: registrant.phone,
                registeredAt: new Date().toISOString()
              }
            ]
          };
        } else {
          toast.error("Sorry, this event has reached full seating capacity.");
        }
      }
      return evt;
    }));
    return success;
  };

  const handleResolveAnomaly = (anomalyId: string) => {
    setAnomalies((prev) => prev.map((anm) => {
      if (anm.id === anomalyId) {
        return { ...anm, status: "resolved" as const, resolvedBy: "0000-0000-0000-0000" };
      }
      return anm;
    }).filter(anm => anm.status !== "resolved")); // removes resolved
  };

  const handleAddTicket = (ticket: SupportTicket) => {
    setTickets((prev) => [ticket, ...prev]);
  };

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden transition duration-300 font-sans ${
      darkMode ? "bg-gray-950 text-white" : "bg-neutral-50/50 text-gray-900"
    }`}>
      <SEO 
        title={storeSettings?.seoTitle}
        description={storeSettings?.seoDesc}
        keywords={storeSettings?.seoKeywords}
        robots={storeSettings?.seoRobots}
      />
      <Toaster position="top-right" />
      <CookieBanner />
      
      <ShopProvider>
        {!isDashboardMode && <GlobalNavbar darkMode={darkMode} setDarkMode={setDarkMode} products={products} />}
        <CartSidebar promos={promos} products={products} />
        <WishlistSidebar products={products} />
      
      {/* CENTRAL CORE WRAPPER SECTION */}
      <main className={`${isDashboardMode ? 'w-full p-0' : 'max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 min-h-[calc(100vh-160px)] w-full overflow-x-hidden'}`}>
        <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-800"></div></div>}>
          <Routes>
            <Route path="/" element={<PublicOnlyRoute><Navigate to="/store" replace /></PublicOnlyRoute>} />
            <Route path="/about" element={<PublicOnlyRoute><AboutUsPage cmsPosts={cmsPosts} /></PublicOnlyRoute>} />
            <Route path="/blogs" element={<PublicOnlyRoute><BlogsPage cmsPosts={cmsPosts} /></PublicOnlyRoute>} />
            <Route path="/login" element={<PublicOnlyRoute><CustomerAuth initialMode="login" /></PublicOnlyRoute>} />
            <Route path="/register" element={<PublicOnlyRoute><CustomerAuth initialMode="register" /></PublicOnlyRoute>} />
            <Route path="/forgot-password" element={<PublicOnlyRoute><CustomerAuth initialMode="forgot-password" /></PublicOnlyRoute>} />
            <Route path="/admin/login" element={<PublicOnlyRoute><AdminAuth initialMode="login" /></PublicOnlyRoute>} />
            <Route path="/admin/forgot-password" element={<PublicOnlyRoute><AdminAuth initialMode="forgot-password" /></PublicOnlyRoute>} />
            <Route 
              path="/store/*" 
              element={
                <PublicOnlyRoute>
                  <CustomerStore 
                    products={products}
                    events={events}
                    cmsPosts={cmsPosts}
                    promos={promos}
                    onAddOrder={handleAddNewOrder}
                    onRegisterEvent={handleRegisterEventSeat}
                    onUpdateProductStock={handleUpdateProductStock}
                  />
                </PublicOnlyRoute>
              } 
            />
            <Route 
              path="/dashboard/*" 
              element={
                <ProtectedRoute requiredRole="customer">
                  <UserDashboard 
                    orders={orders} 
                    products={products} 
                    events={events}
                    cmsPosts={cmsPosts}
                    onAddTicket={handleAddTicket}
                    darkMode={darkMode}
                    setDarkMode={setDarkMode}
                  />
                </ProtectedRoute>
              } 
            />
            <Route path="/customer/dashboard/*" element={<Navigate to="/dashboard" replace />} />
            <Route 
              path="/admin/dashboard/*" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminConsole 
                    products={products}
                    orders={orders}
                    tickets={tickets}
                    campaigns={campaigns}
                    cmsPosts={cmsPosts}
                    anomalies={anomalies}
                    storeSettings={storeSettings}
                    users={users}
                    promos={promos}
                    onUpdateInventory={setProducts}
                    onUpdateOrders={setOrders}
                    onUpdateCampaigns={setCampaigns}
                    onUpdateCMS={setCmsPosts}
                    onUpdateSettings={setStoreSettings}
                    onUpdateUsers={setUsers}
                    onUpdatePromos={setPromos}
                    onResolveAnomaly={handleResolveAnomaly}
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/product/:id" 
              element={
                <PublicOnlyRoute>
                  <ProductDetailPage 
                    products={products}
                  />
                </PublicOnlyRoute>
              } 
            />
            <Route 
              path="/checkout" 
              element={
                <CheckoutPage 
                  onAddOrder={(order) => {
                    setOrders(prev => [order, ...prev]);
                  }}
                  promos={promos}
                />
              } 
            />
            <Route path="/faq" element={<PublicOnlyRoute><FAQPage cmsPosts={cmsPosts} /></PublicOnlyRoute>} />
            <Route path="/policies/:policyId" element={<PoliciesPage />} />
            <Route path="/docs" element={<ArchitectureDocs />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      {/* PARTNERS SHOWCASE SECTION (GLOBAL PUBLIC ONLY) */}
      {!isDashboardMode && (
        <section id="partners-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-left w-full">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-6 mt-12">
            <div>
              <span className="text-[10px] text-[#50A63C] uppercase font-extrabold tracking-widest">Our Partners</span>
              <h3 className="text-lg font-bold text-[#2B4E22] dark:text-white mt-1">Trusted & Certified By</h3>
            </div>
            <Globe className="w-5 h-5 text-[#50A63C]" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { id: "kirdi", name: "KIRDI", src: "/partners/KIRDI.jpeg" },
              { id: "kam", name: "Kenya Association of Manufacturers", src: "/partners/Kenya Association of Manufacturers.jpeg" },
              { id: "handinhand", name: "Hand In Hand", src: "/partners/Hand In Hand.jpeg" },
              { id: "madeinkenya", name: "Made In Kenya", src: "/partners/Made In Kenya.jpeg" },
              { id: "markup2", name: "Markup II", src: "/partners/Markup II.jpeg" },
            ].map((partner) => (
              <div key={partner.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex items-center justify-center transition duration-300 hover:border-[#50A63C]">
                <div className="flex flex-col items-center gap-2">
                  <img src={partner.src} alt={partner.name} className="h-16 w-auto object-contain" />
                  <span className="text-[10px] font-bold text-gray-400 mt-2">{partner.name}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* GLOBAL BRAND FOOTER SIGNALS (PUBLIC ONLY) */}
      {!isDashboardMode && (
        <footer id="footer-contacts" className="relative bg-[#152E15] dark:bg-gray-950 text-white pt-14 pb-28 md:pb-14 mt-16 overflow-hidden border-t border-emerald-900/30 dark:border-gray-800 transition-colors">
          {/* Dual Brand Gradient Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#348C21] via-[#50A63C] to-[#152E15]"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-white p-1 rounded-2xl shadow-sm border border-emerald-900/10">
                    <img src="/logo.jpeg" alt="ALOEFLORA Logo" className="h-12 w-auto object-contain rounded-xl" />
                  </div>
                  <div className="text-left select-none">
                    <div className="font-black text-lg tracking-tight uppercase leading-none">
                      <span className="text-[#348C21]">ALOE F</span>
                      <span className="text-emerald-300">LORA</span>
                    </div>
                    <div className="text-[10px] font-extrabold tracking-widest text-emerald-400 uppercase leading-none mt-1">
                      PRODUCTS
                    </div>
                  </div>
                </div>
                <p className="text-xs text-emerald-100/90 leading-relaxed font-medium">
                  Quality, Affordable & Natural Products.<br/>
                  Locally sourced. Zero toxic components. Pure, intense hydration for Kenyan curls, skin cells, and healthy household surfaces.
                </p>
              </div>
              
              <div>
                <h4 className="font-extrabold text-sm text-white mb-4 uppercase tracking-wider">Quick Links</h4>
                <ul className="space-y-2.5 text-xs text-emerald-100/80 font-medium">
                  <li><Link to="/store#organic-formulations" className="hover:text-[#348C21] dark:hover:text-emerald-400 transition-colors">Shop Products</Link></li>
                  <li><Link to="/store#events-marketing-section" className="hover:text-[#348C21] dark:hover:text-emerald-400 transition-colors">Events & Workshops</Link></li>
                  <li><Link to="/dashboard" className="hover:text-[#348C21] dark:hover:text-emerald-400 transition-colors">Track Order</Link></li>
                  <li><Link to="/policies/returns" className="hover:text-[#348C21] dark:hover:text-emerald-400 transition-colors cursor-pointer">Return Policy</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-extrabold text-sm text-white mb-4 uppercase tracking-wider">Contact Info</h4>
                <ul className="space-y-3 text-xs text-emerald-100/80 font-medium">
                  <li className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#348C21] dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>Nairobi CBD Depot, Kenya</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-[#348C21] dark:text-emerald-400 shrink-0" />
                    <a href="tel:+254116794448" className="hover:text-[#348C21] dark:hover:text-emerald-400 transition-colors">+254 116 794 448</a>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-[#348C21] dark:text-emerald-400 shrink-0" />
                    <a href="mailto:info@aloefloraproducts.com" className="hover:text-[#348C21] dark:hover:text-emerald-400 transition-colors">info@aloefloraproducts.com</a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-extrabold text-sm text-white mb-4 uppercase tracking-wider">Connect With Us</h4>
                <div className="flex items-center gap-3">
                  <a 
                    href="https://www.instagram.com/aloefloraproducts?igsh=NjZmYWFkOWp2b290" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    title="Instagram"
                    className="bg-[#1C3B19] dark:bg-gray-900 border border-emerald-800/50 dark:border-gray-800 p-2.5 rounded-xl hover:bg-[#348C21] hover:text-white transition-all cursor-pointer text-emerald-200"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                  <a 
                    href="https://www.facebook.com/share/1BZ23fA3FJ/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    title="Facebook"
                    className="bg-[#1C3B19] dark:bg-gray-900 border border-emerald-800/50 dark:border-gray-800 p-2.5 rounded-xl hover:bg-[#348C21] hover:text-white transition-all cursor-pointer text-emerald-200"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                  <a 
                    href="https://wa.me/254116794448" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    title="WhatsApp"
                    className="bg-[#1C3B19] dark:bg-gray-900 border border-emerald-800/50 dark:border-gray-800 p-2.5 rounded-xl hover:bg-[#348C21] hover:text-white transition-all cursor-pointer text-emerald-200"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
            
            <div className="pt-8 border-t border-emerald-900/50 dark:border-gray-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-emerald-200/70">
              <span>&copy; {new Date().getFullYear()} ALOEFLORA PRODUCTS Kenya. All rights reserved.</span>
              <div className="flex gap-6 font-semibold">
                <Link to="/policies/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                <Link to="/policies/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* DYNAMIC MOBILE BOTTOM NAVIGATION BAR */}
      <MobileBottomNav />
      </ShopProvider>
    </div>
  );
}

// DYNAMIC MOBILE BOTTOM NAVIGATION BAR COMPONENT
function MobileBottomNav() {
  const { user, role } = useAuth();
  const { cart, isCartOpen, isWishlistOpen, isAiAssistantOpen, setIsCartOpen } = useShop();
  const location = useLocation();

  const isDashboardMode = !!user || location.pathname.includes('/dashboard') || location.pathname.includes('/admin');
  const isCheckoutOrAuthPage = ['/checkout', '/login', '/register', '/forgot-password', '/admin'].some(p => location.pathname.startsWith(p));

  // Hide mobile bottom nav on dashboard, checkout, auth pages, or when cart/wishlist/AI assistant drawers are open
  if (isDashboardMode || isCheckoutOrAuthPage || isCartOpen || isWishlistOpen || isAiAssistantOpen) {
    return null;
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur-lg border-t border-gray-200/80 dark:border-gray-800 z-40 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] pt-1.5 px-4 shadow-lg transition-all duration-300">
      <div className="flex justify-around items-center h-12">
        <Link 
          to="/store" 
          className={`flex flex-col items-center justify-center w-full h-full text-[11px] font-medium transition ${
            location.pathname === '/store' || location.pathname === '/' 
              ? 'text-emerald-700 dark:text-emerald-400 font-extrabold' 
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </Link>

        <Link 
          to="/store#organic-formulations" 
          className={`flex flex-col items-center justify-center w-full h-full text-[11px] font-medium transition ${
            location.pathname.includes('/product') 
              ? 'text-emerald-700 dark:text-emerald-400 font-extrabold' 
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Search className="w-5 h-5 mb-0.5" />
          <span>Explore</span>
        </Link>

        <button 
          onClick={() => setIsCartOpen(true)}
          className={`flex flex-col items-center justify-center w-full h-full text-[11px] font-medium transition relative cursor-pointer ${
            isCartOpen ? 'text-emerald-700 dark:text-emerald-400 font-extrabold' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5 mb-0.5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white dark:border-gray-950">
                {cartCount}
              </span>
            )}
          </div>
          <span>Cart</span>
        </button>

        <Link 
          to={user ? (role === 'admin' ? '/admin/dashboard' : '/dashboard') : '/login'} 
          className={`flex flex-col items-center justify-center w-full h-full text-[11px] font-medium transition ${
            location.pathname.includes('dashboard') || location.pathname.includes('login')
              ? 'text-emerald-700 dark:text-emerald-400 font-extrabold' 
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <UserIcon className="w-5 h-5 mb-0.5" />
          <span>Profile</span>
        </Link>
      </div>
    </div>
  );
}
