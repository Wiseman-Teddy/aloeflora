import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  X
} from "lucide-react";
import { exportToPDF } from "../utils/exportUtils";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-hot-toast";
import { Order, Product, BookingEvent, SupportTicket } from "../types";
import MediaUploader from "./MediaUploader";

interface UserDashboardProps {
  orders: Order[];
  products: Product[];
  events?: BookingEvent[];
  onAddTicket?: (ticket: SupportTicket) => void;
}

export default function UserDashboard({ orders, products, events = [], onAddTicket }: UserDashboardProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"dashboard" | "orders" | "events" | "wishlist" | "profile" | "support">("dashboard");

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

  const handleSignOut = () => {
    signOut();
    navigate("/store");
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
    const rows = order.items.map(item => [
      item.productName,
      `KES ${item.price}`,
      String(item.quantity),
      `KES ${item.price * item.quantity}`
    ]);
    rows.push(["", "", "Total", `KES ${order.total}`]);

    exportToPDF(
      `Invoice_${order.id}`,
      `Invoice - ALOEFLORA Order #${order.id.slice(0, 8).toUpperCase()}`,
      ["Product", "Unit Price", "Quantity", "Subtotal"],
      rows
    );
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
    { id: "orders", label: "My Orders", icon: ShoppingBag },
    { id: "events", label: "Event Bookings", icon: Calendar },
    { id: "wishlist", label: "Wishlist", icon: Heart },
    { id: "profile", label: "Beauty Profile", icon: Settings },
    { id: "support", label: "Consultations", icon: MessageSquare },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6 bg-white dark:bg-gray-950 min-h-screen pt-4">
      
      {/* SIDEBAR */}
      <div className="w-full md:w-64 shrink-0 space-y-1 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 pr-4 pb-12">
        <div className="px-4 py-3 mb-4 hidden md:block">
          <div className="flex items-center gap-2">
            <div className="bg-white p-0.5 rounded-xl shadow-sm border border-emerald-900/10 dark:border-gray-800">
              <img src="/logo.jpeg" alt="ALOEFLORA Logo" className="h-8 w-auto object-contain rounded-lg" />
            </div>
            <span className="font-extrabold tracking-tight text-emerald-800 dark:text-lime-400 uppercase text-lg">ALOEFLORA PRODUCTS</span>
          </div>
        </div>
        
        {sidebarLinks.map((link) => {
          const Icon = link.icon;
          const isActive = activeTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => setActiveTab(link.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                isActive 
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" 
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-emerald-600" : ""}`} />
              {link.label}
            </button>
          );
        })}

        <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20 transition"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>

        {/* Special Offer Banner inside Sidebar */}
        <div className="mt-8 bg-gradient-to-br from-emerald-600 to-lime-500 rounded-2xl p-5 text-white shadow-lg shadow-emerald-900/20 mx-2">
          <div className="font-bold mb-1 flex items-center gap-1">Special Offer ✨</div>
          <p className="text-xs text-emerald-50 mb-4 leading-relaxed">
            Get 20% off on your next organic hair care purchase.
          </p>
          <Link to="/store#organic-formulations" className="block text-center bg-white text-emerald-800 font-bold text-xs py-2 rounded-lg hover:bg-emerald-50 transition">
            Shop Now
          </Link>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 pb-12 max-w-5xl">
        
        {activeTab === "dashboard" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Greeting */}
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Welcome back, {name.split(' ')[0]}! 👋</h2>
              <p className="text-sm text-gray-500 mt-1">Here's what's happening with your account today.</p>
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
                    <h3 className="font-bold text-gray-900 dark:text-white">My Reports</h3>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                    Generate a PDF report of your historical spending trends and saved addresses.
                  </p>
                  <button onClick={handleDownloadSpendingReport} className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                    <Download className="w-4 h-4" /> Download Report
                  </button>
                </div>

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
                  }} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition">
                    Refer Now
                  </button>
                </div>
              </div>

              {/* Help & Support */}
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl flex items-center gap-6 shadow-sm">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Need Help?</h3>
                  <p className="text-xs text-gray-500 mt-1 mb-3">Our support team is here to assist you with any questions.</p>
                  <button onClick={() => setActiveTab("support")} className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-bold text-xs px-4 py-2 rounded-lg transition">
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
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6">Order History</h2>
            <div className="space-y-4">
              {userOrders.map(order => (
                <div key={order.id} className="flex flex-col"><div className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-100 dark:border-gray-800 rounded-2xl transition">
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
                  <div className="flex items-center justify-between md:justify-end gap-6 md:w-1/3">
                    <div className="flex items-center gap-2">
                      <div className={`text-xs font-bold px-3 py-1 rounded-full ${
                      order.deliveryStatus === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
                      order.deliveryStatus === 'pending' ? 'bg-amber-50 text-amber-700' :
                      order.deliveryStatus === 'dispatched' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
                    }`}>
                      </div>
                    </div>
                    <div className="text-sm font-extrabold text-gray-900 dark:text-white">
                      KES {order.total.toLocaleString()}
                    </div>
                    <div className="ml-2">
                      <button 
                        onClick={() => handleDownloadInvoice(order)}
                        className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Download Invoice PDF"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">Invoice</span>
                      </button>
                      {order.deliveryStatus === 'pending' && (
                        <button 
                          onClick={() => handleCancelOrder(order.id)}
                          className="bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ml-2"
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
                          className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ml-2"
                        >
                          <Star className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">Review</span>
                        </button>
                      )}
                      {order.deliveryStatus === 'delivered' && (
                        <button 
                          onClick={() => handleRequestReturn(order.id)}
                          className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ml-2"
                        >
                          <span className="hidden md:inline">Return</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {expandedOrder === order.id && (
                  <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 mt-[-1rem] rounded-b-2xl ml-4 mr-4 animate-in fade-in slide-in-from-top-2">
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
                )}
              </div>
              ))}
              {userOrders.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p>You haven't placed any orders yet.</p>
                  <Link to="/store#organic-formulations" className="inline-block mt-4 text-emerald-600 font-bold hover:underline">Start Shopping</Link>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "events" && (
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm animate-in fade-in duration-200">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Event Bookings</h2>
            <p className="text-sm text-gray-500 mb-6">Manage your upcoming masterclasses and beauty consultations.</p>
            
            <div className="space-y-4">
              {userEvents.map(evt => {
                const dateObj = new Date(evt.date);
                const month = dateObj.toLocaleString('default', { month: 'short' });
                const day = dateObj.getDate();
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
                        <button onClick={() => handleDownloadTicket(evt)} className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition">Download Ticket</button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {userEvents.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p>You haven't booked any masterclasses or events.</p>
                  <Link to="/store#events-marketing-section" className="inline-block mt-4 text-emerald-600 font-bold hover:underline">Explore Events</Link>
                </div>
              )}
            </div>
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
    </div>
  );
}

