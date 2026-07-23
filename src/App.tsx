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
  Twitter
} from "lucide-react";
import { supabase } from "./lib/supabase";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ShopProvider } from "./contexts/ShopContext";
import ProtectedRoute from "./components/ProtectedRoute";
import CustomerAuth from "./components/auth/CustomerAuth";
import AdminAuth from "./components/auth/AdminAuth";
import NotFound from './components/NotFound';
import GlobalNavbar from "./components/GlobalNavbar";
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

export default function App() {
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  
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
      <CookieBanner />
      
      <ShopProvider>
        <GlobalNavbar darkMode={darkMode} setDarkMode={setDarkMode} />
        <CartSidebar promos={promos} />
        <WishlistSidebar products={products} />
      
      {/* CENTRAL CORE WRAPPER SECTION */}
      <main className={`${location.pathname.includes('/dashboard') || location.pathname.includes('/admin') ? 'w-full max-w-[1920px]' : 'max-w-7xl'} mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-160px)]`}>
        <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-800"></div></div>}>
          <Routes>
            <Route path="/" element={<Navigate to="/store" replace />} />
            <Route path="/about" element={<AboutUsPage cmsPosts={cmsPosts} />} />
            <Route path="/blogs" element={<BlogsPage cmsPosts={cmsPosts} />} />
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
            <Route 
              path="/product/:id" 
              element={
                <ProductDetailPage 
                  products={products}
                />
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
            <Route path="/faq" element={<FAQPage cmsPosts={cmsPosts} />} />
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

      {/* PARTNERS SHOWCASE SECTION (GLOBAL) */}
      <section id="partners-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-left w-full">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-6 mt-12">
          <div>
            <span className="text-[10px] text-emerald-800 dark:text-emerald-400 uppercase font-bold tracking-widest">Our Partners</span>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">Trusted & Certified By</h3>
          </div>
          <Globe className="w-5 h-5 text-emerald-800 dark:text-emerald-400" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {[
            { id: "kirdi", name: "KIRDI", src: "/partners/KIRDI.jpeg" },
            { id: "kam", name: "Kenya Association of Manufacturers", src: "/partners/Kenya Association of Manufacturers.jpeg" },
            { id: "handinhand", name: "Hand In Hand", src: "/partners/Hand In Hand.jpeg" },
            { id: "madeinkenya", name: "Made In Kenya", src: "/partners/Made In Kenya.jpeg" },
            { id: "markup2", name: "Markup II", src: "/partners/Markup II.jpeg" },
          ].map((partner) => (
            <div key={partner.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex items-center justify-center transition duration-300">
              <div className="flex flex-col items-center gap-2">
                <img src={partner.src} alt={partner.name} className="h-16 w-auto object-contain" />
                <span className="text-[10px] font-bold text-gray-400 mt-2">{partner.name}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

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
                <li><Link to="/store#organic-formulations" className="hover:text-emerald-600 transition">Shop Products</Link></li>
                <li><Link to="/store#events-marketing-section" className="hover:text-emerald-600 transition">Events & Workshops</Link></li>
                <li><button onClick={() => toast.success('Track Order portal coming soon!')} className="hover:text-emerald-600 transition cursor-pointer">Track Order</button></li>
                <li><Link to="/policies/returns" className="hover:text-emerald-600 transition cursor-pointer">Return Policy</Link></li>
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
                  <a href="tel:+254116794448" className="hover:text-emerald-600 transition">+254 116 794 448</a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-lime-400 shrink-0" />
                  <a href="mailto:obondodoris@gmail.com" className="hover:text-emerald-600 transition">obondodoris@gmail.com</a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-sm text-white mb-4">Connect With Us</h4>
              <div className="flex items-center gap-3">
                <a href="https://instagram.com/aloeflora" target="_blank" rel="noopener noreferrer" className="bg-emerald-900/50 p-2 rounded-xl hover:bg-emerald-800 hover:text-white transition cursor-pointer text-emerald-100/70">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="https://facebook.com/aloeflora" target="_blank" rel="noopener noreferrer" className="bg-emerald-900/50 p-2 rounded-xl hover:bg-emerald-800 hover:text-white transition cursor-pointer text-emerald-100/70">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="https://twitter.com/aloeflora" target="_blank" rel="noopener noreferrer" className="bg-emerald-900/50 p-2 rounded-xl hover:bg-emerald-800 hover:text-white transition cursor-pointer text-emerald-100/70">
                  <Twitter className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-emerald-900/50 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-emerald-100/50 font-mono">
            <span>&copy; {new Date().getFullYear()} ALOEFLORA PRODUCTS Kenya. All rights reserved.</span>
            <div className="flex gap-4">
              <Link to="/policies/terms" className="hover:text-white transition">Terms of Service</Link>
              <Link to="/policies/privacy" className="hover:text-white transition">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-50 pb-safe">
        <div className="flex justify-around items-center h-16 px-4">
          <Link to="/store" className={`flex flex-col items-center justify-center w-full h-full text-xs transition ${location.pathname === '/store' || location.pathname === '/' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
            <Home className="w-5 h-5 mb-1" />
            <span>Home</span>
          </Link>
          <Link to="/store#organic-formulations" className={`flex flex-col items-center justify-center w-full h-full text-xs transition ${location.pathname.includes('/product') ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
            <Search className="w-5 h-5 mb-1" />
            <span>Explore</span>
          </Link>
          <Link to="/checkout" className={`flex flex-col items-center justify-center w-full h-full text-xs transition ${location.pathname === '/checkout' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
            <ShoppingCart className="w-5 h-5 mb-1" />
            <span>Cart</span>
          </Link>
          <Link to={user ? (role === 'admin' ? '/admin/dashboard' : '/customer/dashboard') : '/login'} className={`flex flex-col items-center justify-center w-full h-full text-xs transition ${location.pathname.includes('dashboard') ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
            <UserIcon className="w-5 h-5 mb-1" />
            <span>Profile</span>
          </Link>
        </div>
      </div>
      </ShopProvider>
    </div>
  );
}
