import React, { useState, useEffect, Suspense, lazy } from "react";
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
  MapPin
} from "lucide-react";
import { supabase } from "./lib/supabase";

import { Product, Order, SupportTicket, MarketingCampaign, BookingEvent, CMSPost, DevOpsLog, AuditAnomaly, SEOConfig } from "./types";
import { 
  INITIAL_PRODUCTS, 
  INITIAL_ORDERS, 
  INITIAL_TICKETS, 
  INITIAL_CAMPAIGNS, 
  INITIAL_EVENTS, 
  INITIAL_CMS, 
  INITIAL_DEV_LOGS, 
  INITIAL_AUDIT_ANOMALIES, 
  DEFAULT_SEO_CONFIG 
} from "./data/mockData";

const CustomerStore = lazy(() => import("./components/CustomerStore"));
const AdminConsole = lazy(() => import("./components/AdminConsole"));
const ArchitectureDocs = lazy(() => import("./components/ArchitectureDocs"));

export default function App() {
  // View Router state
  const [activeTab, setActiveTab] = useState<"store" | "admin" | "docs">("store");
  
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("aloeflora_dark_mode");
    return saved === "true";
  });

  // ERP Centralized Database States
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem("aloeflora_db_products");
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem("aloeflora_db_orders");
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem("aloeflora_db_tickets");
    return saved ? JSON.parse(saved) : INITIAL_TICKETS;
  });

  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>(() => {
    const saved = localStorage.getItem("aloeflora_db_campaigns");
    return saved ? JSON.parse(saved) : INITIAL_CAMPAIGNS;
  });

  const [events, setEvents] = useState<BookingEvent[]>(() => {
    const saved = localStorage.getItem("aloeflora_db_events");
    return saved ? JSON.parse(saved) : INITIAL_EVENTS;
  });

  const [cmsPosts, setCmsPosts] = useState<CMSPost[]>(() => {
    const saved = localStorage.getItem("aloeflora_db_cms");
    return saved ? JSON.parse(saved) : INITIAL_CMS;
  });

  const [devLogs, setDevLogs] = useState<DevOpsLog[]>(() => {
    const saved = localStorage.getItem("aloeflora_db_devlogs");
    return saved ? JSON.parse(saved) : INITIAL_DEV_LOGS;
  });

  const [anomalies, setAnomalies] = useState<AuditAnomaly[]>(() => {
    const saved = localStorage.getItem("aloeflora_db_anomalies");
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_ANOMALIES;
  });

  const [seoConfig, setSeoConfig] = useState<SEOConfig>(() => {
    const saved = localStorage.getItem("aloeflora_db_seo");
    return saved ? JSON.parse(saved) : DEFAULT_SEO_CONFIG;
  });

  // Mobile menu visibility
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

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
    localStorage.setItem("aloeflora_db_devlogs", JSON.stringify(devLogs));
  }, [devLogs]);

  useEffect(() => {
    localStorage.setItem("aloeflora_db_anomalies", JSON.stringify(anomalies));
  }, [anomalies]);

  useEffect(() => {
    localStorage.setItem("aloeflora_db_seo", JSON.stringify(seoConfig));
  }, [seoConfig]);

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

  // Real-time Supabase integration for orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (data && !error && data.length > 0) {
          const mapped: Order[] = data.map((d: any) => ({
            id: d.id, customerName: d.customer_name, phone: d.phone, email: "", county: "", subCounty: "", estate: "", building: "", houseNumber: "", deliveryNotes: "", items: [], subtotal: d.total_amount, deliveryFee: 0, total: d.total_amount, paymentMethod: "mpesa_stk", paymentStatus: d.status, deliveryStatus: "pending", mpesaReceipt: "", createdAt: d.created_at
          }));
          setOrders(prev => {
            // Merge logic to avoid overwriting dummy items completely, just prepend new DB items
            const newIds = new Set(mapped.map(m => m.id));
            const filteredPrev = prev.filter(p => !newIds.has(p.id));
            return [...mapped, ...filteredPrev];
          });
        }
      } catch (err) { console.warn("Supabase not active", err); }
    };
    
    fetchOrders();
    const channel = supabase.channel('orders_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      }).subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Actions passed to children handlers
  const handleAddNewOrder = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);

    // Dispatch a successful dev log
    const newLog: DevOpsLog = {
      id: "log-" + (devLogs.length + 1),
      timestamp: new Date().toISOString(),
      level: "info",
      service: "api",
      message: `Order completed: invoice matching ${newOrder.id} dispatched successfully.`
    };
    setDevLogs((prev) => [newLog, ...prev]);
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

          const newLog: DevOpsLog = {
            id: "log-" + (devLogs.length + 2),
            timestamp: new Date().toISOString(),
            level: "warn",
            service: "database",
            message: alertMessage
          };
          setDevLogs((prevLog) => [newLog, ...prevLog]);
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
          alert("Sorry, this event has reached full seating capacity.");
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

  return (
    <div className={`min-h-screen transition duration-300 font-sans ${
      darkMode ? "bg-gray-950 text-white" : "bg-neutral-50/50 text-gray-900"
    }`}>
      
      {/* GLOBAL ENTERPRISE SUPERIOR NAVIGATION HEADER */}
      <header id="enterprise-header" className="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo matching leaf description */}
          <div className="flex items-center gap-3">
            {/* Custom SVG logo mimicking pure green succulent leaves styled exquisitely */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-800 to-lime-500 shadow-md shadow-emerald-700/20 flex items-center justify-center text-white font-extrabold select-none shrink-0 border border-emerald-900/10">
              <span className="text-lg">A</span>
            </div>
            <div className="text-left select-none">
              <div className="text-sm font-extrabold tracking-tight text-emerald-850 dark:text-lime-400 block scale-y-105 leading-none uppercase">
                ALOEFLORA
              </div>
              <div className="text-[9px] uppercase font-bold tracking-wider text-gray-400 mt-1 block font-mono leading-none">
                Quality, Affordable & Natural
              </div>
            </div>
          </div>

          {/* Core Tab switch router */}
          <nav className="hidden md:flex items-center gap-2 bg-neutral-100/70 dark:bg-zinc-900/60 p-1.5 rounded-full border border-neutral-150/40">
            <button
              onClick={() => setActiveTab("store")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer select-none ${
                activeTab === "store"
                  ? "bg-emerald-800 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-950"
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Customer Storefront
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer select-none ${
                activeTab === "admin"
                  ? "bg-emerald-800 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-950"
              }`}
            >
              <Lock className="w-3.5 h-3.5" /> Consolidated Admin Console
            </button>
            <button
              onClick={() => setActiveTab("docs")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer select-none ${
                activeTab === "docs"
                  ? "bg-emerald-800 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-950"
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" /> Architectural Specifications
            </button>
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

            {/* Simulated Roles State visual notification bar */}
            <div className="hidden lg:flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100/50 px-3 py-1.5 rounded-full select-none text-xs">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="font-semibold text-emerald-900 dark:text-emerald-300 text-[10px] uppercase font-mono">
                {activeTab === "admin" ? "Role: Admin" : "Role: Guest / Buyer"}
              </span>
            </div>

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
          <div className="md:hidden border-t bg-white dark:bg-gray-905 p-4 space-y-2 text-xs flex flex-col items-stretch">
            <button
              onClick={() => {
                setActiveTab("store");
                setIsMobileMenuOpen(false);
              }}
              className={`p-3 rounded-xl font-bold flex items-center gap-2 ${
                activeTab === "store" ? "bg-emerald-800 text-white" : ""
              }`}
            >
              <Eye className="w-4 h-4" /> Storefront
            </button>
            <button
              onClick={() => {
                setActiveTab("admin");
                setIsMobileMenuOpen(false);
              }}
              className={`p-3 rounded-xl font-bold flex items-center gap-2 ${
                activeTab === "admin" ? "bg-emerald-800 text-white" : ""
              }`}
            >
              <Lock className="w-4 h-4" /> Admin Console
            </button>
            <button
              onClick={() => {
                setActiveTab("docs");
                setIsMobileMenuOpen(false);
              }}
              className={`p-3 rounded-xl font-bold flex items-center gap-2 ${
                activeTab === "docs" ? "bg-emerald-800 text-white" : ""
              }`}
            >
              <FileCode2 className="w-4 h-4" /> Architecture specs
            </button>
          </div>
        )}
      </header>

      {/* CENTRAL CORE WRAPPER SECTION */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-160px)]">
        <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-800"></div></div>}>
          {activeTab === "store" && (
            <CustomerStore 
              products={products}
              events={events}
              cmsPosts={cmsPosts}
              onAddOrder={handleAddNewOrder}
              onRegisterEvent={handleRegisterEventSeat}
              onUpdateProductStock={handleUpdateProductStock}
            />
          )}

          {activeTab === "admin" && (
            <AdminConsole 
              products={products}
              orders={orders}
              tickets={tickets}
              campaigns={campaigns}
              cmsPosts={cmsPosts}
              devLogs={devLogs}
              anomalies={anomalies}
              seoConfig={seoConfig}
              onUpdateInventory={setProducts}
              onUpdateOrders={setOrders}
              onUpdateCampaigns={setCampaigns}
              onUpdateCMS={setCmsPosts}
              onUpdateSEO={setSeoConfig}
              onResolveAnomaly={handleResolveAnomaly}
            />
          )}

          {activeTab === "docs" && (
            <ArchitectureDocs />
          )}
        </Suspense>
      </main>

      {/* GLOBAL BRAND FOOTER SIGNALS */}
      <footer className="border-t border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950/60 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 select-none">
                <div className="w-8 h-8 rounded bg-gradient-to-br from-emerald-800 to-lime-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                  A
                </div>
                <span className="font-extrabold tracking-tight text-emerald-850 dark:text-lime-400 uppercase">ALOEFLORA</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Quality, Affordable & Natural Products.<br/>
                Locally sourced. Zero toxic components. Pure, intense hydration for Kenyan curls and skin.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                <li><button onClick={() => setActiveTab("store")} className="hover:text-emerald-600 transition">Shop Products</button></li>
                <li><a href="#events-marketing-section" className="hover:text-emerald-600 transition">Events & Workshops</a></li>
                <li><button className="hover:text-emerald-600 transition">Track Order</button></li>
                <li><button className="hover:text-emerald-600 transition">Return Policy</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-4">Contact Info</h4>
              <ul className="space-y-3 text-xs text-gray-500 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Nairobi CBD Depot, Kenya</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-700 shrink-0" />
                  <a href="tel:+254702283637" className="hover:text-emerald-600 transition">+254 702 283 637</a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-700 shrink-0" />
                  <a href="mailto:obondodoris@gmail.com" className="hover:text-emerald-600 transition">obondodoris@gmail.com</a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-4">Social Media</h4>
              <div className="flex gap-4">
                <a href="https://www.instagram.com/aloefloraproducts?igsh=YzljYTk1ODg3Zg==" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-800 dark:text-lime-400 hover:bg-emerald-100 transition">
                  <span className="font-bold text-xs">IG</span>
                </a>
                <a href="https://www.facebook.com/aloefloraproducts" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-800 dark:text-lime-400 hover:bg-emerald-100 transition">
                  <span className="font-bold text-xs">FB</span>
                </a>
                <a href="https://wa.me/254702283637" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-800 dark:text-lime-400 hover:bg-emerald-100 transition">
                  <span className="font-bold text-xs">WA</span>
                </a>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-800/60 text-[10px] text-gray-400 font-mono">
            <span>© {new Date().getFullYear()} ALOEFLORA Kenya. All rights reserved.</span>
            <div className="flex flex-wrap gap-4 mt-4 md:mt-0">
              <span>DB ENGINE: PostgreSQL RLS</span>
              <span>•</span>
              <span>SSL TRG: AES_256_GCM</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
