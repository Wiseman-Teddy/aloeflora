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
  User as UserIcon
} from "lucide-react";
import { supabase } from "./lib/supabase";
import { useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import CustomerAuth from "./components/auth/CustomerAuth";
import AdminAuth from "./components/auth/AdminAuth";
import NotFound from './components/NotFound';
import { Toaster, toast } from 'react-hot-toast';
import { Product, Order, SupportTicket, MarketingCampaign, BookingEvent, CMSPost, DevOpsLog, AuditAnomaly, StoreSettings, UserProfile, Promo } from "./types";
import { SEO } from "./components/SEO";
const CustomerStore = lazy(() => import("./components/CustomerStore"));
const AdminConsole = lazy(() => import("./components/AdminConsole"));
const ArchitectureDocs = lazy(() => import("./components/ArchitectureDocs"));
const UserDashboard = lazy(() => import("./components/UserDashboard"));

export default function App() {
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("aloeflora_dark_mode");
    return saved === "true";
  });

  // ERP Centralized Database States
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [cmsPosts, setCmsPosts] = useState<CMSPost[]>([]);
  const [anomalies, setAnomalies] = useState<AuditAnomaly[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({} as StoreSettings);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);

  // Mobile menu visibility
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [showLegal, setShowLegal] = useState<boolean>(false);

  // One-time production rollout cache wipe to resolve any stale image references
  useEffect(() => {
    if (!localStorage.getItem("aloeflora_prod_v1")) {
      const isDarkMode = localStorage.getItem("aloeflora_dark_mode");
      localStorage.clear();
      if (isDarkMode) localStorage.setItem("aloeflora_dark_mode", isDarkMode);
      localStorage.setItem("aloeflora_prod_v1", "true");
      window.location.reload();
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
        if (ordData && !ordErr && ordData.length > 0) {
          const mapped: Order[] = ordData.map((d: any) => ({
            id: d.id, customerName: d.customer_name, phone: d.phone, email: d.email || "", county: d.county || "", subCounty: d.sub_county || "", estate: d.estate || "", building: d.building || "", houseNumber: d.house_number || "", deliveryNotes: d.delivery_notes || "", items: d.items || [], subtotal: d.subtotal || d.total_amount, deliveryFee: d.delivery_fee || 0, total: d.total_amount, paymentMethod: d.payment_method || "mpesa_stk", paymentStatus: d.status, deliveryStatus: d.delivery_status || "pending", mpesaReceipt: d.mpesa_receipt || "", createdAt: d.created_at
          }));
          setOrders(mapped);
        }
        
        // Products
        const { data: prodData, error: prodErr } = await supabase.from('products').select('*');
        if (prodData && !prodErr && prodData.length > 0) {
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
        if (cmsData && !cmsErr && cmsData.length > 0) {
          const mappedCms: CMSPost[] = cmsData.map((c: any) => ({
            id: c.id, title: c.title, content: c.content, type: c.type, status: c.status, author: c.author,
            imageUrl: c.image_url, createdAt: c.created_at, seoTitle: c.seo_title, seoDesc: c.seo_desc, seoKeywords: c.seo_keywords
          }));
          setCmsPosts(mappedCms);
        }

        // Tickets
        const { data: tktData, error: tktErr } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
        if (tktData && !tktErr && tktData.length > 0) {
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
            registrantCount: e.registrant_count, registrants: e.registrants || [], status: e.status || "upcoming"
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
        if (profData && !profErr && profData.length > 0) {
          const mappedUsers: UserProfile[] = profData.map((u: any) => ({
            id: u.id, fullName: u.full_name, email: u.email, phone: u.phone, role: u.role, accountStatus: u.account_status,
            createdAt: u.created_at, lastLogin: u.last_login, totalSpending: u.total_spending, orderCount: u.order_count
          }));
          setUsers(mappedUsers);
        }

        // Campaigns
        const { data: campData, error: campErr } = await supabase.from('campaigns').select('*');
        if (campData && !campErr && campData.length > 0) {
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
    <div className={`min-h-screen transition duration-300 font-sans ${
      darkMode ? "bg-gray-950 text-white" : "bg-neutral-50/50 text-gray-900"
    }`}>
      <SEO 
        title={storeSettings?.seoTitle}
        description={storeSettings?.seoDesc}
        keywords={storeSettings?.seoKeywords}
        robots={storeSettings?.seoRobots}
      />
      <Toaster position="top-right" />
      
      {/* GLOBAL ENTERPRISE SUPERIOR NAVIGATION HEADER */}
      <header id="enterprise-header" className="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-white p-0.5 rounded-xl shadow-sm border border-emerald-900/10 dark:border-gray-800">
              <img src="/logo.jpeg" alt="ALOEFLORA Logo" className="h-10 w-auto object-contain rounded-lg" />
            </div>
            <div className="text-left select-none hidden sm:block">
              <div className="text-sm font-extrabold tracking-tight text-emerald-800 dark:text-lime-400 block scale-y-105 leading-none uppercase">
                ALOEFLORA PRODUCTS
              </div>
              <div className="text-[9px] uppercase font-bold tracking-wider text-gray-400 mt-1 block font-mono leading-none">
                Quality, Affordable & Natural
              </div>
            </div>
          </Link>

          {/* Main Navigation Links */}
          <nav className="hidden md:flex items-center gap-2 bg-neutral-100/70 dark:bg-zinc-900/60 p-1.5 rounded-full border border-neutral-150/40">
            <Link
              to="/store"
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer select-none text-gray-600 dark:text-gray-300 hover:text-gray-950 hover:bg-white dark:hover:bg-gray-800"
            >
              Home
            </Link>
            <a
              href="/store#organic-formulations"
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer select-none text-gray-600 dark:text-gray-300 hover:text-gray-950 hover:bg-white dark:hover:bg-gray-800"
            >
              Products
            </a>
            <a
              href="/store#about-us"
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer select-none text-gray-600 dark:text-gray-300 hover:text-gray-950 hover:bg-white dark:hover:bg-gray-800"
            >
              About us
            </a>
            <a
              href="/store#our-team"
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer select-none text-gray-600 dark:text-gray-300 hover:text-gray-950 hover:bg-white dark:hover:bg-gray-800"
            >
              Our team
            </a>
            <a
              href="#footer-contacts"
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer select-none text-gray-600 dark:text-gray-300 hover:text-gray-950 hover:bg-white dark:hover:bg-gray-800"
            >
              Contacts
            </a>
          </nav>

          {/* Interactive controls */}
          <div className="flex items-center gap-3">
            {/* Dark mode button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-neutral-150/50 dark:bg-zinc-900 dark:border-gray-800 cursor-pointer transition text-gray-500 dark:text-lime-400"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Auth Buttons & Roles State visual notification bar */}
            {user ? (
              <div className="hidden lg:flex items-center gap-3">
                {role === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold transition"
                  >
                    <Lock className="w-3.5 h-3.5" /> Admin Console
                  </Link>
                )}
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100/50 px-3 py-1.5 rounded-full select-none text-xs">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="font-semibold text-emerald-900 dark:text-emerald-300 text-[10px] uppercase font-mono">
                    Role: {role}
                  </span>
                </div>
                {role === 'customer' && (
                  <Link
                    to="/customer/dashboard"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold transition"
                    title="My Dashboard"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                  </Link>
                )}
                <button
                  onClick={signOut}
                  className="p-2 rounded-full bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 cursor-pointer transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-1.5 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <UserIcon className="w-3.5 h-3.5" /> Sign In
                </Link>
              </div>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl border cursor-pointer hover:bg-neutral-50"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Responsive Mobile navigation list */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white dark:bg-gray-900 p-4 space-y-2 text-xs flex flex-col items-stretch">
            <Link
              to="/store"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Home
            </Link>
            <a
              href="/store#organic-formulations"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Products
            </a>
            <a
              href="/store#about-us"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              About us
            </a>
            <a
              href="/store#our-team"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Our team
            </a>
            <a
              href="#footer-contacts"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Contacts
            </a>
            {role === 'admin' && (
              <Link
                to="/admin/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-3 rounded-xl font-bold flex items-center gap-2 text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30"
              >
                <Lock className="w-4 h-4" /> Admin Console
              </Link>
            )}
            {user ? (
              <>
                {role === 'customer' && (
                  <Link
                    to="/customer/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-3 rounded-xl font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <LayoutDashboard className="w-4 h-4" /> My Dashboard
                  </Link>
                )}
                <button
                  onClick={() => { signOut(); setIsMobileMenuOpen(false); }}
                  className="p-3 rounded-xl font-bold flex items-center gap-2 text-red-600"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-3 rounded-xl font-bold flex items-center gap-2 text-emerald-800 dark:text-lime-400"
              >
                <UserIcon className="w-4 h-4" /> Sign In
              </Link>
            )}
          </div>
        )}
      </header>

      {/* CENTRAL CORE WRAPPER SECTION */}
      <main className={`${location.pathname.includes('/dashboard') || location.pathname.includes('/admin') ? 'w-full max-w-[1920px]' : 'max-w-7xl'} mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-160px)]`}>
        <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-800"></div></div>}>
          <Routes>
            <Route path="/" element={<Navigate to="/store" replace />} />
            <Route path="/login" element={<CustomerAuth initialMode="login" />} />
            <Route path="/register" element={<CustomerAuth initialMode="register" />} />
            <Route path="/forgot-password" element={<CustomerAuth initialMode="forgot-password" />} />
            <Route path="/admin/login" element={<AdminAuth initialMode="login" />} />
            <Route path="/admin/forgot-password" element={<AdminAuth initialMode="forgot-password" />} />
            <Route 
              path="/store/*" 
              element={
                <CustomerStore 
                  products={products}
                  events={events}
                  cmsPosts={cmsPosts}
                  promos={promos}
                  onAddOrder={handleAddNewOrder}
                  onRegisterEvent={handleRegisterEventSeat}
                  onUpdateProductStock={handleUpdateProductStock}
                />
              } 
            />
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
            <Route path="/docs" element={<ArchitectureDocs />} />
            <Route 
              path="/customer/dashboard/*" 
              element={
                <ProtectedRoute requiredRole="customer">
                  <UserDashboard 
                    orders={orders} 
                    products={products} 
                    events={events}
                    onAddTicket={handleAddTicket}
                  />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      {/* GLOBAL BRAND FOOTER SIGNALS */}
      <footer id="footer-contacts" className="border-t border-emerald-950 dark:border-gray-900 bg-emerald-950 text-white py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-white p-0.5 rounded-xl shadow-sm border border-emerald-900/10">
                  <img src="/logo.jpeg" alt="ALOEFLORA Logo" className="h-12 w-auto object-contain rounded-lg" />
                </div>
                <span className="font-extrabold tracking-tight text-emerald-800 dark:text-lime-400 uppercase text-lg">ALOEFLORA PRODUCTS</span>
              </div>
              <p className="text-xs text-emerald-100/70 leading-relaxed">
                Quality, Affordable & Natural Products.<br/>
                Locally sourced. Zero toxic components. Pure, intense hydration for Kenyan curls and skin.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-sm text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-xs text-emerald-100/70">
                <li><Link to="/store" className="hover:text-emerald-600 transition">Shop Products</Link></li>
                <li><a href="#events-marketing-section" className="hover:text-emerald-600 transition">Events & Workshops</a></li>
                <li><button onClick={() => toast.success('Track Order portal coming soon!')} className="hover:text-emerald-600 transition cursor-pointer">Track Order</button></li>
                <li><button onClick={() => toast.success('Return Policy documentation is being updated.')} className="hover:text-emerald-600 transition cursor-pointer">Return Policy</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-sm text-white mb-4">Contact Info</h4>
              <ul className="space-y-3 text-xs text-emerald-100/70">
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-lime-400 shrink-0" />
                  <span>Nairobi CBD Depot, Kenya</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-lime-400 shrink-0" />
                  <a href="tel:+254702283637" className="hover:text-emerald-600 transition">+254 702 283 637</a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-lime-400 shrink-0" />
                  <a href="mailto:obondodoris@gmail.com" className="hover:text-emerald-600 transition">obondodoris@gmail.com</a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-sm text-white mb-4">Social Media</h4>
              <div className="flex gap-4">
                <a href="https://www.instagram.com/aloefloraproducts?igsh=YzljYTk1ODg3Zg==" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-emerald-900 border border-emerald-800 flex items-center justify-center text-lime-400 hover:bg-emerald-800 transition">
                  <span className="font-bold text-xs">IG</span>
                </a>
                <a href="https://www.facebook.com/aloefloraproducts" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-emerald-900 border border-emerald-800 flex items-center justify-center text-lime-400 hover:bg-emerald-800 transition">
                  <span className="font-bold text-xs">FB</span>
                </a>
                <a href="https://wa.me/254702283637" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-emerald-900 border border-emerald-800 flex items-center justify-center text-lime-400 hover:bg-emerald-800 transition">
                  <span className="font-bold text-xs">WA</span>
                </a>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between pt-6 border-t border-emerald-900 text-[10px] text-emerald-200/50 font-mono">
            <span>© {new Date().getFullYear()} ALOEFLORA PRODUCTS Kenya. All rights reserved.</span>

          </div>
        </div>
      </footer>
    </div>
  );
}
