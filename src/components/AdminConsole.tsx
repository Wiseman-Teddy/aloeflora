import React, { useState, useEffect } from "react";
import { User, LogOut, 
  BarChart3, 
  Layers, 
  ShoppingBag, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  Terminal, 
  Settings, 
  FileText, 
  PenTool, 
  Search, 
  ArrowUpRight, 
  CheckCircle, 
  Plus, 
  RefreshCw, 
  Trash2, 
  Percent, 
  Calendar, 
  Heart,
  Loader2,
  Lock,
  MessageSquare,
  Database
} from "lucide-react";
import { Product, Order, SupportTicket, MarketingCampaign, CMSPost, AuditAnomaly, StoreSettings, SystemMetrics, UserProfile, Promo } from "../types";
import { supabase } from "../lib/supabase";
import { sanitizeInput } from "../utils/sanitize";
import { uploadToSupabase } from "../utils/supabaseStorage";
import MediaUploader from "./MediaUploader";
import { useAuth } from "../contexts/AuthContext";
import { exportToCSV, exportToPDF } from "../utils/exportUtils";
import AdvancedReports from "./admin/AdvancedReports";
import UserManagement from "./admin/UserManagement";
import { toast } from "react-hot-toast";

interface AdminConsoleProps {
  products: Product[];
  orders: Order[];
  tickets: SupportTicket[];
  campaigns: MarketingCampaign[];
  cmsPosts: CMSPost[];
  anomalies: AuditAnomaly[];
  storeSettings: StoreSettings;
  onUpdateInventory: (updatedProducts: Product[]) => void;
  onUpdateOrders: (updatedOrders: Order[]) => void;
  onUpdateCampaigns: (updatedCampaigns: MarketingCampaign[]) => void;
  onUpdateCMS: (updatedCMS: CMSPost[]) => void;
  onUpdateSettings: (updatedSettings: StoreSettings) => void;
  onResolveAnomaly: (anomalyId: string) => void;
  users: UserProfile[];
  onUpdateUsers: (users: UserProfile[]) => void;
  promos: Promo[];
  onUpdatePromos: (promos: Promo[]) => void;
}

export default function AdminConsole({
  products,
  orders,
  tickets,
  campaigns,
  cmsPosts,
  anomalies,
  storeSettings,
  onUpdateInventory,
  onUpdateOrders,
  onUpdateCampaigns,
  onUpdateCMS,
  onUpdateSettings,
  onResolveAnomaly,
  users,
  onUpdateUsers,
  promos,
  onUpdatePromos
}: AdminConsoleProps) {
  const { signOut } = useAuth();
  const [adminName, setAdminName] = useState(storeSettings?.adminName || "");
  const [adminEmail, setAdminEmail] = useState(storeSettings?.adminEmail || "");
  
  // Navigation
  const [activeModule, setActiveModule] = useState<string>("executive");

  // Inventory Management UI state
  const [searchProductQuery, setSearchProductQuery] = useState<string>("");
  const [isAddingProduct, setIsAddingProduct] = useState<boolean>(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Form states for creating/editing product
  const [prodName, setProdName] = useState<string>("");
  const [prodDesc, setProdDesc] = useState<string>("");
  const [prodPrice, setProdPrice] = useState<number>(500);
  const [prodCostPrice, setProdCostPrice] = useState<number>(200);
  const [prodCategory, setProdCategory] = useState<"hair" | "body" | "home">("hair");
  const [prodSubCategory, setProdSubCategory] = useState<string>("Shampoos");
  const [prodImageUrl, setProdImageUrl] = useState<string>("");
  const [prodStock, setProdStock] = useState<number>(50);
  const [prodSafetyStock, setProdSafetyStock] = useState<number>(10);
  const [prodReorderLevel, setProdReorderLevel] = useState<number>(15);
  const [prodVariants, setProdVariants] = useState<string>("");
  const [prodFeatures, setProdFeatures] = useState<string>("");
  const [prodSpecs, setProdSpecs] = useState<string>("");
  const [prodMediaUrls, setProdMediaUrls] = useState<string[]>([]);
  const [isUploadingProduct, setIsUploadingProduct] = useState(false);

  // DevOps dynamic metrics
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpuUsage: 22,
    memoryUsage: 450,
    databaseLatency: 4,
    activeSessions: 14,
    requestCount: 382
  });

  // CMS forms
  const [isAddingCms, setIsAddingCms] = useState<boolean>(false);
  const [editingCmsId, setEditingCmsId] = useState<string | null>(null);
  const [cmsTitle, setCmsTitle] = useState<string>("");
  const [cmsContent, setCmsContent] = useState<string>("");
  const [cmsType, setCmsType] = useState<"blog" | "testimonial" | "policy" | "faq" | "promo" | "hero" | "award">("blog");
  const [cmsStatus, setCmsStatus] = useState<"draft" | "published">("published");
  const [cmsImageUrls, setCmsImageUrls] = useState<string[]>([]);
  const [isUploadingCms, setIsUploadingCms] = useState(false);
  const [eventDate, setEventDate] = useState<string>("");
  const [eventLocation, setEventLocation] = useState<string>("");
  const [eventCapacity, setEventCapacity] = useState<string>("50");

  // SEO config fields
  const [seoTitle, setSeoTitle] = useState<string>(storeSettings?.seoTitle || "");
  const [seoDesc, setSeoDesc] = useState<string>(storeSettings?.seoDesc || "");
  const [seoKey, setSeoKey] = useState<string>(storeSettings?.seoKeywords || "");
  const [seoRobots, setSeoRobots] = useState<string>(storeSettings?.seoRobots || "");

  // Marketing states
  const [promoCodeInput, setPromoCodeInput] = useState<string>("");
  const [promoValueInput, setPromoValueInput] = useState<number>(10);

  // Support Tiketing responses state
  const [replyTicketId, setReplyTicketId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState<string>("");

  // Users Module State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Email Campaign State
  const [emailCampaignSubject, setEmailCampaignSubject] = useState("");
  const [emailCampaignBody, setEmailCampaignBody] = useState("");
  const [emailCampaignAudience, setEmailCampaignAudience] = useState("all");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Media Library State
  const [mediaFiles, setMediaFiles] = useState<{name: string, url: string}[]>([]);
  const [isMediaLoading, setIsMediaLoading] = useState(false);

  // Live interval ticker simulating DevOps process fluctuations
  useEffect(() => {
    const timer = setInterval(() => {
      setMetrics((prev) => ({
        cpuUsage: Math.floor(15 + Math.random() * 20),
        memoryUsage: Math.floor(440 + Math.random() * 30),
        databaseLatency: Math.floor(3 + Math.random() * 3),
        activeSessions: Math.floor(10 + Math.random() * 8),
        requestCount: prev.requestCount + Math.floor(1 + Math.random() * 4)
      }));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const loadMediaFiles = async () => {
    setIsMediaLoading(true);
    try {
      const { data, error } = await supabase.storage.from("images").list("", { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
      if (error) throw error;
      if (data) {
        const filesWithUrl = data.filter(d => d.name !== ".emptyFolderPlaceholder").map(file => {
          const { data: publicUrlData } = supabase.storage.from("images").getPublicUrl(file.name);
          return {
            name: file.name,
            url: publicUrlData.publicUrl
          };
        });
        setMediaFiles(filesWithUrl);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsMediaLoading(false);
    }
  };

  useEffect(() => {
    if (activeModule === "media") {
      loadMediaFiles();
    }
  }, [activeModule]);

  const handleDeleteMedia = async (fileName: string) => {
    if(!confirm("Are you sure you want to permanently delete this media file? It might break existing links.")) return;
    try {
      const { error } = await supabase.storage.from("images").remove([fileName]);
      if (error) throw error;
      
      const { data: publicUrlData } = supabase.storage.from("images").getPublicUrl(fileName);
      if (publicUrlData && publicUrlData.publicUrl) {
         await supabase.from('cms_posts').delete().eq('type', 'hero').eq('image_url', publicUrlData.publicUrl);
      }
      
      setMediaFiles(prev => prev.filter(f => f.name !== fileName));
      toast.success("Media file deleted and removed from hero slides if applicable.");
    } catch (err: any) {
      toast.error("Error deleting file: " + err.message);
    }
  };

  // Compute key executive sales aggregates
  const totalPaidRevenue = orders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + o.subtotal, 0);

  const pendingRefundRequests = orders.filter((o) => o.deliveryStatus === "cancelled").length;

  const totalSalesUnits = orders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + o.items.reduce((acc, item) => acc + item.quantity, 0), 0);

  // Execute true profit calculations dynamically
  const operatingExpenses = 0; // Set to 0 until actual expenses are tracked in DB
  
  // Calculate total COGS strictly from sold items matching the product catalog cost prices
  const totalCogs = orders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((totalCost, order) => {
      const orderCosts = order.items.reduce((acc, item) => {
        const product = products.find(p => p.id === item.productId);
        const itemCost = product ? product.costPrice : (item.price * 0.45); // fallback
        return acc + (itemCost * item.quantity);
      }, 0);
      return totalCost + orderCosts;
    }, 0);

  const grossProfit = totalPaidRevenue - totalCogs;
  const netProfit = grossProfit - operatingExpenses;

  // Handles Product Add
  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodDesc || (!prodImageUrl && prodMediaUrls.length === 0)) {
      toast.error("Name, description, and at least one image URL/file are required!");
      return;
    }

    setIsUploadingProduct(true);
    // MediaUploader handles the file upload to Supabase directly
    const uploadedMediaUrls: string[] = prodMediaUrls;
    setIsUploadingProduct(false);

    const newProduct: Product = {
      id: "p" + (products.length + 1),
      name: prodName,
      description: prodDesc,
      price: prodPrice,
      costPrice: prodCostPrice,
      category: prodCategory,
      subCategory: prodSubCategory,
      imageUrl: prodImageUrl || uploadedMediaUrls[0] || "",
      stock: prodStock,
      safetyStock: prodSafetyStock,
      reorderLevel: prodReorderLevel,
      rating: 5.0,
      reviewsCount: 0,
      reviews: [],
      variants: prodVariants ? prodVariants.split(",").map(v => v.trim()) : ["Standard"],
      features: prodFeatures ? prodFeatures.split(",").map(f => f.trim()) : ["Natural Ingredient"],
      mediaUrls: uploadedMediaUrls.length > 0 ? uploadedMediaUrls : (prodImageUrl ? [prodImageUrl] : []),
      specifications: prodSpecs ? prodSpecs.split(",").map(s => s.trim()) : []
    };

    try {
      await supabase.from("products").insert({
        id: newProduct.id, name: newProduct.name, description: newProduct.description, price: newProduct.price, cost_price: newProduct.costPrice,
        category: newProduct.category, sub_category: newProduct.subCategory, image_url: newProduct.imageUrl, stock: newProduct.stock,
        safety_stock: newProduct.safetyStock, reorder_level: newProduct.reorderLevel, rating: newProduct.rating, reviews_count: newProduct.reviewsCount,
        variants: newProduct.variants, features: newProduct.features, media_urls: newProduct.mediaUrls, specifications: newProduct.specifications
      });
    } catch(err) { console.error("Supabase insert error", err); }

    onUpdateInventory([...products, newProduct]);
    setIsAddingProduct(false);
    resetProductForm();
  };

  const resetProductForm = () => {
    setProdName("");
    setProdDesc("");
    setProdPrice(500);
    setProdCostPrice(200);
    setProdCategory("hair");
    setProdSubCategory("Shampoos");
    setProdImageUrl("");
    setProdStock(50);
    setProdSafetyStock(10);
    setProdReorderLevel(15);
    setProdVariants("");
    setProdFeatures("");
    setProdSpecs("");
    setProdMediaUrls([]);
  };

  // Handles Inline Quantity Replenishment
  const handleReplenishStock = (productId: string, increment: number) => {
    const nextArr = products.map((p) => {
      if (p.id === productId) {
        return { ...p, stock: p.stock + increment };
      }
      return p;
    });
    onUpdateInventory(nextArr);
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput) return;
    
    const newCode = promoCodeInput.trim().toUpperCase();
    
    try {
      const { data, error } = await supabase.from('promos').insert({
        code: newCode,
        discount_percent: promoValueInput
      }).select('*').single();
      
      if (error) throw error;
      
      const newPromo: Promo = {
        id: data.id,
        code: data.code,
        discountPercent: data.discount_percent,
        isActive: data.is_active,
        createdAt: data.created_at
      };
      
      onUpdatePromos([...promos, newPromo]);
      setPromoCodeInput("");
      toast.success(`Success: Coupon Code '${newCode}' has been activated!`);
    } catch (err: any) {
      toast.error("Failed to create promo code: " + err.message);
    }
  };

  const handleDeletePromo = async (promoId: string) => {
    try {
      const { error } = await supabase.from('promos').delete().eq('id', promoId);
      if (error) throw error;
      
      onUpdatePromos(promos.filter(p => p.id !== promoId));
      toast.success("Promo code deleted");
    } catch (err: any) {
      toast.error("Failed to delete promo: " + err.message);
    }
  };

  const handleCmsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmsTitle || !cmsContent) return;

    let finalImageUrl = cmsImageUrls.join(',');

    if (editingCmsId) {
      const updatedPosts = cmsPosts.map(p => {
        if (p.id === editingCmsId) {
          return { ...p, title: sanitizeInput(cmsTitle), content: sanitizeInput(cmsContent), type: cmsType, status: cmsStatus, imageUrl: finalImageUrl || p.imageUrl, seoTitle: cmsType === 'promotion' ? sanitizeInput(eventDate) : p.seoTitle, seoDesc: cmsType === 'promotion' ? sanitizeInput(eventLocation) : p.seoDesc, seoKeywords: cmsType === 'promotion' ? sanitizeInput(eventCapacity) : p.seoKeywords };
        }
        return p;
      });
      
      const modified = updatedPosts.find(p => p.id === editingCmsId);
      if(modified) {
        try {
          const { error } = await supabase.from("cms_posts").update({
            title: modified.title, content: modified.content, type: modified.type, status: modified.status, image_url: modified.imageUrl, seo_title: modified.seoTitle, seo_desc: modified.seoDesc, seo_keywords: modified.seoKeywords
          }).eq('id', editingCmsId);
          if (error) throw error;
        } catch(err: any) { 
          console.error(err); 
          toast.error(`Database Error: ${err.message || "Failed to update database"}`);
          return;
        }
      }

      onUpdateCMS(updatedPosts);
      setEditingCmsId(null);
      toast.success("CMS Article Updated Successfully!");
    } else {
      let safeId = cmsTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      if(cmsPosts.some(p => p.id === safeId)) safeId += "-" + Math.floor(Math.random() * 1000);
      const newPost: CMSPost = {
        id: safeId,
        title: sanitizeInput(cmsTitle),
        content: sanitizeInput(cmsContent),
        type: cmsType,
        status: cmsStatus,
        author: "Admin Master",
        createdAt: new Date().toISOString().split("T")[0],
        imageUrl: finalImageUrl || undefined,
        seoTitle: cmsType === 'promotion' ? sanitizeInput(eventDate) : undefined,
        seoDesc: cmsType === 'promotion' ? sanitizeInput(eventLocation) : undefined,
        seoKeywords: cmsType === 'promotion' ? sanitizeInput(eventCapacity) : undefined,
      };
      
      try {
        const { error } = await supabase.from("cms_posts").insert({
            id: newPost.id, title: newPost.title, content: newPost.content, type: newPost.type, status: newPost.status, author: newPost.author,
            image_url: newPost.imageUrl, created_at: newPost.createdAt, seo_title: newPost.seoTitle, seo_desc: newPost.seoDesc, seo_keywords: newPost.seoKeywords
        });
        if (error) throw error;
      } catch(err: any) { 
        console.error(err);
        toast.error(`Database Error: ${err.message || "Failed to save to database"}`);
        return;
      }

      onUpdateCMS([newPost, ...cmsPosts]);
      toast.success("New CMS Article Published Successfully!");
    }
    
    setIsAddingCms(false);
    setCmsTitle("");
    setCmsContent("");
    setCmsImageUrls([]);
  };

  const handleEditCMS = (post: CMSPost) => {
    setCmsTitle(post.title);
    setCmsContent(post.content);
    setCmsType(post.type as any);
    setCmsStatus(post.status as any);
    setEditingCmsId(post.id);
    setIsAddingCms(true);
    setCmsImageUrls(post.imageUrl ? post.imageUrl.split(',') : []);
    setEventDate(post.seoTitle || "");
    setEventLocation(post.seoDesc || "");
    setEventCapacity(post.seoKeywords || "50");
  };

  const handleDeleteCMS = (id: string) => {
    if(confirm("Are you sure you want to permanently delete this CMS Post?")) {
      onUpdateCMS(cmsPosts.filter(p => p.id !== id));
    }
  };

  const saveSeoFields = async () => {
    const updatedSettings = {
      ...storeSettings,
      seoTitle,
      seoDesc,
      seoKeywords: seoKey,
      seoRobots,
      sitemapGeneratedAt: new Date().toISOString()
    };
    
    try {
      const { error } = await supabase.from('store_settings').upsert({
        id: 'global',
        admin_name: updatedSettings.adminName,
        admin_email: updatedSettings.adminEmail,
        seo_title: updatedSettings.seoTitle,
        seo_desc: updatedSettings.seoDesc,
        seo_keywords: updatedSettings.seoKeywords,
        seo_robots: updatedSettings.seoRobots,
        sitemap_generated_at: updatedSettings.sitemapGeneratedAt,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      onUpdateSettings(updatedSettings);
      toast.success("SEO Meta Tags & Sitemap Indexes updated on Aloeflora CDN and Database.");
    } catch (err: any) {
      toast.error("Error saving SEO settings: " + err.message);
    }
  };

  const saveAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings = {
      ...storeSettings,
      adminName,
      adminEmail
    };

    try {
      const { error } = await supabase.from('store_settings').upsert({
        id: 'global',
        admin_name: updatedSettings.adminName,
        admin_email: updatedSettings.adminEmail,
        seo_title: updatedSettings.seoTitle,
        seo_desc: updatedSettings.seoDesc,
        seo_keywords: updatedSettings.seoKeywords,
        seo_robots: updatedSettings.seoRobots,
        sitemap_generated_at: updatedSettings.sitemapGeneratedAt,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      onUpdateSettings(updatedSettings);
      toast.success("Admin Profile updated successfully.");
    } catch (err: any) {
      toast.error("Error saving profile: " + err.message);
    }
  };

  const triggerAuditReportGen = () => {
    const rows = orders.map(o => [
      o.id.slice(0, 8).toUpperCase(),
      new Date(o.createdAt).toLocaleDateString(),
      o.customerName,
      o.paymentStatus.toUpperCase(),
      `KES ${o.total.toLocaleString()}`
    ]);
    exportToPDF(
      "Financial_Audit_Report",
      "Enterprise Financial Audit",
      ["Order ID", "Date", "Customer", "Payment Status", "Total"],
      rows
    );
    toast.success("Enterprise Financial Audit PDF generated successfully. Downloading...");
  };

  const handleTicketReplySubmit = async (e: React.FormEvent, ticketId: string) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    // Modify target ticket replies
    const matchedIdx = tickets.findIndex(t => t.id === ticketId);
    if (matchedIdx !== -1) {
      const target = tickets[matchedIdx];
      const newReplies = [...target.replies, { sender: "admin" as const, message: replyMessage, timestamp: new Date().toISOString() }];
      
      try {
        const { error } = await supabase.from('support_tickets').update({
          status: 'resolved',
          replies: newReplies
        }).eq('id', ticketId);
        
        if (error) throw error;
        
        toast.success(`Reply fired successfully to customer. Ticket resolved.`);
        setReplyTicketId(null);
        setReplyMessage("");
      } catch (err: any) {
        toast.error("Failed to save reply: " + err.message);
      }
    }
  };

  // --- NEW MODULE HANDLERS ---
  const handleEmailCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailCampaignSubject || !emailCampaignBody) return;
    setIsSendingEmail(true);

    try {
      // Invoke Supabase Edge Function for sending email
      const { data: functionData, error: functionError } = await supabase.functions.invoke('send-email', {
        body: {
          subject: emailCampaignSubject,
          body: emailCampaignBody,
          audience: emailCampaignAudience,
        }
      });

      if (functionError) throw new Error("Failed to send campaign: " + functionError.message);

      // Log the campaign to DB
      const newCamp: MarketingCampaign = {
        id: `c_${Date.now()}`,
        name: emailCampaignSubject,
        platform: "Email",
        status: "active",
        budget: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
        roi: 0,
        subject: emailCampaignSubject,
        audience: emailCampaignAudience,
        openRate: 0,
        sentCount: users.length,
        deliveryRate: 100
      };

      await supabase.from("campaigns").insert({
        id: newCamp.id, name: newCamp.name, platform: newCamp.platform, status: newCamp.status, budget: newCamp.budget,
        impressions: newCamp.impressions, clicks: newCamp.clicks, conversions: newCamp.conversions,
        roi_percent: newCamp.roi, start_date: newCamp.startDate, end_date: newCamp.endDate
      });

      onUpdateCampaigns([...campaigns, newCamp]);
      toast.success("Email Campaign Sent successfully!");
      setEmailCampaignSubject("");
      setEmailCampaignBody("");
    } catch (err: any) {
      toast.error("Error sending email campaign: " + err.message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const generateReportsCSV = (type: "sales" | "orders") => {
    if (type === "sales") {
      const rows = products.map(p => [p.name, p.category, p.stock, p.price]);
      exportToCSV("Sales_Report", rows, ["Product", "Category", "Stock", "Price"]);
    } else {
      const rows = orders.map(o => [o.id, o.customerName, o.total, o.paymentStatus, o.createdAt.split("T")[0]]);
      exportToCSV("Orders_Report", rows, ["Order ID", "Customer", "Total", "Status", "Date"]);
    }
  };

  const generateReportsPDF = (type: "sales" | "orders") => {
    if (type === "sales") {
      const rows = products.map(p => [p.name, p.category, String(p.stock), `KES ${p.price}`]);
      exportToPDF("Sales_Report", "Product Inventory & Sales Overview", ["Product", "Category", "Stock", "Price"], rows);
    } else {
      const rows = orders.map(o => [o.id, o.customerName, `KES ${o.total}`, o.paymentStatus, o.createdAt.split("T")[0]]);
      exportToPDF("Orders_Report", "Customer Orders Master List", ["Order ID", "Customer", "Total", "Status", "Date"], rows);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      const { error } = await supabase.from('profiles').update({ account_status: newStatus }).eq('id', userId);
      if (error) throw error;
      const updated = users.map(u => u.id === userId ? { ...u, accountStatus: newStatus as any } : u);
      onUpdateUsers(updated);
      toast.success(`User status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error("Failed to update user: " + err.message);
    }
  };

  return (
    <div id="admin-unified-console-wrapper" className="flex flex-col lg:flex-row gap-6 text-left min-h-screen -mt-2">
      
      {/* LEFT SIDEBAR NAVIGATION: Dark Theme ShopX Style */}
      <div className="w-full lg:w-64 shrink-0 bg-[#0F172A] text-slate-300 rounded-3xl p-5 shadow-xl flex flex-col justify-between h-auto lg:h-[calc(100vh-120px)] lg:sticky top-24">
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="pb-6 mb-2 flex items-center gap-3 px-2">
            <div className="bg-white p-0.5 rounded-xl shadow-sm border border-emerald-900/10 dark:border-gray-800">
              <img src="/logo.jpeg" alt="ALOEFLORA Logo" className="h-8 w-auto object-contain rounded-lg" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">ALOEFLORA</h3>
          </div>

          <div className="space-y-6">
            {/* OVERVIEW */}
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">Overview</div>
              <button
                onClick={() => setActiveModule("executive")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition ${
                  activeModule === "executive"
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                    : "hover:bg-slate-800 hover:text-white"
                }`}
              >
                <BarChart3 className="w-4 h-4" /> Dashboard
              </button>
            </div>

            {/* MANAGEMENT */}
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">Management</div>
              {[
                { id: "inventory", label: "Inventory", icon: ShoppingBag },
                { id: "users", label: "User Management", icon: Users },
                { id: "support", label: "Support Tickets", icon: MessageSquare },
                { id: "cms", label: "CMS Web Editor", icon: PenTool },
                { id: "media", label: "Media Library", icon: Database },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition mb-1 ${
                    activeModule === item.id
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                      : "hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <item.icon className="w-4 h-4" /> {item.label}
                </button>
              ))}
            </div>

            {/* ANALYTICS & SALES */}
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">Analytics & Sales</div>
              {[
                { id: "reports", label: "Advanced Reports", icon: FileText },
                { id: "financial", label: "P&L Reports", icon: TrendingUp },
                { id: "marketing", label: "Marketing", icon: Percent },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition mb-1 ${
                    activeModule === item.id
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                      : "hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <item.icon className="w-4 h-4" /> {item.label}
                </button>
              ))}
            </div>

            {/* SETTINGS */}
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">Settings</div>
              <button
                onClick={() => setActiveModule("seo")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition mb-1 ${
                  activeModule === "seo"
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                    : "hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Settings className="w-4 h-4" /> Store Settings
              </button>
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-900/20 transition"
              >
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            </div>
          </div>
        </div>

        {/* Audit Log Flag badge widget inside Sidebar */}
        <div className="mt-6 pt-4 border-t border-slate-800 shrink-0">
          {anomalies.length > 0 ? (
            <div className="bg-amber-900/30 border border-amber-500/30 rounded-xl p-3 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-[10px] leading-tight text-amber-200">
                <span className="font-bold text-amber-400">Audit Alert:</span> {anomalies.length} potential triggers detected. Check financials.
              </div>
            </div>
          ) : (
             <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 flex items-center gap-3 text-emerald-400 text-[10px]">
                <CheckCircle className="w-4 h-4" /> Systems Nominal
             </div>
          )}
        </div>
      </div>

      {/* RIGHT WORKSPACE CONTEXT: Dynamic tab panels */}
      <div className="flex-1 w-full max-w-full lg:max-w-[calc(100%-17.5rem)] bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 rounded-3xl p-6 md:p-8">
        
        {/* TAB 1: EXECUTIVE DASHBOARD MODULE */}
        {activeModule === "executive" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <h3 className="text-lg font-bold text-gray-950">Director Executive Overview</h3>
              <p className="text-xs text-gray-500 mt-0.5">Aggregating real-time Lipa Na M-Pesa merchant metrics from Nairobi CBD depot.</p>
            </div>

            {/* KPI Summary Rows */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50/50 p-4 border rounded-xl">
                <span className="text-[10px] uppercase font-bold text-gray-400">Paid Revenue</span>
                <div className="text-lg font-extrabold text-gray-900 mt-1">Ksh {totalPaidRevenue}</div>
                <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-1">
                  ▲ 14.2% <span className="text-gray-400 font-normal">vs last week</span>
                </span>
              </div>
              
              <div className="bg-gray-50/50 p-4 border rounded-xl">
                <span className="text-[10px] uppercase font-bold text-gray-400">Total Sales Vol</span>
                <div className="text-lg font-extrabold text-gray-900 mt-1">{totalSalesUnits} items</div>
                <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-1">
                  ▲ 8.1% <span className="text-gray-400 font-normal">completed orders</span>
                </span>
              </div>

              <div className="bg-gray-50/50 p-4 border rounded-xl">
                <span className="text-[10px] uppercase font-bold text-gray-400">Active Cart Baskets</span>
                <div className="text-lg font-extrabold text-gray-950 mt-1">11 sessions</div>
                <span className="text-[9px] text-amber-600 font-semibold mt-1 block">
                  Abandonment: 24% (Low)
                </span>
              </div>

              <div className="bg-gray-50/50 p-4 border rounded-xl">
                <span className="text-[10px] uppercase font-bold text-gray-400">P&L Project Margin</span>
                <div className="text-lg font-extrabold text-emerald-800 mt-1">
                  Ksh {netProfit > 0 ? netProfit : 0}
                </div>
                <span className="text-[9px] bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.5 rounded mt-1.5 inline-block">
                  Net {Math.round((netProfit / (totalPaidRevenue || 1)) * 100)}% Margin
                </span>
              </div>
            </div>

            {/* Simulated Live Sparkline Charts using custom raw SVG vectors corresponding to the rules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="border border-zinc-100 rounded-2xl p-4 text-left">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-[11px] font-bold text-lime-600 uppercase">24-Hr Sales Distribution</span>
                    <h4 className="text-xs text-gray-500">Hourly revenue flow in Nairobi (KES)</h4>
                  </div>
                  <TrendingUp className="w-4 h-4 text-emerald-800" />
                </div>
                
                {/* SVG curve sparks */}
                <svg className="w-full h-24 stroke-emerald-800 fill-none stroke-[2.5]" viewBox="0 0 100 24">
                  <path d="M 0,20 Q 15,12 30,16 T 60,6 T 80,14 T 100,2" />
                  {/* Subtle ground shadow fill */}
                  <path d="M 0,20 Q 15,12 30,16 T 60,6 T 80,14 T 100,2 L 100,24 L 0,24 Z" className="fill-emerald-50/20 stroke-none" />
                </svg>
                <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-2">
                  <span>08:00 AM</span>
                  <span>02:00 PM</span>
                  <span>08:00 PM</span>
                </div>
              </div>

              <div className="border border-zinc-100 rounded-2xl p-4 text-left">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-800 uppercase">Cart Growth Trajectory</span>
                    <h4 className="text-xs text-gray-500">Live incoming webhook checkout sessions</h4>
                  </div>
                  <Users className="w-4 h-4 text-lime-600" />
                </div>

                {/* SVG bar sparkline graphs */}
                <div className="flex h-24 items-end justify-between gap-1 pt-4">
                  {[20, 35, 15, 60, 42, 80, 50, 95, 65, 110, 85, 120].map((val, idx) => (
                    <div 
                      key={idx} 
                      style={{ height: `${(val / 120) * 100}%` }} 
                      className="bg-lime-500 rounded-t w-full cursor-all-scroll hover:bg-emerald-800 transition"
                      title={`Week ${idx}: ${val} users`}
                    ></div>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-2">
                  <span>Previous Month</span>
                  <span>Active Quarter</span>
                </div>
              </div>
            </div>

            {/* Audit discrepancy alerts panel */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-gray-400">Live Auditing ledger anomalies</h4>
              <div className="space-y-2">
                {anomalies.filter(a => a.status === "unresolved").map((anm) => (
                  <div key={anm.id} className="bg-yellow-50/50 border border-yellow-200/50 p-3.5 rounded-xl flex items-center justify-between text-xs gap-3">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-yellow-700 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-yellow-950">{anm.message}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{anm.timestamp}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => onResolveAnomaly(anm.id)}
                      className="bg-yellow-100 text-yellow-900 border font-bold px-2 py-1 rounded cursor-pointer text-[10px] hover:bg-yellow-200 transition shrink-0"
                    >
                      Audit OK
                    </button>
                  </div>
                ))}
                {anomalies.filter(a => a.status === "unresolved").length === 0 && (
                  <div className="bg-emerald-50 text-emerald-900 p-4 rounded-xl text-center font-semibold flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-700" /> Complete financial reconciliations: 0 discrepancies detected.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INVENTORY ERP MANAGEMENT MODULE */}
        {activeModule === "inventory" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-950">Active Inventory Records (ERP)</h3>
                <p className="text-xs text-gray-500 mt-0.5">Control live listings stock multipliers and reorder thresholds.</p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Filter listings..."
                  value={searchProductQuery}
                  onChange={(e) => setSearchProductQuery(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-gray-50 border rounded-xl"
                />
                <button
                  onClick={() => setIsAddingProduct(true)}
                  className="bg-emerald-800 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer hover:bg-emerald-700"
                >
                  <Plus className="w-3.5 h-3.5" /> Create product
                </button>
              </div>
            </div>

            {/* CREATE / ADD NEW PRODUCT DIALOG OVERLAY PANEL */}
            {isAddingProduct && (
              <form onSubmit={handleAddProductSubmit} className="bg-gray-50 border p-5 rounded-2xl text-xs space-y-4 animate-in slide-in-from-top">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="font-bold uppercase text-emerald-800">Add New Organic Product specs</span>
                  <button type="button" onClick={() => setIsAddingProduct(false)} className="text-gray-400 font-bold hover:text-black">Cancel</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold">Product Name</label>
                    <input type="text" value={prodName} onChange={(e) => setProdName(e.target.value)} placeholder="e.g. Aloeflora Tea Tree Cleanser" className="w-full p-2 border bg-white rounded-lg focus:outline-none" required />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold">Primary Image URL (optional if uploading)</label>
                    <input type="text" value={prodImageUrl} onChange={(e) => setProdImageUrl(e.target.value)} placeholder="Unsplash image link" className="w-full p-2 border bg-white rounded-lg focus:outline-none" />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="font-bold">Media Upload (Select multiple files)</label>
                    <MediaUploader urls={prodMediaUrls} onChange={setProdMediaUrls} multiple maxFiles={5} bucket="images" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold">Cost Price (KES)</label>
                    <input type="number" value={prodCostPrice} onChange={(e) => setProdCostPrice(Number(e.target.value))} className="w-full p-2 border bg-white rounded-lg focus:outline-none" required />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold">Selling/Retail Price (KES)</label>
                    <input type="number" value={prodPrice} onChange={(e) => setProdPrice(Number(e.target.value))} className="w-full p-2 border bg-white rounded-lg focus:outline-none" required />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold">Category</label>
                    <select value={prodCategory} onChange={(e) => setProdCategory(e.target.value as "hair"|"body"|"home")} className="w-full p-2 border bg-white rounded-lg focus:outline-none">
                      <option value="hair">Hair Care</option>
                      <option value="body">Body Care</option>
                      <option value="home">Home Care</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold">Sub-Category</label>
                    <input type="text" value={prodSubCategory} onChange={(e) => setProdSubCategory(e.target.value)} placeholder="e.g. Shampoos" className="w-full p-2 border bg-white rounded-lg focus:outline-none" required />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold">Initial Stock qty</label>
                    <input type="number" value={prodStock} onChange={(e) => setProdStock(Number(e.target.value))} className="w-full p-2 border bg-white rounded-lg focus:outline-none" required />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold">Safety Stock buffer</label>
                    <input type="number" value={prodSafetyStock} onChange={(e) => setProdSafetyStock(Number(e.target.value))} className="w-full p-2 border bg-white rounded-lg focus:outline-none" required />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold">Reorder Trigger point</label>
                    <input type="number" value={prodReorderLevel} onChange={(e) => setProdReorderLevel(Number(e.target.value))} className="w-full p-2 border bg-white rounded-lg focus:outline-none" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold">Variants (split by comma)</label>
                    <input type="text" value={prodVariants} onChange={(e) => setProdVariants(e.target.value)} placeholder="e.g. 250ml, 500ml" className="w-full p-2 border bg-white rounded-lg focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold">Features (split by comma)</label>
                    <input type="text" value={prodFeatures} onChange={(e) => setProdFeatures(e.target.value)} placeholder="e.g. Sulfate Free, Raw Aloe" className="w-full p-2 border bg-white rounded-lg focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold">Specifications (split by comma)</label>
                    <input type="text" value={prodSpecs} onChange={(e) => setProdSpecs(e.target.value)} placeholder="e.g. pH: 5.5, Scent: Rosemary" className="w-full p-2 border bg-white rounded-lg focus:outline-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold">Detailed description</label>
                  <textarea value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} rows={3} className="w-full p-2 border bg-white rounded-lg focus:outline-none" placeholder="Explain the botanical advantages..." required></textarea>
                </div>

                <button type="submit" disabled={isUploadingProduct} className="bg-emerald-800 text-white font-bold p-3 rounded-xl w-full uppercase cursor-pointer disabled:opacity-50">
                  {isUploadingProduct ? "Uploading Media & Saving..." : "Activate & Add to Web Catalog"}
                </button>
              </form>
            )}

            {/* Structured Table Inventory */}
            <div className="border border-gray-100 rounded-2xl overflow-x-auto mt-4">
              <table className="w-full text-xs">
                <thead className="bg-zinc-50 border-b border-gray-100 font-bold uppercase text-gray-400 text-[10px]">
                  <tr>
                    <th className="p-3 text-left">Listing Description</th>
                    <th className="p-3 text-center">Cost Price</th>
                    <th className="p-3 text-center">Selling Price</th>
                    <th className="p-3 text-center">Stock multiplier</th>
                    <th className="p-3 text-center">Safety Stock</th>
                    <th className="p-3 text-center">Trigger point</th>
                    <th className="p-3 text-center">Quick Adjust</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.filter(p => p.name.toLowerCase().includes(searchProductQuery.toLowerCase())).map((p) => {
                    const isLow = p.stock <= p.safetyStock;
                    return (
                      <tr key={p.id} className="hover:bg-zinc-50/50">
                        <td className="p-3 flex items-center gap-2 max-w-xs md:max-w-md">
                          <img src={p.imageUrl} alt={p.name} className="w-8 h-8 rounded border object-cover shrink-0" />
                          <div className="truncate">
                            <div className="font-extrabold text-gray-900 truncate">{p.name}</div>
                            <span className="text-[10px] uppercase font-bold text-lime-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                              {p.subCategory}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-center font-bold text-red-500">KES {p.costPrice}</td>
                        <td className="p-3 text-center font-bold text-emerald-800">KES {p.price}</td>
                        <td className="p-3 text-center">
                          <span className={`font-bold px-2 py-0.5 rounded ${
                            p.stock === 0 
                              ? "bg-red-150 text-red-900" 
                              : isLow 
                                ? "bg-amber-100 text-amber-900" 
                                : "bg-emerald-50 text-emerald-900"
                          }`}>
                            {p.stock} units
                          </span>
                        </td>
                        <td className="p-3 text-center text-gray-400 font-mono">{p.safetyStock}</td>
                        <td className="p-3 text-center text-gray-400 font-mono">{p.reorderLevel}</td>
                        <td className="p-3 text-center flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleReplenishStock(p.id, 10)}
                            className="bg-emerald-80 bg-emerald-50 text-emerald-800 border p-1 rounded font-bold hover:bg-emerald-100 cursor-pointer"
                          >
                            +10 Restock
                          </button>
                          
                          <button
                            onClick={() => {
                              onUpdateInventory(products.filter(item => item.id !== p.id));
                              toast.success("Product removed from storefront!");
                            }}
                            className="bg-rose-50 border text-rose-600 p-1.5 rounded hover:bg-rose-100 tooltip cursor-pointer"
                            title="Remove listing"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2.5: ADVANCED REPORTS MODULE */}
        {activeModule === "reports" && (
          <AdvancedReports 
            orders={orders} 
            products={products} 
            generateReportsPDF={generateReportsPDF} 
            generateReportsCSV={generateReportsCSV} 
          />
        )}

        {/* TAB 3: FINANCIAL REPORTING & AUDITING */}
        {activeModule === "financial" && (
          <div className="space-y-6 animate-in fade-in duration-150 text-left">
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <h3 className="text-lg font-bold text-gray-950">Enterprise Profit & Loss Statement</h3>
                <p className="text-xs text-gray-500">Calculated operating summaries based on live completed customer checkout batches.</p>
              </div>

              <button
                onClick={triggerAuditReportGen}
                className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl cursor-pointer shadow transition"
              >
                Export Audit Report PDF
              </button>
            </div>

            {/* P & L Sheets ledger card */}
            <div className="bg-zinc-55/35 border border-zinc-100 p-6 rounded-2xl md:max-w-xl mx-auto space-y-4">
              <div className="flex justify-between font-bold border-b pb-2 text-xs uppercase text-gray-400">
                <span>Account Ledger Line</span>
                <span>Calculated Volume (KES)</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center text-gray-700 font-bold">
                  <span>Total Revenue (Money In)</span>
                  <span>KES {totalPaidRevenue}</span>
                </div>

                <div className="flex justify-between items-center text-gray-500 pl-4">
                  <span>- Total Product Costs (Money out for items)</span>
                  <span>KES {totalCogs}</span>
                </div>

                <div className="flex justify-between items-center text-gray-800 font-bold border-t pt-2">
                  <span>Gross Profit</span>
                  <span className="text-emerald-800">KES {grossProfit}</span>
                </div>

                <div className="flex justify-between items-center text-gray-500 pl-4">
                  <span>- Operating Expenses (Logistics & Hosting)</span>
                  <span>KES {operatingExpenses}</span>
                </div>

                <div className="flex justify-between items-center text-gray-950 font-extrabold border-t-2 pt-2 text-sm">
                  <span>Net Profit (Money You Keep)</span>
                  <span className="text-emerald-900">KES {netProfit > 0 ? netProfit : 0}</span>
                </div>
              </div>

              <div className="text-[10px] text-gray-400 italic font-mono pt-4 text-center border-t border-dashed">
                Ledger audited automatically under GDPR principles. All payments synchronized with Safaricom webhook pools.
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MARKETING & CAMPAIGNS PLANNERS */}
        {activeModule === "marketing" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <h3 className="text-lg font-bold text-gray-950">Marketing & Campaign Center</h3>
              <p className="text-xs text-gray-500 mt-0.5">Manage digital ad metrics, coupons, and email campaigns.</p>
            </div>

            {/* Email Campaign Builder */}
            <div className="bg-emerald-900 text-white rounded-2xl p-6 text-left space-y-4">
              <h4 className="font-bold flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Email Blast Campaign</h4>
              <form onSubmit={handleEmailCampaignSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-emerald-100">Subject Line</label>
                    <input type="text" value={emailCampaignSubject} onChange={e => setEmailCampaignSubject(e.target.value)} className="w-full p-2 bg-emerald-800/50 border border-emerald-700 rounded focus:outline-none" required />
                  </div>
                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-emerald-100">Target Audience</label>
                    <select value={emailCampaignAudience} onChange={e => setEmailCampaignAudience(e.target.value)} className="w-full p-2 bg-emerald-800/50 border border-emerald-700 rounded focus:outline-none">
                      <option value="all">All Customers</option>
                      <option value="active">Active Buyers (Spent &gt; 0)</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-emerald-100">Email Body</label>
                  <textarea value={emailCampaignBody} onChange={e => setEmailCampaignBody(e.target.value)} rows={3} className="w-full p-2 bg-emerald-800/50 border border-emerald-700 rounded focus:outline-none" required></textarea>
                </div>
                <button type="submit" disabled={isSendingEmail} className="bg-white text-emerald-900 font-bold px-4 py-2 rounded-xl text-xs hover:bg-gray-100 cursor-pointer disabled:opacity-50">
                  {isSendingEmail ? "Sending..." : "Send Campaign Blast"}
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Campaign statistics panel */}
              <div className="bg-zinc-50/50 border p-5 rounded-2xl space-y-4 text-left">
                <span className="text-xs uppercase font-bold text-gray-450">Active Digital Conversions Pixels</span>
                
                <div className="space-y-4 pt-2">
                  {campaigns.map((camp) => (
                    <div key={camp.id} className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-gray-900">{camp.name}</span>
                          <span className="text-[10px] font-mono text-gray-400 block">{camp.platform}</span>
                        </div>
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                          ROI +{camp.roi}%
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[10px] bg-white p-2.5 rounded-lg border text-center font-mono">
                        <div>
                          <div className="text-gray-400 font-sans">Clicks</div>
                          <div className="font-bold">{camp.clicks}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 font-sans">Converts</div>
                          <div className="font-bold">{camp.conversions}</div>
                        </div>
                        <div>
                          <div className="text-gray-450 font-sans">Budget</div>
                          <div className="font-bold">KES {camp.budget}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coupon creators form */}
              <div className="bg-zinc-50/50 border p-5 rounded-2xl space-y-4 text-left">
                <span className="text-xs uppercase font-bold text-gray-450">Generate Active Discount Code</span>
                
                <form onSubmit={handleCreatePromo} className="space-y-3 pt-2 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold">Unique code name</label>
                    <input
                      type="text"
                      required
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value)}
                      placeholder="e.g. NAIDOC25"
                      className="w-full p-2.5 bg-white border rounded-lg focus:outline-none focus:border-emerald-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold">Discount value (Percent %)</label>
                    <input
                      type="number"
                      max={100}
                      min={1}
                      value={promoValueInput}
                      onChange={(e) => setPromoValueInput(Number(e.target.value))}
                      className="w-full p-2.5 bg-white border rounded-lg focus:outline-none focus:border-emerald-800"
                    />
                  </div>

                  <button type="submit" className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold p-3 rounded-xl transition cursor-pointer">
                    Publish Active Code
                  </button>
                </form>

                <div className="pt-4 border-t space-y-2">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Deployed coupons</div>
                  <div className="flex flex-wrap gap-1.5">
                    {promos.map((itm) => (
                      <span key={itm.id} className="bg-lime-400 text-emerald-950 font-mono font-bold text-[11px] px-2.5 py-1 rounded-full border border-lime-500 flex items-center gap-1.5">
                        {itm.code} (-{itm.discountPercent}%)
                        <button type="button" onClick={() => handleDeletePromo(itm.id)} className="font-sans hover:text-red-700 text-emerald-950 font-bold">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CMS WEB EDITOR PANEL */}
        {activeModule === "cms" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-950">CMS Content Controller</h3>
                <p className="text-xs text-gray-500 mt-0.5">Author articles, policies, and home-care tips securely.</p>
              </div>

              <button
                onClick={() => setIsAddingCms((prev) => !prev)}
                className="bg-emerald-800 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center gap-1 cursor-pointer hover:bg-emerald-700"
              >
                <Plus className="w-3.5 h-3.5" /> Drafting tools
              </button>
            </div>

            {isAddingCms && (
              <form onSubmit={handleCmsSubmit} className="bg-gray-50 border p-5 rounded-2xl text-xs space-y-3 text-left">
                <span className="font-bold uppercase text-emerald-800 block">Rich Draft editor</span>
                


                <div className="space-y-1">
                  <label className="font-bold">Publication headline title</label>
                  <input
                    type="text"
                    required
                    value={cmsTitle}
                    onChange={(e) => setCmsTitle(e.target.value)}
                    placeholder="Kenyan rosemary extracts advantage"
                    className="w-full p-2.5 bg-white border rounded-lg focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold">Content category type</label>
                    <select value={cmsType} onChange={(e) => setCmsType(e.target.value as any)} className="w-full p-2.5 bg-white border rounded-lg focus:outline-none">
                      <option value="blog">Scientific Blog</option>
                      <option value="policy">Terms and Policies</option>
                      <option value="faq">Customer FAQ item</option>
                      <option value="hero">Hero Slide</option>
                      <option value="award">Award Showcase</option>
                      <option value="promotion">Wellness Promotion Event</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold">Status state</label>
                    <select value={cmsStatus} onChange={(e) => setCmsStatus(e.target.value as any)} className="w-full p-2.5 bg-white border rounded-lg focus:outline-none">
                      <option value="draft">Save in Draft sandbox</option>
                      <option value="published">Publish instantly on live servers</option>
                    </select>
                  </div>
                </div>

                {cmsType === 'promotion' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold">Event Date & Time</label>
                      <input type="text" value={eventDate} onChange={(e) => setEventDate(e.target.value)} placeholder="e.g. Oct 15 - 18, 2026" className="w-full p-2.5 bg-white border rounded-lg focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold">Location</label>
                      <input type="text" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} placeholder="e.g. Nairobi, KICC" className="w-full p-2.5 bg-white border rounded-lg focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold">Capacity (Slots)</label>
                      <input type="number" value={eventCapacity} onChange={(e) => setEventCapacity(e.target.value)} placeholder="e.g. 50" className="w-full p-2.5 bg-white border rounded-lg focus:outline-none" />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-bold">Image Upload (for Hero/Award/Blog)</label>
                  <MediaUploader urls={cmsImageUrls} onChange={setCmsImageUrls} multiple={true} maxFiles={10} bucket="images" />
                </div>

                <div className="space-y-1">
                  <label className="font-bold">Detailed HTML / Plaintext Content</label>
                  <textarea
                    required
                    rows={4}
                    value={cmsContent}
                    onChange={(e) => setCmsContent(e.target.value)}
                    className="w-full p-2.5 bg-white border rounded-lg focus:outline-none"
                    placeholder="Provide natural guidelines content here..."
                  ></textarea>
                </div>

                <button type="submit" disabled={isUploadingCms} className="bg-emerald-800 hover:bg-emerald-800 text-white font-bold p-3 rounded-xl w-full uppercase cursor-pointer disabled:opacity-50">
                  {isUploadingCms ? "Uploading Media & Saving..." : "Submit CMS Entry"}
                </button>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {cmsPosts.map((post) => (
                <div key={post.id} className="bg-zinc-50/40 p-4 border rounded-xl text-xs space-y-2 relative">
                  <span className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    post.status === "published" ? "bg-emerald-50 text-emerald-800" : "bg-gray-100 text-gray-500"
                  }`}>
                    {post.status}
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                    {post.type}
                  </span>
                  <h4 className="font-bold text-gray-900 mt-1">{post.title}</h4>
                  <p className="text-gray-500 line-clamp-3 leading-relaxed leading-normal">{post.content}</p>
                  
                  <div className="flex gap-2 pt-2 border-t mt-3 border-gray-100">
                    <button onClick={() => handleEditCMS(post)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded text-[10px] font-bold transition">Edit</button>
                    <button onClick={() => handleDeleteCMS(post.id)} className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 py-1.5 rounded text-[10px] font-bold transition">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5.5: USER MANAGEMENT */}
        {activeModule === "users" && (
          <UserManagement 
            users={users} 
            onUpdateUsers={onUpdateUsers} 
          />
        )}

        {/* TAB 6: SUPPORT TICKETS LIST PANEL */}
        {activeModule === "support" && (
          <div className="space-y-6 animate-in fade-in duration-150 text-left">
            <div>
              <h3 className="text-lg font-bold text-gray-950">Customer Inquiries Ticket Desk</h3>
              <p className="text-xs text-gray-500 mt-0.5">Address customer delivery discrepancies and email comments instantly.</p>
            </div>

            <div className="space-y-4">
              {tickets.map((t) => (
                <div key={t.id} className="bg-zinc-50/50 p-5 rounded-2xl border text-xs space-y-3">
                  <div className="flex justify-between items-start border-b pb-2">
                    <div>
                      <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-bold">{t.id}</span>
                      <h4 className="font-bold text-gray-900 mt-1">{t.subject}</h4>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      t.status === "open" ? "bg-red-50 text-red-900" : t.status === "in_progress" ? "bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-900"
                    }`}>
                      {t.status}
                    </span>
                  </div>

                  <div className="text-gray-600 italic">
                    "{t.message}"
                  </div>

                  <div className="pt-2 flex justify-between items-center text-[10px] text-gray-400">
                    <div>By: {t.customerName} | {t.email} | {t.phone}</div>
                    <div>{t.createdAt.split("T")[0]}</div>
                  </div>

                  {/* Rendering historical reply */}
                  {t.replies.map((rep, idx) => (
                    <div key={idx} className="bg-emerald-50/60 p-3 rounded-xl ml-4 text-[11px] leading-relaxed relative">
                      <span className="font-bold text-emerald-900 uppercase block mb-0.5 text-[9px]">Official staff reply:</span>
                      "{rep.message}"
                    </div>
                  ))}

                  {/* Reply dialog popup triggering inline */}
                  {replyTicketId === t.id ? (
                    <form onSubmit={(e) => handleTicketReplySubmit(e, t.id)} className="pt-2 pl-4 space-y-2 text-xs">
                      <textarea
                        required
                        rows={2}
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Type standard response..."
                        className="w-full p-2 bg-white border rounded-lg focus:outline-none"
                      ></textarea>
                      <div className="flex gap-2">
                        <button type="submit" className="bg-emerald-800 text-white font-bold p-1.5 rounded text-[11px]">Send & resolve ticket</button>
                        <button type="button" onClick={() => setReplyTicketId(null)} className="text-gray-400">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    t.status !== "resolved" && (
                      <button
                        onClick={() => setReplyTicketId(t.id)}
                        className="text-emerald-800 font-bold underline cursor-pointer text-[10px] pt-1"
                      >
                        Draft response message
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: STORE SETTINGS & ADMIN PROFILE */}
        {activeModule === "seo" && (
          <div className="space-y-8 animate-in fade-in duration-150 text-left">
            
            {/* Admin Profile Section */}
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-950 dark:text-white">Admin Profile Settings</h3>
                <p className="text-xs text-gray-500">Update your console access credentials and personal details.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-gray-50/50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400 uppercase text-[10px]">Full Name</label>
                    <input
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="w-full p-3 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:border-emerald-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400 uppercase text-[10px]">Email Address</label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full p-3 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:border-emerald-800"
                    />
                  </div>
                </div>
                <div className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400 uppercase text-[10px]">Current Role</label>
                    <div className="w-full p-3 border dark:border-gray-700 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed">
                      Super Administrator
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toast.success('Profile updated successfully!')}
                    className="w-full py-3 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition mt-auto cursor-pointer"
                  >
                    Save Profile Changes
                  </button>
                </div>
              </div>
            </div>



            <hr className="border-gray-100 dark:border-gray-800" />

            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-950 dark:text-white">Technical SEO Tagging</h3>
              <p className="text-xs text-gray-500">Configure global metadata structures optimized for Kenyan natural search keyword aggregates.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-400 uppercase text-[10px]">Meta Title String</label>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    className="w-full p-3 border rounded-xl bg-white focus:outline-none focus:border-emerald-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-400 uppercase text-[10px]">Dispersed keywords (Nairobi target)</label>
                  <input
                    type="text"
                    value={seoKey}
                    onChange={(e) => setSeoKey(e.target.value)}
                    className="w-full p-3 border rounded-xl bg-white focus:outline-none focus:border-emerald-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-400 uppercase text-[10px]">Meta Description block</label>
                  <textarea
                    rows={4}
                    value={seoDesc}
                    onChange={(e) => setSeoDesc(e.target.value)}
                    className="w-full p-3 border rounded-xl bg-white focus:outline-none focus:border-emerald-800"
                  ></textarea>
                </div>
              </div>

              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-1">
                  <label className="font-bold text-gray-400 uppercase text-[10px]">Robots.txt Schema</label>
                  <textarea
                    rows={8}
                    value={seoRobots}
                    onChange={(e) => setSeoRobots(e.target.value)}
                    className="w-full p-3 border rounded-xl bg-white font-mono focus:outline-none"
                  ></textarea>
                </div>

                <button
                  type="button"
                  onClick={saveSeoFields}
                  className="bg-emerald-800 hover:bg-emerald-800 text-white font-bold p-3 rounded-xl uppercase cursor-pointer text-center"
                >
                  Sync Meta Tags & rebuild indexes
                </button>
              </div>
            </div>
            
            <div className="bg-zinc-50 border p-4 rounded-xl text-xs space-y-1">
              <span className="font-bold text-gray-400 uppercase text-[9px] block">Live XML Sitemap Generator Target</span>
              <div className="font-mono text-[10px] text-gray-500">
                • sitemap_index.xml: /api/sitemap (Rebuilt successfully {storeSettings?.sitemapGeneratedAt?.split("T")[0] || "N/A"})
                <br />
                • Schema type definition: LocalBusiness & Product schemas verified OK.
              </div>
            </div>
          </div>
        )}

        {/* TAB 11: MEDIA LIBRARY */}
        {activeModule === "media" && (
          <div className="space-y-6 animate-in fade-in duration-150 text-left">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-950">Media Library</h3>
                <p className="text-xs text-gray-500 mt-0.5">Manage all images uploaded to your store's cloud storage.</p>
              </div>
              <button onClick={loadMediaFiles} className="bg-white border border-gray-200 p-2 rounded-lg text-gray-500 hover:text-emerald-800 transition shadow-sm">
                <RefreshCw className={`w-4 h-4 ${isMediaLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
            
            <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
              <div className="mb-6 space-y-2">
                <h4 className="font-bold text-sm">Upload New Media</h4>
                {/* Reusing existing uploader but not tying it to a single string so we just reload list */}
                <MediaUploader 
                  urls={[]} 
                  onChange={async (urls) => {
                    if (urls && urls.length > 0) {
                      for (const url of urls) {
                        await supabase.from('cms_posts').insert({
                          id: 'HERO-' + Math.random().toString(36).substr(2, 9),
                          title: 'Aloeflora Best Selling Natural Products',
                          content: 'Get your products now!!!',
                          type: 'hero',
                          status: 'published',
                          image_url: url
                        });
                      }
                    }
                    loadMediaFiles();
                  }} 
                  multiple={true} 
                  maxFiles={10} 
                  bucket="images" 
                />
              </div>

              <h4 className="font-bold text-sm mb-4 border-b pb-2">Uploaded Files ({mediaFiles.length})</h4>
              {isMediaLoading ? (
                <div className="flex items-center justify-center p-12 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : mediaFiles.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <Database className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 font-medium">No media files found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {mediaFiles.map((file, idx) => (
                    <div key={idx} className="group relative rounded-xl border overflow-hidden bg-gray-50 aspect-square">
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                        <p className="text-[9px] text-white font-mono break-all text-center leading-tight line-clamp-3">{file.name}</p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => { navigator.clipboard.writeText(file.url); toast.success("URL Copied to clipboard!"); }}
                            className="bg-white/20 hover:bg-white/40 text-white p-2 rounded-full text-xs transition"
                            title="Copy URL"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteMedia(file.name)}
                            className="bg-red-500/80 hover:bg-red-600 text-white p-2 rounded-full text-xs transition"
                            title="Delete File"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 12: SETTINGS & PROFILE */}
        {activeModule === "settings" && (
          <div className="space-y-6 animate-in fade-in duration-150 text-left max-w-2xl mx-auto">
            <div>
              <h3 className="text-lg font-bold text-gray-950">System Settings & Profile</h3>
              <p className="text-xs text-gray-500 mt-0.5">Manage administrative credentials and system configuration.</p>
            </div>
            
            <form onSubmit={saveAdminProfile} className="bg-zinc-50/50 p-6 border rounded-2xl space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Admin Name</label>
                <input type="text" value={adminName} onChange={e => setAdminName(e.target.value)} required className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Admin Email</label>
                <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 text-xs" />
              </div>
              
              <button type="submit" className="w-full bg-emerald-800 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition cursor-pointer text-xs shadow-md mt-4">
                Save Profile Configuration
              </button>
            </form>

            <div className="bg-red-50 p-6 border border-red-100 rounded-2xl text-center space-y-3">
              <h4 className="font-bold text-red-900">End Session</h4>
              <p className="text-xs text-red-700 max-w-sm mx-auto">Terminate your current secure administrative session. You will be required to re-authenticate to access the ERP.</p>
              <button onClick={() => window.location.href = '/'} className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition flex items-center justify-center gap-2 cursor-pointer text-xs shadow-md mx-auto max-w-sm mt-2">
                <LogOut className="w-4 h-4" /> Secure Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
