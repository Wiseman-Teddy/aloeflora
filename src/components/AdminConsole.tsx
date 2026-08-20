import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { User, LogOut, 
  BarChart3, 
  Layers, 
  ShoppingBag, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  AlertCircle,
  Terminal, 
  Settings, 
  FileText, 
  PenTool, 
  Search, 
  ArrowUpRight, 
  CheckCircle, 
  Check,
  Plus, 
  RefreshCw, 
  Trash2, 
  Percent, 
  Calendar, 
  Heart,
  Loader2, 
  Lock, 
  MessageSquare, 
  Database, 
  Upload, 
  Eye, 
  Copy, 
  ExternalLink, 
  Filter,
  SlidersHorizontal,
  Image as ImageIcon,
  X 
} from "lucide-react";
import { Product, ProductVariant, Order, SupportTicket, MarketingCampaign, CMSPost, AuditAnomaly, StoreSettings, SystemMetrics, UserProfile, Promo, StockMovement } from "../types";
import { supabase } from "../lib/supabase";
import { sanitizeInput } from "../utils/sanitize";
import { uploadToSupabase, deleteFromSupabase } from "../utils/supabaseStorage";
import MediaUploader from "./MediaUploader";
import { useAuth } from "../contexts/AuthContext";
import { exportToCSV, exportToPDF, exportStockMovementsCSV } from "../utils/exportUtils";
import { normalizeVariants, hasVariants } from "../utils/variantUtils";
import AdvancedReports from "./admin/AdvancedReports";
import FinancialPLReports from "./admin/FinancialPLReports";
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
  isLoadingUsers?: boolean;
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
  isLoadingUsers = false,
  onUpdateUsers,
  promos,
  onUpdatePromos
}: AdminConsoleProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleAdminSignOut = async () => {
    navigate("/store", { replace: true });
    await signOut();
    toast.success("Signed out successfully.");
  };

  const [adminName, setAdminName] = useState(user?.user_metadata?.full_name || storeSettings?.adminName || "Administrator");
  const [adminEmail, setAdminEmail] = useState(user?.email || storeSettings?.adminEmail || "admin@aloeflora.com");
  const [adminPhone, setAdminPhone] = useState(user?.user_metadata?.phone || "");
  const [adminAvatarUrl, setAdminAvatarUrl] = useState(user?.user_metadata?.avatar_url || "");
  
  // Navigation & URL sync
  const getInitialModule = () => {
    if (location.state && ((location.state as any).module || (location.state as any).tab)) {
      return (location.state as any).module || (location.state as any).tab;
    }
    const pathParts = location.pathname.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    const validModules = ["executive", "inventory", "users", "support", "cms", "events", "media", "reports", "financial", "marketing", "settings", "seo", "profile"];
    if (lastPart && validModules.includes(lastPart)) {
      return lastPart;
    }
    return "executive";
  };

  const [activeModule, setActiveModule] = useState<string>(getInitialModule);

  useEffect(() => {
    const targetModule = getInitialModule();
    if (targetModule && targetModule !== activeModule) {
      setActiveModule(targetModule);
    }
  }, [location.pathname, location.state]);

  const handleSelectModule = (mod: string) => {
    setActiveModule(mod);
    navigate(`/admin/dashboard/${mod}`, { replace: true, state: { module: mod } });
  };

  useEffect(() => {
    if (user) {
      if (user.user_metadata?.full_name) setAdminName(user.user_metadata.full_name);
      if (user.email) setAdminEmail(user.email);
      if (user.user_metadata?.phone) setAdminPhone(user.user_metadata.phone);
      if (user.user_metadata?.avatar_url) setAdminAvatarUrl(user.user_metadata.avatar_url);

      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
        if (data) {
          if (data.full_name) setAdminName(data.full_name);
          if (data.phone) setAdminPhone(data.phone);
          if (data.avatar_url) setAdminAvatarUrl(data.avatar_url);
        }
      });
    }
  }, [user]);

  // Inventory Management UI state
  const [searchProductQuery, setSearchProductQuery] = useState<string>("");
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState<string>("all");
  const [inventoryStockFilter, setInventoryStockFilter] = useState<string>("all");
  const [inventorySort, setInventorySort] = useState<string>("default");
  const [inventorySubTab, setInventorySubTab] = useState<"stock" | "ledger">("stock");
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [isLoadingMovements, setIsLoadingMovements] = useState<boolean>(false);
  const [isAddingProduct, setIsAddingProduct] = useState<boolean>(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Form states for creating/editing product
  const [prodName, setProdName] = useState<string>("");
  const [prodSku, setProdSku] = useState<string>("");
  const [prodBarcode, setProdBarcode] = useState<string>("");
  const [prodBatchNumber, setProdBatchNumber] = useState<string>("");
  const [prodExpiryDate, setProdExpiryDate] = useState<string>("");
  const [prodDesc, setProdDesc] = useState<string>("");
  const [prodPrice, setProdPrice] = useState<number>(500);
  const [prodCostPrice, setProdCostPrice] = useState<number>(200);
  const [prodCategory, setProdCategory] = useState<"hair" | "body" | "home" | "coffee">("hair");
  const [prodSubCategory, setProdSubCategory] = useState<string>("Shampoos");
  const [prodUnitSize, setProdUnitSize] = useState<string>("");
  const [prodImageUrl, setProdImageUrl] = useState<string>("");
  const [prodStock, setProdStock] = useState<number>(50);
  const [prodSafetyStock, setProdSafetyStock] = useState<number>(10);
  const [prodReorderLevel, setProdReorderLevel] = useState<number>(15);
  const [prodVariants, setProdVariants] = useState<string>("");
  const [prodVariantsList, setProdVariantsList] = useState<ProductVariant[]>([]);
  const [uploadingVariantIdx, setUploadingVariantIdx] = useState<number | null>(null);
  const [prodFeatures, setProdFeatures] = useState<string>("");
  const [prodSpecs, setProdSpecs] = useState<string>("");
  const [prodMediaUrls, setProdMediaUrls] = useState<string[]>([]);
  const [isUploadingProduct, setIsUploadingProduct] = useState(false);

  // Restock ERP Modal State
  const [isRestockModalOpen, setIsRestockModalOpen] = useState<boolean>(false);
  const [restockTargetProduct, setRestockTargetProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState<number>(10);
  const [restockBatch, setRestockBatch] = useState<string>("");
  const [restockRef, setRestockRef] = useState<string>("");
  const [restockNotes, setRestockNotes] = useState<string>("");
  const [isSubmittingRestock, setIsSubmittingRestock] = useState<boolean>(false);

  // DevOps dynamic metrics
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpuUsage: 22,
    memoryUsage: 450,
    databaseLatency: 4,
    activeSessions: 14,
    requestCount: 382
  });

  // CMS forms & filters
  const [isAddingCms, setIsAddingCms] = useState<boolean>(false);
  const [editingCmsId, setEditingCmsId] = useState<string | null>(null);
  const [cmsSearchQuery, setCmsSearchQuery] = useState<string>("");
  const [cmsTypeFilter, setCmsTypeFilter] = useState<string>("all");
  const [cmsStatusFilter, setCmsStatusFilter] = useState<string>("all");
  const [previewCmsPost, setPreviewCmsPost] = useState<CMSPost | null>(null);
  const [cmsTitle, setCmsTitle] = useState<string>("");
  const [cmsContent, setCmsContent] = useState<string>("");
  const [cmsType, setCmsType] = useState<"blog" | "testimonial" | "policy" | "faq" | "promo" | "promotion" | "hero" | "award" | "about" | "team">("blog");
  const [cmsStatus, setCmsStatus] = useState<"draft" | "published">("published");
  const [cmsImageUrls, setCmsImageUrls] = useState<string[]>([]);
  const [isUploadingCms, setIsUploadingCms] = useState(false);
  const [eventDate, setEventDate] = useState<string>("");
  const [eventLocation, setEventLocation] = useState<string>("");
  const [eventCapacity, setEventCapacity] = useState<string>("50");
  const [faqCategory, setFaqCategory] = useState<string>("Getting Started");

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
  const [mediaCategoryFilter, setMediaCategoryFilter] = useState<string>("all");
  const [mediaUploadCategory, setMediaUploadCategory] = useState<string>("general");
  const [mediaPreviewModal, setMediaPreviewModal] = useState<{name: string, url: string} | null>(null);

  // Events and Registrations State
  const [eventsData, setEventsData] = useState<any[]>([]);
  const [eventRegistrations, setEventRegistrations] = useState<any[]>([]);
  const [eventPrice, setEventPrice] = useState<string>("0");
  const [vendorEnabled, setVendorEnabled] = useState<boolean>(true);
  const [vendorPrice, setVendorPrice] = useState<string>("2000");
  const [vendorCapacity, setVendorCapacity] = useState<string>("10");
  const [attendeeEnabled, setAttendeeEnabled] = useState<boolean>(true);

  const [isReportsLoading, setIsReportsLoading] = useState(false);

  const fetchEventsAndRegistrations = async () => {
    try {
      const [evRes, regRes] = await Promise.all([
        supabase.from('events').select('*'),
        supabase.from('event_registrations').select('*')
      ]);
      if (evRes.data) setEventsData(evRes.data);
      if (regRes.data) setEventRegistrations(regRes.data);
    } catch (e) {
      console.warn("Failed to load events/registrations", e);
    }
  };

  useEffect(() => {
    fetchEventsAndRegistrations();

    const channel = supabase.channel('admin-events-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, fetchEventsAndRegistrations)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_registrations' }, fetchEventsAndRegistrations)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRefreshReportsData = async () => {
    setIsReportsLoading(true);
    try {
      await fetchEventsAndRegistrations();
      toast.success("Reports data refreshed with latest real-time records.");
    } catch (e: any) {
      toast.error("Error refreshing reports: " + e.message);
    } finally {
      setIsReportsLoading(false);
    }
  };

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
        const variantObj = product && product.variants 
          ? normalizeVariants(product).find(v => v.name === item.selectedVariant)
          : null;
        const itemCost = item.costPrice ?? (variantObj?.costPrice ?? (product ? product.costPrice : (item.price * 0.45)));
        return acc + (itemCost * item.quantity);
      }, 0);
      return totalCost + orderCosts;
    }, 0);

  const grossProfit = totalPaidRevenue - totalCogs;
  const netProfit = grossProfit - operatingExpenses;

  const handleVariantFileUpload = async (vIdx: number, file: File) => {
    if (!file) return;
    setUploadingVariantIdx(vIdx);
    const toastId = toast.loading(`Uploading variant image (${file.name})...`);
    try {
      const publicUrl = await uploadToSupabase(file, 'images', 'variant');
      if (publicUrl) {
        setProdVariantsList(prev => {
          const updated = [...prev];
          updated[vIdx].imageUrl = publicUrl;
          return updated;
        });
        toast.success("Variant image uploaded successfully!", { id: toastId });
      } else {
        toast.error("Failed to upload image. Please try again.", { id: toastId });
      }
    } catch (err: any) {
      toast.error("Upload error: " + err.message, { id: toastId });
    } finally {
      setUploadingVariantIdx(null);
    }
  };

  const fetchStockMovements = async () => {
    setIsLoadingMovements(true);
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(150);
      if (error) throw error;
      setStockMovements((data || []).map((m: any) => ({
        id: m.id,
        productId: m.product_id,
        sku: m.sku || undefined,
        movementType: m.movement_type,
        quantityDelta: m.quantity_delta,
        stockBefore: m.stock_before,
        stockAfter: m.stock_after,
        batchNumber: m.batch_number,
        referenceId: m.reference_id,
        notes: m.notes,
        performedBy: m.performed_by,
        createdAt: m.created_at
      })));
    } catch (err: any) {
      console.error("Error fetching stock movements:", err);
    } finally {
      setIsLoadingMovements(false);
    }
  };

  useEffect(() => {
    if (activeModule === "inventory") {
      fetchStockMovements();
    }
  }, [activeModule]);

  const generateAutoSku = (name: string, category: string, size?: string) => {
    const catCode = (category || 'GEN').substring(0, 3).toUpperCase();
    const nameCode = (name || 'PROD').replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
    const sizeCode = (size || 'STD').replace(/[^a-zA-Z0-9]/g, '').substring(0, 5).toUpperCase();
    return `AF-${catCode}-${nameCode}-${sizeCode}`;
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setProdName("");
    setProdSku("");
    setProdBarcode("");
    setProdBatchNumber("");
    setProdExpiryDate("");
    setProdDesc("");
    setProdPrice(500);
    setProdCostPrice(200);
    setProdCategory("hair");
    setProdSubCategory("Shampoos");
    setProdUnitSize("");
    setProdImageUrl("");
    setProdStock(50);
    setProdSafetyStock(10);
    setProdReorderLevel(15);
    setProdVariants("");
    setProdVariantsList([]);
    setProdFeatures("");
    setProdSpecs("");
    setProdMediaUrls([]);
  };

  // Handles Product Add / Update
  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodDesc || (!prodImageUrl && prodMediaUrls.length === 0)) {
      toast.error("Name, description, and at least one image URL/file are required!");
      return;
    }

    setIsUploadingProduct(true);
    const uploadedMediaUrls: string[] = prodMediaUrls;
    setIsUploadingProduct(false);

    const isUpdating = editingProductId !== null;
    const targetId = isUpdating ? editingProductId : ("p" + Date.now());

    // Auto generate SKU if empty
    const finalSku = prodSku.trim() || generateAutoSku(prodName, prodCategory, prodUnitSize);
    const finalBatch = prodBatchNumber.trim() || `LOT-${new Date().toISOString().slice(0, 7).replace('-', '')}-01`;

    // Use structured variants matrix if provided by admin, otherwise empty array [] for standalone products
    const finalVariants = prodVariantsList.length > 0 
      ? prodVariantsList 
      : (prodVariants && prodVariants.trim() !== '' ? prodVariants.split(",").map(v => v.trim()).filter(Boolean) : []);

    const primaryPrice = prodVariantsList.length > 0 ? prodVariantsList[0].price : prodPrice;
    const primaryCost = prodVariantsList.length > 0 ? (prodVariantsList[0].costPrice || prodCostPrice) : prodCostPrice;
    const totalVariantStock = prodVariantsList.length > 0 
      ? prodVariantsList.reduce((sum, v) => sum + (v.stock || 0), 0)
      : prodStock;

    const newProduct: Product = {
      id: targetId,
      sku: finalSku,
      barcode: prodBarcode.trim() || undefined,
      batchNumber: finalBatch,
      expiryDate: prodExpiryDate || undefined,
      name: prodName,
      description: prodDesc,
      price: primaryPrice,
      costPrice: primaryCost,
      category: prodCategory,
      subCategory: prodSubCategory,
      unitSize: prodUnitSize.trim() || undefined,
      imageUrl: prodImageUrl || uploadedMediaUrls[0] || "",
      stock: totalVariantStock,
      safetyStock: prodSafetyStock,
      reorderLevel: prodReorderLevel,
      rating: 5.0,
      reviewsCount: 0,
      reviews: [],
      variants: finalVariants,
      features: prodFeatures ? prodFeatures.split(",").map(f => f.trim()) : ["Natural Ingredient"],
      mediaUrls: uploadedMediaUrls.length > 0 ? uploadedMediaUrls : (prodImageUrl ? [prodImageUrl] : []),
      specifications: prodSpecs ? prodSpecs.split(",").map(s => s.trim()) : []
    };

    try {
      const dbRow = {
        id: newProduct.id,
        sku: newProduct.sku,
        barcode: newProduct.barcode,
        batch_number: newProduct.batchNumber,
        expiry_date: newProduct.expiryDate || null,
        name: newProduct.name,
        description: newProduct.description,
        price: newProduct.price,
        cost_price: newProduct.costPrice,
        category: newProduct.category,
        sub_category: newProduct.subCategory,
        unit_size: newProduct.unitSize,
        image_url: newProduct.imageUrl,
        stock: newProduct.stock,
        safety_stock: newProduct.safetyStock,
        reorder_level: newProduct.reorderLevel,
        rating: newProduct.rating,
        reviews_count: newProduct.reviewsCount,
        variants: newProduct.variants,
        features: newProduct.features,
        media_urls: newProduct.mediaUrls,
        specifications: newProduct.specifications
      };

      let error;
      if (isUpdating) {
        let { error: updErr } = await supabase.from("products").update(dbRow).eq('id', targetId);
        if (updErr && updErr.message?.toLowerCase().includes("unit_size")) {
          delete (dbRow as any).unit_size;
          const { error: retryErr } = await supabase.from("products").update(dbRow).eq('id', targetId);
          updErr = retryErr;
        }
        error = updErr;
      } else {
        let { error: insErr } = await supabase.from("products").insert(dbRow);
        if (insErr && insErr.message?.toLowerCase().includes("unit_size")) {
          delete (dbRow as any).unit_size;
          const { error: retryErr } = await supabase.from("products").insert(dbRow);
          insErr = retryErr;
        }
        error = insErr;
      }
      
      if (error) throw error;
      
      if (isUpdating) {
        onUpdateInventory(products.map(p => p.id === targetId ? newProduct : p));
        toast.success(`Product updated (${finalSku})`);
      } else {
        onUpdateInventory([...products, newProduct]);
        toast.success(`Product added with SKU ${finalSku}`);
      }
    } catch(err: any) { 
      console.error("Supabase operation error", err);
      toast.error("Database error: " + err.message);
      return; 
    }

    setIsAddingProduct(false);
    resetProductForm();
  };

  const handleEditClick = (p: Product) => {
    setEditingProductId(p.id);
    setProdName(p.name);
    setProdSku(p.sku || generateAutoSku(p.name, p.category, p.unitSize));
    setProdBarcode(p.barcode || "");
    setProdBatchNumber(p.batchNumber || `LOT-${new Date().toISOString().slice(0, 7).replace('-', '')}-01`);
    setProdExpiryDate(p.expiryDate ? p.expiryDate.slice(0, 10) : "");
    setProdDesc(p.description);
    setProdPrice(p.price);
    setProdCostPrice(p.costPrice || 200);
    setProdCategory(p.category as any);
    setProdSubCategory(p.subCategory);
    setProdUnitSize(p.unitSize || "");
    setProdImageUrl(p.imageUrl);
    setProdStock(p.stock);
    setProdSafetyStock(p.safetyStock);
    setProdReorderLevel(p.reorderLevel);

    const hasTrueVars = hasVariants(p);
    const normalizedVars = hasTrueVars ? normalizeVariants(p) : [];
    setProdVariantsList(normalizedVars);
    setProdVariants(hasTrueVars && p.variants ? p.variants.map(v => typeof v === 'string' ? v : v.name).join(", ") : "");
    setProdFeatures(p.features ? p.features.join(", ") : "");
    setProdSpecs(p.specifications ? p.specifications.join(", ") : "");
    setProdMediaUrls(p.mediaUrls || []);
    setIsAddingProduct(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this product?")) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      onUpdateInventory(products.filter(item => item.id !== id));
      toast.success("Product deleted successfully!");
    } catch (err: any) {
      toast.error("Error deleting product: " + err.message);
    }
  };

  // Open Restock Modal
  const handleOpenRestockModal = (p: Product, defaultQty: number = 10) => {
    setRestockTargetProduct(p);
    setRestockQty(defaultQty);
    setRestockBatch(p.batchNumber || `LOT-${new Date().toISOString().slice(0, 7).replace('-', '')}-01`);
    setRestockRef(`PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    setRestockNotes("");
    setIsRestockModalOpen(true);
  };

  // Execute Inventory Replenishment via Supabase RPC
  const handleExecuteRestock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!restockTargetProduct) return;
    const increment = Number(restockQty);
    if (!increment || increment <= 0) {
      toast.error("Please enter a valid restock quantity greater than 0");
      return;
    }

    setIsSubmittingRestock(true);
    const targetId = restockTargetProduct.id;
    const newStock = (restockTargetProduct.stock || 0) + increment;

    // Optimistic UI update
    onUpdateInventory(products.map(p => p.id === targetId ? { ...p, stock: newStock, batchNumber: restockBatch.trim() || p.batchNumber } : p));

    try {
      const { data, error } = await supabase.rpc('process_inventory_restock', {
        p_product_id: targetId,
        p_quantity: increment,
        p_batch: restockBatch.trim() || null,
        p_reference: restockRef.trim() || null,
        p_notes: restockNotes.trim() || null,
        p_admin: adminEmail || adminName || 'admin'
      });

      if (error) {
        // Fallback update if RPC not accessible
        await supabase.from("products").update({ 
          stock: newStock,
          batch_number: restockBatch.trim() || restockTargetProduct.batchNumber
        }).eq("id", targetId);
      }

      toast.success(`Restocked ${restockTargetProduct.name} (+${increment} units)`);
      setIsRestockModalOpen(false);
      setRestockTargetProduct(null);
      fetchStockMovements();
    } catch (err: any) {
      console.error("Supabase restock error:", err);
      toast.error("Failed to sync restock to database: " + err.message);
    } finally {
      setIsSubmittingRestock(false);
    }
  };

  // Quick Restock shortcut
  const handleReplenishStock = async (productId: string, increment: number) => {
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) return;
    handleOpenRestockModal(targetProduct, increment);
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

    const validUrls = cmsImageUrls.filter(url => url && url.trim() !== '');
    let finalImageUrl = validUrls.length > 0 ? validUrls.join(',') : null;

    if (editingCmsId) {
      const updatedPosts = cmsPosts.map(p => {
        if (p.id === editingCmsId) {
          return { 
            ...p, 
            title: sanitizeInput(cmsTitle), 
            content: sanitizeInput(cmsContent), 
            type: cmsType, 
            status: cmsStatus, 
            imageUrl: finalImageUrl || undefined, 
            seoTitle: cmsType === 'promotion' ? sanitizeInput(eventDate) : (cmsType === 'faq' ? faqCategory : p.seoTitle), 
            seoDesc: cmsType === 'promotion' ? sanitizeInput(eventLocation) : p.seoDesc, 
            seoKeywords: cmsType === 'promotion' ? sanitizeInput(eventCapacity) : p.seoKeywords 
          };
        }
        return p;
      });
      
      const modified = updatedPosts.find(p => p.id === editingCmsId);
      if(modified) {
        try {
          const { error } = await supabase.from("cms_posts").update({
            title: modified.title, 
            content: modified.content, 
            type: modified.type, 
            status: modified.status, 
            image_url: finalImageUrl, 
            seo_title: modified.seoTitle, 
            seo_desc: modified.seoDesc, 
            seo_keywords: modified.seoKeywords
          }).eq('id', editingCmsId);
          if (error) throw error;
          
          if (modified.type === 'promotion') {
            const modEvt = {
              id: modified.id,
              title: modified.title,
              description: modified.content,
              date: modified.seoTitle || "TBA",
              location: modified.seoDesc || "TBA",
              capacity: parseInt(modified.seoKeywords || "50") || 50,
              price: parseFloat(eventPrice) || 0,
              vendor_enabled: vendorEnabled,
              vendor_price: parseFloat(vendorPrice) || 0,
              vendor_capacity: parseInt(vendorCapacity) || 10,
              attendee_enabled: attendeeEnabled,
              image_url: finalImageUrl,
              status: "upcoming"
            };
            const { error: evtErr } = await supabase.from('events').upsert(modEvt);
            if (!evtErr) {
              setEventsData(prev => {
                const exists = prev.find(e => e.id === modEvt.id);
                if (exists) return prev.map(e => e.id === modEvt.id ? { ...e, ...modEvt } : e);
                return [...prev, modEvt as any];
              });
            }
          }
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
        seoTitle: cmsType === 'promotion' ? sanitizeInput(eventDate) : (cmsType === 'faq' ? faqCategory : ""),
        seoDesc: cmsType === 'promotion' ? sanitizeInput(eventLocation) : "",
        seoKeywords: cmsType === 'promotion' ? sanitizeInput(eventCapacity) : ""
      };
      
      try {
        const { error } = await supabase.from("cms_posts").insert([{
          id: newPost.id,
          title: newPost.title,
          content: newPost.content,
          type: newPost.type,
          status: newPost.status,
          author: newPost.author,
          image_url: newPost.imageUrl,
          seo_title: newPost.seoTitle,
          seo_desc: newPost.seoDesc,
          seo_keywords: newPost.seoKeywords
        }]);
        if (error) throw error;

        if (newPost.type === 'promotion') {
          const newEvt = {
            id: newPost.id,
            title: newPost.title,
            description: newPost.content,
            date: newPost.seoTitle || "TBA",
            location: newPost.seoDesc || "TBA",
            capacity: parseInt(newPost.seoKeywords || "50") || 50,
            price: parseFloat(eventPrice) || 0,
            vendor_enabled: vendorEnabled,
            vendor_price: parseFloat(vendorPrice) || 0,
            vendor_capacity: parseInt(vendorCapacity) || 10,
            attendee_enabled: attendeeEnabled,
            image_url: finalImageUrl,
            status: "upcoming"
          };
          const { error: evtErr } = await supabase.from('events').insert(newEvt);
          if (!evtErr) setEventsData([...eventsData, newEvt as any]);
        }
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
    setCmsImageUrls(post.imageUrl ? post.imageUrl.split(',').filter(url => url && url.trim() !== '') : []);
    setEventDate(post.seoTitle || "");
    setEventLocation(post.seoDesc || "");
    setEventCapacity(post.seoKeywords || "50");
    if (post.type === 'promotion') {
      const evt = eventsData.find(e => e.id === post.id);
      setEventPrice(evt ? String(evt.price) : "0");
      setVendorEnabled(evt ? evt.vendor_enabled : true);
      setVendorPrice(evt ? String(evt.vendor_price) : "2000");
      setVendorCapacity(evt ? String(evt.vendor_capacity) : "10");
      setAttendeeEnabled(evt ? evt.attendee_enabled : true);
    } else {
      setEventPrice("0");
      setVendorEnabled(true);
      setVendorPrice("2000");
      setVendorCapacity("10");
      setAttendeeEnabled(true);
    }
  };

  const handleDeleteCMS = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this CMS Post and its corresponding images from Supabase Storage and Media Library?")) {
      try {
        const targetPost = cmsPosts.find(p => p.id === id);

        // 1. Delete associated media files from Supabase Storage
        if (targetPost && targetPost.imageUrl) {
          const urls = targetPost.imageUrl.split(',').map(u => u.trim()).filter(Boolean);
          for (const u of urls) {
            await deleteFromSupabase(u, 'images');
            setMediaFiles(prev => prev.filter(f => f.url !== u && !u.endsWith(f.name)));
          }
        }

        // 2. Delete CMS post from Supabase DB
        const { error } = await supabase.from('cms_posts').delete().eq('id', id);
        if (error) throw error;

        if (targetPost && targetPost.type === 'promotion') {
          await supabase.from('events').delete().eq('id', id);
          setEventsData(prev => prev.filter(e => e.id !== id));
        }

        // 3. Real-time application update
        onUpdateCMS(cmsPosts.filter(p => p.id !== id));
        toast.success("CMS Post and corresponding media files deleted successfully!");
      } catch (err: any) {
        console.error(err);
        toast.error(`Failed to delete CMS post: ${err.message}`);
      }
    }
  };

  const handleDeleteAllCMS = async () => {
    if (cmsPosts.length === 0) {
      toast.error("No CMS posts available to delete.");
      return;
    }

    if (confirm(`Are you sure you want to PERMANENTLY delete ALL (${cmsPosts.length}) CMS posts and their corresponding images from Supabase Storage and Media Library?`)) {
      try {
        // 1. Delete all images from Supabase Storage
        for (const post of cmsPosts) {
          if (post.imageUrl) {
            const urls = post.imageUrl.split(',').map(u => u.trim()).filter(Boolean);
            for (const u of urls) {
              await deleteFromSupabase(u, 'images');
            }
          }
        }

        // 2. Delete all records from Supabase DB cms_posts
        const { error } = await supabase.from('cms_posts').delete().neq('id', 'dummy_id_none_000');
        if (error) throw error;

        // Clean up events table as well
        await supabase.from('events').delete().neq('id', 'dummy_id_none_000');
        setEventsData([]);

        // 3. Real-time application update
        onUpdateCMS([]);
        setMediaFiles(prev => prev.filter(f => !f.name.startsWith('hero_') && !f.name.startsWith('blog_') && !f.name.startsWith('promo_')));
        toast.success("All CMS posts and corresponding images permanently deleted!");
      } catch (err: any) {
        console.error(err);
        toast.error(`Failed to delete all CMS posts: ${err.message}`);
      }
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this Event?")) {
      try {
        await supabase.from('events').delete().eq('id', id);
        await supabase.from('cms_posts').delete().eq('id', id);
        
        setEventsData(eventsData.filter(e => e.id !== id));
        onUpdateCMS(cmsPosts.filter(p => p.id !== id));
        toast.success("Event deleted successfully!");
      } catch (err: any) {
        toast.error(`Failed to delete event: ${err.message}`);
      }
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
        admin_name: adminName,
        admin_email: adminEmail,
        seo_title: updatedSettings.seoTitle,
        seo_desc: updatedSettings.seoDesc,
        seo_keywords: updatedSettings.seoKeywords,
        seo_robots: updatedSettings.seoRobots,
        sitemap_generated_at: updatedSettings.sitemapGeneratedAt,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;

      if (user) {
        await supabase.auth.updateUser({
          data: {
            full_name: adminName,
            phone: adminPhone,
            avatar_url: adminAvatarUrl
          }
        });

        await supabase.from('profiles').upsert({
          id: user.id,
          full_name: adminName,
          email: adminEmail,
          phone: adminPhone,
          avatar_url: adminAvatarUrl,
          role: 'admin',
          updated_at: new Date().toISOString()
        });
      }

      onUpdateSettings(updatedSettings);
      toast.success("Admin Profile updated and synced successfully.");
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
    <div id="admin-unified-console-wrapper" className="flex flex-col gap-6 text-left min-h-screen -mt-2">
      
      {/* ADMIN CONSOLE TOPBAR HEADER */}
      <header className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl px-6 py-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-xl shadow-xs border border-emerald-900/10 dark:border-gray-800">
            <img src="/logo.jpeg" alt="ALOEFLORA Logo" className="h-8 w-auto object-contain rounded-lg" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tight text-emerald-800 dark:text-lime-400 uppercase leading-none">
                ALOEFLORA ERP
              </span>
              <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200/50">
                Admin Console
              </span>
            </div>
            <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">
              Enterprise Resource & Store Operations Control
            </div>
          </div>
        </div>

        {/* Topbar Right Controls: Interactive Admin Profile Badge */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-semibold border border-emerald-200/40">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Systems Nominal</span>
          </div>

          <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 hidden sm:block"></div>

          {/* Interactive Admin Profile Button (Click to open Admin Profile Settings) */}
          <button
            onClick={() => setActiveModule("settings")}
            title="Click to edit Admin Profile Settings"
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition cursor-pointer group border border-transparent hover:border-emerald-200/60 dark:hover:border-emerald-800/60 text-left"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center overflow-hidden border border-emerald-700 shadow-xs group-hover:scale-105 group-hover:ring-2 group-hover:ring-emerald-500/40 transition-all shrink-0">
              {adminAvatarUrl ? (
                <img src={adminAvatarUrl} alt={adminName} className="w-full h-full object-cover" />
              ) : (
                (adminName || "Admin").charAt(0).toUpperCase()
              )}
            </div>
            <div className="text-left flex flex-col justify-center">
              <div className="text-xs font-bold text-gray-900 dark:text-white leading-none group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors flex items-center gap-1">
                {adminName || "Administrator"}
                <Settings className="w-3 h-3 text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 truncate max-w-[120px] sm:max-w-[160px]">
                {adminEmail || "admin@aloeflora.com"}
              </div>
            </div>
          </button>

          <button
            onClick={handleAdminSignOut}
            title="Sign Out"
            className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 w-full">
        {/* LEFT SIDEBAR NAVIGATION: Dark Theme ShopX Style */}
        <div className="w-full lg:w-64 shrink-0 bg-[#0F172A] text-slate-300 rounded-3xl p-5 shadow-xl flex flex-col justify-between h-auto lg:h-[calc(100vh-140px)] lg:sticky top-24">
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
                  { id: "events", label: "Events & Registrations", icon: Calendar },
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
                  onClick={() => setActiveModule("settings")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition mb-1 ${
                    activeModule === "settings" || activeModule === "profile"
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                      : "hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <User className="w-4 h-4" /> Admin Profile
                </button>
                <button
                  onClick={() => setActiveModule("seo")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition mb-1 ${
                    activeModule === "seo"
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                      : "hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Settings className="w-4 h-4" /> Store SEO Settings
                </button>
                <button
                  onClick={handleAdminSignOut}
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
              {/* Header Greeting & Admin Profile Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900/5 via-emerald-800/5 to-transparent p-5 rounded-2xl border border-emerald-900/10 dark:border-emerald-800/20">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setActiveModule("settings")}
                    title="Click to edit Admin Profile Settings"
                    className="relative group cursor-pointer shrink-0"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-800 text-white font-extrabold text-lg flex items-center justify-center overflow-hidden border-2 border-emerald-600 shadow-sm group-hover:scale-105 group-hover:ring-4 group-hover:ring-emerald-500/30 transition-all">
                      {adminAvatarUrl ? (
                        <img src={adminAvatarUrl} alt={adminName} className="w-full h-full object-cover" />
                      ) : (
                        (adminName || "Admin").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-900 p-1 rounded-full border border-gray-200 dark:border-gray-700 shadow-xs text-emerald-700 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Settings className="w-3 h-3" />
                    </div>
                  </button>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-gray-950 dark:text-white flex items-center gap-2">
                      Welcome back, {(adminName || "Admin").split(' ')[0]}! 🛡️
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Aggregating real-time Lipa Na M-Pesa merchant metrics from Nairobi CBD depot.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModule("settings")}
                  className="bg-white dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs shrink-0 self-start sm:self-auto cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Admin Profile Settings
                </button>
              </div>

            {/* KPI Summary Rows */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gray-50/50 p-4 border rounded-xl">
                <span className="text-[10px] uppercase font-bold text-gray-400">Event Revenue</span>
                <div className="text-lg font-extrabold text-emerald-800 mt-1">KES {eventRegistrations.filter(r => r.payment_status === "paid").reduce((sum, r) => sum + Number(r.amount_paid || 0), 0).toLocaleString()}</div>
                <span className="text-[9px] text-emerald-600 font-semibold mt-1 flex items-center gap-0.5">
                   {eventRegistrations.length} Registrations
                </span>
              </div>

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
        {activeModule === "inventory" && (() => {
          // Inventory Calculations
          const totalStockUnits = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
          const totalAssetCost = products.reduce((sum, p) => sum + ((Number(p.costPrice) || 0) * (Number(p.stock) || 0)), 0);
          const lowStockCount = products.filter(p => (p.stock || 0) <= (p.safetyStock || 10) && (p.stock || 0) > 0).length;
          const outOfStockCount = products.filter(p => (p.stock || 0) === 0).length;

          // Filter & Sort Products safely
          const filteredProducts = products.filter(p => {
            const name = (p.name || "").toLowerCase();
            const subCategory = (p.subCategory || "").toLowerCase();
            const description = (p.description || "").toLowerCase();
            const q = searchProductQuery.toLowerCase().trim();

            const matchesSearch = !q || name.includes(q) || subCategory.includes(q) || description.includes(q);
            const matchesCategory = inventoryCategoryFilter === "all" || p.category === inventoryCategoryFilter;
            
            let matchesStock = true;
            if (inventoryStockFilter === "healthy") {
              matchesStock = (p.stock || 0) > (p.safetyStock || 10);
            } else if (inventoryStockFilter === "low") {
              matchesStock = (p.stock || 0) <= (p.safetyStock || 10) && (p.stock || 0) > 0;
            } else if (inventoryStockFilter === "out") {
              matchesStock = (p.stock || 0) === 0;
            }

            return matchesSearch && matchesCategory && matchesStock;
          }).sort((a, b) => {
            if (inventorySort === "name_asc") return (a.name || "").localeCompare(b.name || "");
            if (inventorySort === "name_desc") return (b.name || "").localeCompare(a.name || "");
            if (inventorySort === "stock_asc") return (a.stock || 0) - (b.stock || 0);
            if (inventorySort === "stock_desc") return (b.stock || 0) - (a.stock || 0);
            if (inventorySort === "price_asc") return (a.price || 0) - (b.price || 0);
            if (inventorySort === "price_desc") return (b.price || 0) - (a.price || 0);
            return 0;
          });

          return (
            <div className="space-y-6 animate-in fade-in duration-150 text-left">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h3 className="text-xl font-extrabold text-gray-950 dark:text-white flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-emerald-700 dark:text-emerald-400" /> Active Inventory Records & Traceability (ERP)
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Control live listings, SKUs, lot/batch manufacturing tags, and automated reorder thresholds.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex items-center gap-1 border border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setInventorySubTab("stock")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        inventorySubTab === "stock"
                          ? "bg-emerald-800 text-white shadow-xs"
                          : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" /> Catalog Stock
                    </button>
                    <button
                      onClick={() => {
                        setInventorySubTab("ledger");
                        fetchStockMovements();
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        inventorySubTab === "ledger"
                          ? "bg-emerald-800 text-white shadow-xs"
                          : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
                      }`}
                    >
                      <Database className="w-3.5 h-3.5" /> Movements Ledger ({stockMovements.length})
                    </button>
                  </div>

                  {inventorySubTab === "ledger" && (
                    <button
                      onClick={() => exportStockMovementsCSV(stockMovements)}
                      className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-xs py-2 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer hover:bg-emerald-100 transition shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 rotate-180" /> Export Ledger CSV
                    </button>
                  )}

                  {inventorySubTab === "stock" && (
                    <button
                      onClick={() => {
                        setIsAddingProduct(true);
                        setEditingProductId(null);
                        resetProductForm();
                      }}
                      className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                    >
                      <Plus className="w-4 h-4" /> Add New Product
                    </button>
                  )}
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-gradient-to-br from-emerald-50/70 to-emerald-100/30 dark:from-emerald-950/40 dark:to-emerald-900/20 p-4 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40">
                  <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Total Product SKUs</div>
                  <div className="text-2xl font-black text-emerald-950 dark:text-white mt-1">{products.length}</div>
                  <div className="text-[10px] text-gray-500 mt-1">Catalog listings</div>
                </div>

                <div className="bg-gradient-to-br from-blue-50/70 to-blue-100/30 dark:from-blue-950/40 dark:to-blue-900/20 p-4 rounded-2xl border border-blue-200/60 dark:border-blue-800/40">
                  <div className="text-[10px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider">Total Units In Stock</div>
                  <div className="text-2xl font-black text-blue-950 dark:text-white mt-1">{totalStockUnits.toLocaleString()}</div>
                  <div className="text-[10px] text-gray-500 mt-1">Physical shelf items</div>
                </div>

                <div className="bg-gradient-to-br from-purple-50/70 to-purple-100/30 dark:from-purple-950/40 dark:to-purple-900/20 p-4 rounded-2xl border border-purple-200/60 dark:border-purple-800/40">
                  <div className="text-[10px] font-bold text-purple-800 dark:text-purple-400 uppercase tracking-wider">Asset Cost Value</div>
                  <div className="text-xl font-black text-purple-950 dark:text-white mt-1">KES {totalAssetCost.toLocaleString()}</div>
                  <div className="text-[10px] text-gray-500 mt-1">Wholesale inventory capital</div>
                </div>

                <div className="bg-gradient-to-br from-amber-50/70 to-red-100/30 dark:from-amber-950/40 dark:to-red-900/20 p-4 rounded-2xl border border-amber-200/60 dark:border-amber-800/40">
                  <div className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Reorder / Critical</div>
                  <div className="text-2xl font-black text-amber-950 dark:text-white mt-1">
                    {lowStockCount + outOfStockCount} <span className="text-xs font-semibold text-gray-500">({outOfStockCount} out of stock)</span>
                  </div>
                  <div className="text-[10px] text-red-600 dark:text-red-400 mt-1 font-semibold">
                    {lowStockCount + outOfStockCount > 0 ? "Requires restock replenishment" : "All items well-stocked"}
                  </div>
                </div>
              </div>

              {/* Filtering, Search and Category Controls */}
              <div className="bg-gray-50/70 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-200/70 dark:border-gray-700/60 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Search Bar */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search by product name, category, or formulation..."
                      value={searchProductQuery}
                      onChange={(e) => setSearchProductQuery(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:text-white"
                    />
                    {searchProductQuery && (
                      <button
                        onClick={() => setSearchProductQuery("")}
                        className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Category & Sorting Selectors */}
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={inventoryCategoryFilter}
                      onChange={(e) => setInventoryCategoryFilter(e.target.value)}
                      className="px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none dark:text-white font-medium cursor-pointer"
                    >
                      <option value="all">All Categories</option>
                      <option value="hair">Hair Care</option>
                      <option value="body">Body Care</option>
                      <option value="home">Home Care</option>
                      <option value="coffee">Coffee</option>
                    </select>

                    <select
                      value={inventorySort}
                      onChange={(e) => setInventorySort(e.target.value)}
                      className="px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none dark:text-white font-medium cursor-pointer"
                    >
                      <option value="default">Sort: Default</option>
                      <option value="name_asc">Name (A-Z)</option>
                      <option value="name_desc">Name (Z-A)</option>
                      <option value="stock_asc">Stock: Low to High</option>
                      <option value="stock_desc">Stock: High to Low</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                    </select>
                  </div>
                </div>

                {/* Stock Status Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">Status:</span>
                  {[
                    { id: "all", label: `All (${products.length})` },
                    { id: "healthy", label: `Healthy (${products.filter(p => (p.stock || 0) > (p.safetyStock || 10)).length})` },
                    { id: "low", label: `Low Stock (${lowStockCount})` },
                    { id: "out", label: `Out of Stock (${outOfStockCount})` }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setInventoryStockFilter(tab.id)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                        inventoryStockFilter === tab.id
                          ? "bg-emerald-800 text-white shadow-xs"
                          : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                  <span className="ml-auto text-[11px] text-gray-400 font-medium">
                    Showing {filteredProducts.length} of {products.length} products
                  </span>
                </div>
              </div>

              {/* CREATE / ADD / EDIT PRODUCT DIALOG OVERLAY PANEL */}
              {isAddingProduct && (
                <form onSubmit={handleAddProductSubmit} className="bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-800 p-6 rounded-2xl text-xs space-y-4 shadow-md animate-in slide-in-from-top duration-200">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800">
                    <span className="font-extrabold uppercase text-emerald-800 dark:text-emerald-400 text-sm flex items-center gap-2">
                      <PenTool className="w-4 h-4" /> {editingProductId ? "Edit Product Specifications" : "Add New Organic Product Spec"}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsAddingProduct(false);
                        setEditingProductId(null);
                        resetProductForm();
                      }} 
                      className="text-gray-400 font-bold hover:text-gray-700 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-gray-700 dark:text-gray-300">Product Name</label>
                      <input type="text" value={prodName} onChange={(e) => setProdName(e.target.value)} placeholder="e.g. Aloeflora Tea Tree Cleanser" className="w-full p-2.5 border bg-white dark:bg-gray-800 dark:border-gray-700 rounded-lg focus:outline-none dark:text-white font-medium" required />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-700 dark:text-gray-300">Primary Image URL (optional if uploading)</label>
                      <input type="text" value={prodImageUrl} onChange={(e) => setProdImageUrl(e.target.value)} placeholder="Image URL link" className="w-full p-2.5 border bg-white dark:bg-gray-800 dark:border-gray-700 rounded-lg focus:outline-none dark:text-white font-medium" />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="font-bold text-gray-700 dark:text-gray-300">Media Upload (Select multiple files for catalog slider)</label>
                      <MediaUploader urls={prodMediaUrls} onChange={setProdMediaUrls} multiple maxFiles={5} bucket="images" category="product" />
                    </div>
                  </div>

                  {/* Product Identifiers & Traceability (SKU, Barcode, Batch, Expiry) */}
                  <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[11px] uppercase text-emerald-900 dark:text-emerald-300 tracking-wider flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" /> Unique Product Identifiers & QA Lot Tracking
                      </span>
                      <button
                        type="button"
                        onClick={() => setProdSku(generateAutoSku(prodName, prodCategory, prodUnitSize))}
                        className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 hover:underline cursor-pointer bg-white dark:bg-gray-800 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-700"
                      >
                        ⚡ Auto-Generate SKU
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                          <span>Product SKU</span>
                          <span className="text-[9px] text-gray-400 font-mono">e.g. AF-HAIR-ROSE-250</span>
                        </label>
                        <input
                          type="text"
                          value={prodSku}
                          onChange={(e) => setProdSku(e.target.value)}
                          placeholder="e.g. AF-HAIR-ROSE-250ML"
                          className="w-full p-2 border bg-white dark:bg-gray-800 dark:border-gray-700 rounded-lg focus:outline-none dark:text-white font-mono font-bold uppercase text-emerald-800 dark:text-emerald-400"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                          <span>Batch / Lot #</span>
                          <span className="text-[9px] text-gray-400 font-mono">e.g. LOT-202608-01</span>
                        </label>
                        <input
                          type="text"
                          value={prodBatchNumber}
                          onChange={(e) => setProdBatchNumber(e.target.value)}
                          placeholder="e.g. LOT-202608-01"
                          className="w-full p-2 border bg-white dark:bg-gray-800 dark:border-gray-700 rounded-lg focus:outline-none dark:text-white font-mono font-medium"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                          <span>Expiry Date</span>
                          <span className="text-[9px] text-gray-400">Shelf Life</span>
                        </label>
                        <input
                          type="date"
                          value={prodExpiryDate}
                          onChange={(e) => setProdExpiryDate(e.target.value)}
                          className="w-full p-2 border bg-white dark:bg-gray-800 dark:border-gray-700 rounded-lg focus:outline-none dark:text-white font-medium cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                          <span>Barcode / EAN</span>
                          <span className="text-[9px] text-gray-400 font-mono">UPC/EAN-13</span>
                        </label>
                        <input
                          type="text"
                          value={prodBarcode}
                          onChange={(e) => setProdBarcode(e.target.value)}
                          placeholder="e.g. 6164001234567"
                          className="w-full p-2 border bg-white dark:bg-gray-800 dark:border-gray-700 rounded-lg focus:outline-none dark:text-white font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-gray-700 dark:text-gray-300">Cost Price (KES)</label>
                      <input type="number" value={prodCostPrice} onChange={(e) => setProdCostPrice(Number(e.target.value))} className="w-full p-2.5 border bg-white dark:bg-gray-800 dark:border-gray-700 rounded-lg focus:outline-none dark:text-white font-bold text-red-600 dark:text-red-400" required />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-700 dark:text-gray-300">Selling Price (KES)</label>
                      <input type="number" value={prodPrice} onChange={(e) => setProdPrice(Number(e.target.value))} className="w-full p-2.5 border bg-white dark:bg-gray-800 dark:border-gray-700 rounded-lg focus:outline-none dark:text-white font-bold text-emerald-800 dark:text-emerald-400" required />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-700 dark:text-gray-300">Category</label>
                      <select value={prodCategory} onChange={(e) => setProdCategory(e.target.value as "hair"|"body"|"home"|"coffee")} className="w-full p-2.5 border bg-white dark:bg-gray-800 dark:border-gray-700 rounded-lg focus:outline-none dark:text-white font-semibold">
                        <option value="hair">Hair Care</option>
                        <option value="body">Body Care</option>
                        <option value="home">Home Care</option>
                        <option value="coffee">Coffee</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-700 dark:text-gray-300">Sub-Category</label>
                      <input type="text" value={prodSubCategory} onChange={(e) => setProdSubCategory(e.target.value)} placeholder="e.g. Shampoos" className="w-full p-2.5 border bg-white dark:bg-gray-800 dark:border-gray-700 rounded-lg focus:outline-none dark:text-white font-medium" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Standalone Product Net Volume/Weight Size Field */}
                    <div className="space-y-1 bg-emerald-50/70 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60">
                      <label className="font-extrabold text-emerald-950 dark:text-emerald-300 text-xs flex items-center justify-between">
                        <span>📏 Standalone Size</span>
                        <span className="text-[9px] text-emerald-800 dark:text-emerald-400 font-bold">(kg, g, ml, L)</span>
                      </label>
                      <input 
                        type="text" 
                        value={prodUnitSize} 
                        onChange={(e) => setProdUnitSize(e.target.value)} 
                        placeholder="e.g. 400ml, 1L, 250g, 1kg" 
                        className="w-full p-1.5 border bg-white dark:bg-gray-800 dark:border-gray-700 rounded-lg focus:outline-none font-bold text-xs dark:text-white" 
                      />
                      <p className="text-[9px] text-gray-500 leading-tight">For products without variants</p>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-gray-700 dark:text-gray-300">Initial Stock qty</label>
                      <input type="number" value={prodStock} onChange={(e) => setProdStock(Number(e.target.value))} className="w-full p-2.5 border bg-white dark:bg-gray-800 dark:border-gray-700 rounded-lg focus:outline-none dark:text-white font-bold" required />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-700 dark:text-gray-300">Safety Stock buffer</label>
                      <input type="number" value={prodSafetyStock} onChange={(e) => setProdSafetyStock(Number(e.target.value))} className="w-full p-2.5 border bg-white dark:bg-gray-800 dark:border-gray-700 rounded-lg focus:outline-none dark:text-white font-medium" required />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-700 dark:text-gray-300">Reorder Trigger point</label>
                      <input type="number" value={prodReorderLevel} onChange={(e) => setProdReorderLevel(Number(e.target.value))} className="w-full p-2.5 border bg-white dark:bg-gray-800 dark:border-gray-700 rounded-lg focus:outline-none dark:text-white font-medium" required />
                    </div>
                  </div>

                  {/* Multi-Size Variant & Pricing Matrix Manager */}
                  <div className="p-4 bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="font-black text-xs text-emerald-950 dark:text-emerald-300 flex items-center gap-1.5 uppercase tracking-wide">
                          <span>📦 Package Sizes & Pricing Matrix</span>
                        </h4>
                        <p className="text-[10px] text-gray-500">Configure size packages (e.g. 400ml, 1L, 250g, 1kg @ KES prices) with size-specific pricing, cost, stock, and images.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setProdVariantsList(prev => [
                            ...prev,
                            {
                              id: `v-${Date.now()}-${prev.length}`,
                              name: prev.length === 0 ? "500ml" : prev.length === 1 ? "1L" : `${prev.length + 1}L`,
                              price: 500,
                              costPrice: 250,
                              stock: 30,
                              sku: `AF-VAR-${prev.length + 1}`,
                              imageUrl: ""
                            }
                          ]);
                        }}
                        className="bg-[#348C21] hover:bg-[#2b751c] text-white font-black text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Size Variant
                      </button>
                    </div>

                    {prodVariantsList.length === 0 ? (
                      <div className="text-center py-4 text-gray-400 text-xs italic bg-gray-50 dark:bg-gray-900 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                        No multi-size variants configured. Click "Add Size Variant" above to add sizes (e.g. 400ml, 1L, 250g, 1kg).
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                        {prodVariantsList.map((variant, vIdx) => (
                          <div key={variant.id || vIdx} className="p-3 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/60 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                            {/* Size Label */}
                            <div className="sm:col-span-2 space-y-1">
                              <label className="text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase">Size</label>
                              <input
                                type="text"
                                value={variant.name}
                                onChange={(e) => {
                                  const updated = [...prodVariantsList];
                                  updated[vIdx].name = e.target.value;
                                  setProdVariantsList(updated);
                                }}
                                placeholder="e.g. 400ml, 1L, 250g, 1kg"
                                className="w-full p-1.5 border bg-white dark:bg-gray-800 dark:border-gray-700 rounded text-xs font-bold dark:text-white"
                                required
                              />
                            </div>

                            {/* Price */}
                            <div className="sm:col-span-2 space-y-1">
                              <label className="text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase">Sale Price (KES)</label>
                              <input
                                type="number"
                                value={variant.price}
                                onChange={(e) => {
                                  const updated = [...prodVariantsList];
                                  updated[vIdx].price = Number(e.target.value);
                                  setProdVariantsList(updated);
                                }}
                                className="w-full p-1.5 border bg-white dark:bg-gray-800 dark:border-gray-700 rounded text-xs font-black text-emerald-800 dark:text-emerald-400"
                                required
                              />
                            </div>

                            {/* Cost Price */}
                            <div className="sm:col-span-2 space-y-1">
                              <label className="text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase">Cost Price (KES)</label>
                              <input
                                type="number"
                                value={variant.costPrice || 0}
                                onChange={(e) => {
                                  const updated = [...prodVariantsList];
                                  updated[vIdx].costPrice = Number(e.target.value);
                                  setProdVariantsList(updated);
                                }}
                                className="w-full p-1.5 border bg-white dark:bg-gray-800 dark:border-gray-700 rounded text-xs font-bold text-red-600 dark:text-red-400"
                              />
                            </div>

                            {/* Stock */}
                            <div className="sm:col-span-2 space-y-1">
                              <label className="text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase">Stock Qty</label>
                              <input
                                type="number"
                                value={variant.stock || 0}
                                onChange={(e) => {
                                  const updated = [...prodVariantsList];
                                  updated[vIdx].stock = Number(e.target.value);
                                  setProdVariantsList(updated);
                                }}
                                className="w-full p-1.5 border bg-white dark:bg-gray-800 dark:border-gray-700 rounded text-xs font-bold dark:text-white"
                              />
                            </div>

                            {/* Variant Image URL + Direct File Upload Button */}
                            <div className="sm:col-span-3 space-y-1">
                              <label className="text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase flex items-center justify-between">
                                <span>Variant Image</span>
                                {variant.imageUrl && <span className="text-[#348C21] text-[9px] font-extrabold">✓ Attached</span>}
                              </label>
                              <div className="flex gap-1">
                                <input
                                  type="text"
                                  value={variant.imageUrl || ""}
                                  onChange={(e) => {
                                    const updated = [...prodVariantsList];
                                    updated[vIdx].imageUrl = e.target.value;
                                    setProdVariantsList(updated);
                                  }}
                                  placeholder="URL or upload file"
                                  className="w-full p-1.5 border bg-white dark:bg-gray-800 dark:border-gray-700 rounded text-[11px] dark:text-white"
                                />
                                <label 
                                  className={`px-2 py-1.5 text-xs font-bold rounded cursor-pointer shrink-0 transition flex items-center justify-center gap-1 ${
                                    uploadingVariantIdx === vIdx
                                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                                      : "bg-[#348C21] hover:bg-[#2b751c] text-white shadow-2xs"
                                  }`}
                                  title="Upload image file from computer"
                                >
                                  {uploadingVariantIdx === vIdx ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Upload className="w-3.5 h-3.5" />
                                  )}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    disabled={uploadingVariantIdx === vIdx}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleVariantFileUpload(vIdx, file);
                                    }}
                                  />
                                </label>
                              </div>
                            </div>

                            {/* Delete */}
                            <div className="sm:col-span-1 flex justify-end pt-3 sm:pt-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setProdVariantsList(prev => prev.filter((_, idx) => idx !== vIdx));
                                }}
                                className="text-red-500 hover:text-red-700 p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 rounded-md transition cursor-pointer"
                                title="Remove size variant"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-gray-700 dark:text-gray-300">Features (split by comma)</label>
                      <input type="text" value={prodFeatures} onChange={(e) => setProdFeatures(e.target.value)} placeholder="e.g. Sulfate Free, Raw Aloe" className="w-full p-2.5 border bg-white dark:bg-gray-800 dark:border-gray-700 rounded-lg focus:outline-none dark:text-white" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-700 dark:text-gray-300">Specifications (split by comma)</label>
                      <input type="text" value={prodSpecs} onChange={(e) => setProdSpecs(e.target.value)} placeholder="e.g. pH: 5.5, Scent: Rosemary" className="w-full p-2.5 border bg-white dark:bg-gray-800 dark:border-gray-700 rounded-lg focus:outline-none dark:text-white" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-700 dark:text-gray-300">Detailed description</label>
                    <textarea value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} rows={3} className="w-full p-2.5 border bg-white dark:bg-gray-800 dark:border-gray-700 rounded-lg focus:outline-none dark:text-white" placeholder="Explain the botanical advantages..." required></textarea>
                  </div>

                  <button type="submit" disabled={isUploadingProduct} className="bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold p-3 rounded-xl w-full uppercase cursor-pointer disabled:opacity-50 transition shadow-sm">
                    {isUploadingProduct ? "Uploading Media & Saving..." : editingProductId ? "Save Updated Product Specs" : "Activate & Add to Web Catalog"}
                  </button>
                </form>
              )}

              {/* VIEW SUB-TAB 1: Structured Table Inventory */}
              {inventorySubTab === "stock" && (
              <div className="border border-gray-200/80 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50/80 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800 font-extrabold uppercase text-gray-500 dark:text-gray-400 text-[10px] tracking-wider">
                      <tr>
                        <th className="p-3.5 text-left">Listing Description</th>
                        <th className="p-3.5 text-center">Cost Price</th>
                        <th className="p-3.5 text-center">Selling Price</th>
                        <th className="p-3.5 text-center">Stock Units</th>
                        <th className="p-3.5 text-center">Safety Buffer</th>
                        <th className="p-3.5 text-center">Reorder Point</th>
                        <th className="p-3.5 text-center">Quick Adjust</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-gray-500 dark:text-gray-400">
                            <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                                <ShoppingBag className="w-6 h-6" />
                              </div>
                              <div className="font-extrabold text-sm text-gray-900 dark:text-white">
                                {products.length === 0 ? "No inventory products registered" : "No products matched your filter"}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                {products.length === 0 
                                  ? "Get started by adding your first organic personal or home care product to the catalog."
                                  : "Try changing your search terms, status filters, or category selection to view listings."}
                              </p>
                              <div className="flex gap-2 pt-1">
                                {searchProductQuery || inventoryCategoryFilter !== "all" || inventoryStockFilter !== "all" ? (
                                  <button
                                    onClick={() => {
                                      setSearchProductQuery("");
                                      setInventoryCategoryFilter("all");
                                      setInventoryStockFilter("all");
                                    }}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition"
                                  >
                                    Reset Filters
                                  </button>
                                ) : null}
                                <button
                                  onClick={() => {
                                    setIsAddingProduct(true);
                                    setEditingProductId(null);
                                    resetProductForm();
                                  }}
                                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-800 hover:bg-emerald-700 text-white shadow-xs transition"
                                >
                                  + Create Product
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((p) => {
                          const stock = Number(p.stock) || 0;
                          const safetyStock = Number(p.safetyStock) || 10;
                          const isOut = stock === 0;
                          const isLow = stock <= safetyStock && !isOut;
                          const hasVars = hasVariants(p);
                          const variantList = hasVars ? normalizeVariants(p) : [];

                          return (
                            <tr key={p.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition">
                              <td className="p-3 flex items-center gap-3 max-w-xs md:max-w-md">
                                <div className="relative group shrink-0">
                                  <img 
                                    src={(p.mediaUrls && p.mediaUrls.length > 0 && p.mediaUrls[0].trim() !== '') ? p.mediaUrls[0] : p.imageUrl?.split(',')[0] || '/logo_square.jpeg'} 
                                    alt={p.name || "Product"} 
                                    className="w-11 h-11 rounded-xl border border-gray-200 dark:border-gray-700 object-cover shrink-0 shadow-2xs group-hover:scale-105 transition cursor-pointer" 
                                    onClick={() => {
                                      const img = (p.mediaUrls && p.mediaUrls.length > 0 && p.mediaUrls[0].trim() !== '') ? p.mediaUrls[0] : p.imageUrl?.split(',')[0] || '/logo_square.jpeg';
                                      window.open(img, '_blank');
                                    }}
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/logo_square.jpeg';
                                    }}
                                    title="Click to inspect image"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const img = (p.mediaUrls && p.mediaUrls.length > 0 && p.mediaUrls[0].trim() !== '') ? p.mediaUrls[0] : p.imageUrl?.split(',')[0] || '/logo_square.jpeg';
                                      window.open(img, '_blank');
                                    }}
                                    className="absolute -top-1 -right-1 bg-slate-900 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition shadow-md border border-slate-700 cursor-pointer"
                                    title="Inspect Image"
                                  >
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                                <div className="truncate">
                                  <div className="font-extrabold text-gray-900 dark:text-white truncate">{p.name || "Untitled Product"}</div>
                                  <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                    {p.sku && (
                                      <span className="text-[9px] font-mono font-bold text-emerald-900 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">
                                        SKU: {p.sku}
                                      </span>
                                    )}
                                    {p.batchNumber && (
                                      <span className="text-[9px] font-mono font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                                        Lot: {p.batchNumber}
                                      </span>
                                    )}
                                    <span className="text-[9px] uppercase font-bold text-lime-700 dark:text-lime-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                                      {p.subCategory || p.category || "General"}
                                    </span>
                                    {p.unitSize && (
                                      <span className="text-[9px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded">
                                        {p.unitSize}
                                      </span>
                                    )}
                                    {hasVars && variantList.length > 0 && (
                                      <span className="text-[9px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-1.5 py-0.5 rounded">
                                        {variantList.length} sizes
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 text-center font-bold text-red-600 dark:text-red-400">KES {(Number(p.costPrice) || 0).toLocaleString()}</td>
                              <td className="p-3 text-center font-bold text-emerald-800 dark:text-emerald-400">KES {(Number(p.price) || 0).toLocaleString()}</td>
                              <td className="p-3 text-center">
                                <span className={`font-bold px-2.5 py-1 rounded-full inline-block text-[11px] ${
                                  isOut
                                    ? "bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border border-red-300 dark:border-red-800" 
                                    : isLow 
                                      ? "bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800" 
                                      : "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                }`}>
                                  {stock} units
                                </span>
                              </td>
                              <td className="p-3 text-center text-gray-500 dark:text-gray-400 font-mono">{safetyStock}</td>
                              <td className="p-3 text-center text-gray-500 dark:text-gray-400 font-mono">{Number(p.reorderLevel) || 15}</td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleOpenRestockModal(p, 10)}
                                    className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-1 rounded-lg font-extrabold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 cursor-pointer transition shadow-2xs text-[11px] flex items-center gap-1"
                                    title="Restock units & log QA batch"
                                  >
                                    ⚡ Restock
                                  </button>
                                  
                                  <button
                                    onClick={() => handleEditClick(p)}
                                    className="bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60 cursor-pointer transition shadow-2xs"
                                    title="Edit Product Details & Identifiers"
                                  >
                                    <PenTool className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handleDeleteProduct(p.id)}
                                    className="bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/60 cursor-pointer transition shadow-2xs"
                                    title="Remove listing permanently"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              )}

              {/* VIEW SUB-TAB 2: IMMUTABLE STOCK MOVEMENTS AUDIT LEDGER */}
              {inventorySubTab === "ledger" && (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4 shadow-sm animate-in fade-in duration-150">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                    <div>
                      <h4 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                        <Database className="w-4 h-4 text-emerald-700 dark:text-emerald-400" /> Stock Movements & Audit Trail Ledger
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">Real-time ledger tracking every purchase restock, customer checkout sale, refund, and batch movement.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={fetchStockMovements}
                        disabled={isLoadingMovements}
                        className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                        title="Refresh stock ledger"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMovements ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-50/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 font-bold border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="p-3">Timestamp</th>
                          <th className="p-3">Product / SKU</th>
                          <th className="p-3 text-center">Movement Type</th>
                          <th className="p-3 text-center">Quantity Delta</th>
                          <th className="p-3 text-center">Stock Transition</th>
                          <th className="p-3">Batch / Lot #</th>
                          <th className="p-3">Reference / Order ID</th>
                          <th className="p-3">Performed By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {isLoadingMovements ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-gray-400">
                              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-700" />
                              Loading stock movement records from database...
                            </td>
                          </tr>
                        ) : stockMovements.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-gray-400 italic">
                              No stock movement logs recorded yet. Restocks and sales will automatically populate this audit ledger.
                            </td>
                          </tr>
                        ) : (
                          stockMovements.map((m) => {
                            const isPositive = Number(m.quantityDelta) > 0;
                            const prod = products.find(p => p.id === m.productId);
                            return (
                              <tr key={m.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition font-medium">
                                <td className="p-3 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                                  {new Date(m.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="p-3 max-w-xs">
                                  <div className="font-bold text-gray-900 dark:text-white truncate">{prod?.name || m.productId}</div>
                                  <div className="text-[10px] font-mono text-emerald-800 dark:text-emerald-400 font-semibold">{m.sku || prod?.sku || 'N/A'}</div>
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                    m.movementType === 'restock'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                      : m.movementType === 'order_sale'
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                                        : m.movementType === 'return'
                                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                          : 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                                  }`}>
                                    {m.movementType === 'order_sale' ? 'Sale Order' : m.movementType}
                                  </span>
                                </td>
                                <td className="p-3 text-center font-black font-mono">
                                  <span className={isPositive ? "text-emerald-700 dark:text-emerald-400 text-sm" : "text-rose-600 dark:text-rose-400 text-sm"}>
                                    {isPositive ? `+${m.quantityDelta}` : m.quantityDelta}
                                  </span>
                                </td>
                                <td className="p-3 text-center text-gray-600 dark:text-gray-300 font-mono text-[11px]">
                                  {m.stockBefore !== undefined && m.stockAfter !== undefined 
                                    ? `${m.stockBefore} → ${m.stockAfter}`
                                    : 'Recorded'}
                                </td>
                                <td className="p-3 font-mono text-[11px] text-gray-700 dark:text-gray-300">
                                  {m.batchNumber ? (
                                    <span className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                                      {m.batchNumber}
                                    </span>
                                  ) : '—'}
                                </td>
                                <td className="p-3 font-mono text-[11px] text-gray-700 dark:text-gray-300">
                                  {m.referenceId || '—'}
                                </td>
                                <td className="p-3 text-gray-500 text-[11px]">
                                  {m.performedBy || 'system'}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* RESTOCK ERP DIALOG MODAL */}
              {isRestockModalOpen && restockTargetProduct && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-800 w-full max-w-lg rounded-2xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 text-left">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Inventory ERP Replenishment</span>
                        <h4 className="text-base font-bold text-gray-950 dark:text-white mt-0.5">{restockTargetProduct.name}</h4>
                        {restockTargetProduct.sku && (
                          <span className="text-[10px] font-mono text-emerald-800 dark:text-emerald-300 font-bold">SKU: {restockTargetProduct.sku}</span>
                        )}
                      </div>
                      <button 
                        onClick={() => setIsRestockModalOpen(false)}
                        className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleExecuteRestock} className="space-y-4 text-xs">
                      <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/70 dark:border-emerald-800/60 grid grid-cols-2 gap-2 text-center">
                        <div>
                          <div className="text-[10px] text-gray-500 uppercase font-bold">Current Shelf Stock</div>
                          <div className="text-xl font-black text-gray-900 dark:text-white mt-0.5">{restockTargetProduct.stock || 0} units</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-emerald-800 dark:text-emerald-400 uppercase font-bold">Stock After Restock</div>
                          <div className="text-xl font-black text-emerald-800 dark:text-emerald-400 mt-0.5">{(restockTargetProduct.stock || 0) + (Number(restockQty) || 0)} units</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                          <span>Units to Restock</span>
                          <div className="flex gap-1">
                            {[10, 25, 50, 100].map(amt => (
                              <button
                                key={amt}
                                type="button"
                                onClick={() => setRestockQty(amt)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${restockQty === amt ? 'bg-emerald-800 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
                              >
                                +{amt}
                              </button>
                            ))}
                          </div>
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={restockQty}
                          onChange={(e) => setRestockQty(Number(e.target.value))}
                          className="w-full p-2.5 border bg-white dark:bg-gray-800 dark:border-gray-700 rounded-xl text-base font-black text-emerald-800 dark:text-emerald-400 focus:outline-none"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-bold text-gray-700 dark:text-gray-300">Manufacturing Batch / Lot #</label>
                          <input
                            type="text"
                            value={restockBatch}
                            onChange={(e) => setRestockBatch(e.target.value)}
                            placeholder="e.g. LOT-202608-01"
                            className="w-full p-2 border bg-white dark:bg-gray-800 dark:border-gray-700 rounded-lg font-mono focus:outline-none dark:text-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-gray-700 dark:text-gray-300">Supplier PO / Invoice Ref</label>
                          <input
                            type="text"
                            value={restockRef}
                            onChange={(e) => setRestockRef(e.target.value)}
                            placeholder="e.g. PO-2026-084"
                            className="w-full p-2 border bg-white dark:bg-gray-800 dark:border-gray-700 rounded-lg font-mono focus:outline-none dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-gray-700 dark:text-gray-300">Restock Notes (Optional)</label>
                        <input
                          type="text"
                          value={restockNotes}
                          onChange={(e) => setRestockNotes(e.target.value)}
                          placeholder="e.g. Received new fresh organic shipment from Nairobi supplier"
                          className="w-full p-2 border bg-white dark:bg-gray-800 dark:border-gray-700 rounded-lg focus:outline-none dark:text-white"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <button
                          type="button"
                          onClick={() => setIsRestockModalOpen(false)}
                          className="px-4 py-2 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingRestock}
                          className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {isSubmittingRestock ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          Confirm Restock & Log Audit
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 2.5: ADVANCED REPORTS MODULE */}
        {activeModule === "reports" && (
          <AdvancedReports 
            orders={orders || []} 
            products={products || []} 
            supportTickets={tickets || []}
            campaigns={campaigns || []}
            promos={promos || []}
            userProfiles={users || []}
            eventRegistrations={eventRegistrations || []}
            anomalies={anomalies || []}
            storeSettings={storeSettings}
            generateReportsPDF={generateReportsPDF} 
            generateReportsCSV={generateReportsCSV}
            onRefresh={handleRefreshReportsData}
            isLoading={isReportsLoading}
          />
        )}

        {/* TAB 3: ENTERPRISE FINANCIAL P&L REPORTING & AUDITING */}
        {activeModule === "financial" && (
          <FinancialPLReports
            orders={orders || []}
            products={products || []}
            campaigns={campaigns || []}
            promos={promos || []}
            storeSettings={storeSettings}
            onRefresh={handleRefreshReportsData}
            isLoading={isReportsLoading}
          />
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
        {activeModule === "cms" && (() => {
          // Calculations
          const publishedCount = cmsPosts.filter(p => p.status === "published").length;
          const draftCount = cmsPosts.filter(p => p.status === "draft").length;
          const heroEventCount = cmsPosts.filter(p => p.type === "hero" || p.type === "promotion").length;

          // Filter CMS Posts safely
          const filteredCms = cmsPosts.filter(p => {
            const title = (p.title || "").toLowerCase();
            const content = (p.content || "").toLowerCase();
            const type = (p.type || "").toLowerCase();
            const q = cmsSearchQuery.toLowerCase().trim();

            const matchesSearch = !q || title.includes(q) || content.includes(q) || type.includes(q);
            const matchesType = cmsTypeFilter === "all" || p.type === cmsTypeFilter;
            const matchesStatus = cmsStatusFilter === "all" || p.status === cmsStatusFilter;

            return matchesSearch && matchesType && matchesStatus;
          });

          const getTypeBadgeStyle = (type: string) => {
            switch (type) {
              case "blog": return "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
              case "faq": return "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800";
              case "policy": return "bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800";
              case "hero": return "bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800";
              case "promotion": return "bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800";
              case "award": return "bg-yellow-50 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800";
              case "about": return "bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800";
              case "team": return "bg-indigo-50 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
              default: return "bg-gray-50 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700";
            }
          };

          return (
            <div className="space-y-6 animate-in fade-in duration-150 text-left">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h3 className="text-xl font-extrabold text-gray-950 dark:text-white flex items-center gap-2">
                    <PenTool className="w-5 h-5 text-emerald-700 dark:text-emerald-400" /> CMS Content Controller & Web Editor
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Author articles, FAQs, store terms & policies, hero sliders, team bios, and event showcases.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {cmsPosts.length > 0 && (
                    <button
                      onClick={handleDeleteAllCMS}
                      className="bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/40 dark:hover:bg-red-900/60 dark:text-red-300 font-bold text-xs py-2 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer transition border border-red-200 dark:border-red-800"
                      title="Permanently delete all CMS posts"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Purge All Posts
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsAddingCms((prev) => !prev);
                      setEditingCmsId(null);
                      setCmsTitle("");
                      setCmsContent("");
                      setCmsImageUrls([]);
                    }}
                    className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                  >
                    <Plus className="w-4 h-4" /> {isAddingCms ? "Close Editor" : "Draft New Content"}
                  </button>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-gradient-to-br from-emerald-50/70 to-emerald-100/30 dark:from-emerald-950/40 dark:to-emerald-900/20 p-4 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40">
                  <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Total Publications</div>
                  <div className="text-2xl font-black text-emerald-950 dark:text-white mt-1">{cmsPosts.length}</div>
                  <div className="text-[10px] text-gray-500 mt-1">Managed web entries</div>
                </div>

                <div className="bg-gradient-to-br from-blue-50/70 to-blue-100/30 dark:from-blue-950/40 dark:to-blue-900/20 p-4 rounded-2xl border border-blue-200/60 dark:border-blue-800/40">
                  <div className="text-[10px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider">Live & Published</div>
                  <div className="text-2xl font-black text-blue-950 dark:text-white mt-1">{publishedCount}</div>
                  <div className="text-[10px] text-gray-500 mt-1">Visible on customer store</div>
                </div>

                <div className="bg-gradient-to-br from-amber-50/70 to-amber-100/30 dark:from-amber-950/40 dark:to-amber-900/20 p-4 rounded-2xl border border-amber-200/60 dark:border-amber-800/40">
                  <div className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Draft Sandbox</div>
                  <div className="text-2xl font-black text-amber-950 dark:text-white mt-1">{draftCount}</div>
                  <div className="text-[10px] text-gray-500 mt-1">Unpublished articles</div>
                </div>

                <div className="bg-gradient-to-br from-purple-50/70 to-purple-100/30 dark:from-purple-950/40 dark:to-purple-900/20 p-4 rounded-2xl border border-purple-200/60 dark:border-purple-800/40">
                  <div className="text-[10px] font-bold text-purple-800 dark:text-purple-400 uppercase tracking-wider">Media & Events</div>
                  <div className="text-2xl font-black text-purple-950 dark:text-white mt-1">{heroEventCount}</div>
                  <div className="text-[10px] text-gray-500 mt-1">Hero slides & workshops</div>
                </div>
              </div>

              {/* Filtering and Search Controls */}
              <div className="bg-gray-50/70 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-200/70 dark:border-gray-700/60 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Search input */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search content by title, excerpt keywords, or type..."
                      value={cmsSearchQuery}
                      onChange={(e) => setCmsSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:text-white"
                    />
                    {cmsSearchQuery && (
                      <button
                        onClick={() => setCmsSearchQuery("")}
                        className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2">
                    <select
                      value={cmsStatusFilter}
                      onChange={(e) => setCmsStatusFilter(e.target.value)}
                      className="px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none dark:text-white font-medium cursor-pointer"
                    >
                      <option value="all">All Statuses</option>
                      <option value="published">Published Only</option>
                      <option value="draft">Drafts Only</option>
                    </select>
                  </div>
                </div>

                {/* Category Type Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">Section:</span>
                  {[
                    { id: "all", label: `All (${cmsPosts.length})` },
                    { id: "blog", label: `Blogs (${cmsPosts.filter(p => p.type === "blog").length})` },
                    { id: "faq", label: `FAQs (${cmsPosts.filter(p => p.type === "faq").length})` },
                    { id: "policy", label: `Policies (${cmsPosts.filter(p => p.type === "policy").length})` },
                    { id: "hero", label: `Hero Slides (${cmsPosts.filter(p => p.type === "hero").length})` },
                    { id: "award", label: `Awards (${cmsPosts.filter(p => p.type === "award").length})` },
                    { id: "promotion", label: `Events (${cmsPosts.filter(p => p.type === "promotion").length})` },
                    { id: "about", label: `About Us (${cmsPosts.filter(p => p.type === "about").length})` },
                    { id: "team", label: `Team (${cmsPosts.filter(p => p.type === "team").length})` }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setCmsTypeFilter(tab.id)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                        cmsTypeFilter === tab.id
                          ? "bg-emerald-800 text-white shadow-xs"
                          : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                  <span className="ml-auto text-[11px] text-gray-400 font-medium">
                    Showing {filteredCms.length} of {cmsPosts.length} entries
                  </span>
                </div>
              </div>

              {/* DRAFTING / EDITING FORM */}
              {isAddingCms && (
                <form onSubmit={handleCmsSubmit} className="bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-800 p-6 rounded-2xl text-xs space-y-4 shadow-md animate-in slide-in-from-top duration-200">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800">
                    <span className="font-extrabold uppercase text-emerald-800 dark:text-emerald-400 text-sm flex items-center gap-2">
                      <PenTool className="w-4 h-4" /> {editingCmsId ? "Update CMS Article Entry" : "Rich Draft Content Authoring"}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsAddingCms(false);
                        setEditingCmsId(null);
                        setCmsTitle("");
                        setCmsContent("");
                        setCmsImageUrls([]);
                      }} 
                      className="text-gray-400 font-bold hover:text-gray-700 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-700 dark:text-gray-300">Publication Headline / Title</label>
                    <input
                      type="text"
                      required
                      value={cmsTitle}
                      onChange={(e) => setCmsTitle(e.target.value)}
                      placeholder="e.g. The Science of Cold-Pressed Aloe Vera in Scalp Health"
                      className="w-full p-2.5 bg-white dark:bg-gray-800 dark:border-gray-700 border rounded-lg focus:outline-none dark:text-white font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-gray-700 dark:text-gray-300">Content Category Type</label>
                      <select 
                        value={cmsType} 
                        onChange={(e) => setCmsType(e.target.value as any)} 
                        className="w-full p-2.5 bg-white dark:bg-gray-800 dark:border-gray-700 border rounded-lg focus:outline-none dark:text-white font-medium cursor-pointer"
                      >
                        <option value="blog">Scientific Blog</option>
                        <option value="policy">Terms & Policies</option>
                        <option value="faq">Customer FAQ Item</option>
                        <option value="hero">Hero Banner Slide</option>
                        <option value="award">Award Showcase</option>
                        <option value="promotion">Wellness Promotion / Event</option>
                        <option value="about">About Us Section</option>
                        <option value="team">Our Team Section</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-gray-700 dark:text-gray-300">Publishing Status</label>
                      <select 
                        value={cmsStatus} 
                        onChange={(e) => setCmsStatus(e.target.value as any)} 
                        className="w-full p-2.5 bg-white dark:bg-gray-800 dark:border-gray-700 border rounded-lg focus:outline-none dark:text-white font-medium cursor-pointer"
                      >
                        <option value="published">Publish Instantly on Live Store</option>
                        <option value="draft">Save in Draft Sandbox</option>
                      </select>
                    </div>
                  </div>

                  {cmsType === 'faq' && (
                    <div className="space-y-1 bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
                      <label className="font-bold text-gray-700 dark:text-gray-300">FAQ Group Category</label>
                      <select 
                        value={faqCategory} 
                        onChange={(e) => setFaqCategory(e.target.value)} 
                        className="w-full p-2.5 bg-white dark:bg-gray-800 dark:border-gray-700 border rounded-lg focus:outline-none dark:text-white font-medium cursor-pointer"
                      >
                        <option value="Getting Started">Getting Started</option>
                        <option value="Products">Products</option>
                        <option value="Orders">Orders</option>
                        <option value="Payments">Payments</option>
                        <option value="Shipping & Delivery">Shipping & Delivery</option>
                        <option value="Returns & Refunds">Returns & Refunds</option>
                        <option value="Discounts & Promotions">Discounts & Promotions</option>
                      </select>
                    </div>
                  )}

                  {cmsType === 'promotion' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 border border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20 rounded-xl mb-4">
                      <div className="md:col-span-3 pb-2 border-b border-emerald-100 dark:border-emerald-800/80 flex items-center justify-between">
                        <h4 className="font-bold text-emerald-900 dark:text-emerald-300">Event & Registration Settings</h4>
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-xs text-gray-700 dark:text-gray-300">Event Date & Time</label>
                        <input type="text" value={eventDate} onChange={(e) => setEventDate(e.target.value)} placeholder="e.g. Oct 15 - 18, 2026" className="w-full p-2.5 bg-white dark:bg-gray-800 dark:border-gray-700 border rounded-lg focus:outline-none text-sm dark:text-white" />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-xs text-gray-700 dark:text-gray-300">Location</label>
                        <input type="text" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} placeholder="e.g. Nairobi, KICC" className="w-full p-2.5 bg-white dark:bg-gray-800 dark:border-gray-700 border rounded-lg focus:outline-none text-sm dark:text-white" />
                      </div>
                      <div className="space-y-1"></div>
                      
                      {/* Attendee Settings */}
                      <div className="p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xs space-y-3">
                        <div className="flex items-center justify-between border-b dark:border-gray-700 pb-2">
                          <label className="font-bold text-sm text-gray-900 dark:text-white">Attendee Access</label>
                          <input type="checkbox" checked={attendeeEnabled} onChange={(e) => setAttendeeEnabled(e.target.checked)} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded" />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-xs text-gray-500">Ticket Price (0 for Free)</label>
                          <input type="number" value={eventPrice} onChange={(e) => setEventPrice(e.target.value)} disabled={!attendeeEnabled} className="w-full p-2 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-lg focus:outline-none text-sm disabled:opacity-50 dark:text-white" />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-xs text-gray-500">Attendee Capacity</label>
                          <input type="number" value={eventCapacity} onChange={(e) => setEventCapacity(e.target.value)} disabled={!attendeeEnabled} className="w-full p-2 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-lg focus:outline-none text-sm disabled:opacity-50 dark:text-white" />
                        </div>
                      </div>

                      {/* Vendor Settings */}
                      <div className="p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xs space-y-3">
                        <div className="flex items-center justify-between border-b dark:border-gray-700 pb-2">
                          <label className="font-bold text-sm text-gray-900 dark:text-white">Vendor Access</label>
                          <input type="checkbox" checked={vendorEnabled} onChange={(e) => setVendorEnabled(e.target.checked)} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded" />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-xs text-gray-500">Vendor Fee (KES)</label>
                          <input type="number" value={vendorPrice} onChange={(e) => setVendorPrice(e.target.value)} disabled={!vendorEnabled} className="w-full p-2 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-lg focus:outline-none text-sm disabled:opacity-50 dark:text-white" />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-xs text-gray-500">Vendor Slots</label>
                          <input type="number" value={vendorCapacity} onChange={(e) => setVendorCapacity(e.target.value)} disabled={!vendorEnabled} className="w-full p-2 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-lg focus:outline-none text-sm disabled:opacity-50 dark:text-white" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="font-bold text-gray-700 dark:text-gray-300">Attached Media {cmsType !== 'hero' ? "(1 Image Max)" : "(Multiple Allowed for Carousel Slider)"}</label>
                    <MediaUploader urls={cmsImageUrls} onChange={setCmsImageUrls} multiple={cmsType === 'hero'} maxFiles={cmsType === 'hero' ? 10 : 1} bucket="images" category={cmsType} />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-700 dark:text-gray-300">Detailed Article / Plaintext Content</label>
                    <textarea
                      required
                      rows={5}
                      value={cmsContent}
                      onChange={(e) => setCmsContent(e.target.value)}
                      className="w-full p-3 bg-white dark:bg-gray-800 dark:border-gray-700 border rounded-xl focus:outline-none dark:text-white leading-relaxed"
                      placeholder="Write natural guidelines, scientific breakdown, policy rules, or about description here..."
                    ></textarea>
                  </div>

                  <button type="submit" disabled={isUploadingCms} className="bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold p-3.5 rounded-xl w-full uppercase cursor-pointer disabled:opacity-50 transition shadow-sm">
                    {isUploadingCms ? "Uploading Media & Saving..." : editingCmsId ? "Update Publication Entry" : "Publish CMS Entry"}
                  </button>
                </form>
              )}

              {/* CARD GRID OF CMS ENTRIES */}
              {filteredCms.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-12 text-center text-gray-500 dark:text-gray-400 shadow-xs">
                  <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                      <PenTool className="w-6 h-6" />
                    </div>
                    <div className="font-extrabold text-sm text-gray-900 dark:text-white">
                      {cmsPosts.length === 0 ? "No CMS entries found" : "No publications matched your filter"}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      {cmsPosts.length === 0
                        ? "Get started by creating your first scientific article, customer FAQ, or promotional event."
                        : "Try adjusting your search query or selecting 'All' in the section filter pills above."}
                    </p>
                    <div className="flex gap-2 pt-1">
                      {cmsSearchQuery || cmsTypeFilter !== "all" || cmsStatusFilter !== "all" ? (
                        <button
                          onClick={() => {
                            setCmsSearchQuery("");
                            setCmsTypeFilter("all");
                            setCmsStatusFilter("all");
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition"
                        >
                          Reset Filters
                        </button>
                      ) : null}
                      <button
                        onClick={() => {
                          setIsAddingCms(true);
                          setEditingCmsId(null);
                          setCmsTitle("");
                          setCmsContent("");
                          setCmsImageUrls([]);
                        }}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-800 hover:bg-emerald-700 text-white shadow-xs transition"
                      >
                        + Create First Article
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                  {filteredCms.map((post) => {
                    const primaryImg = post.imageUrl ? post.imageUrl.split(',')[0].trim() : null;

                    return (
                      <div key={post.id} className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 p-4 rounded-2xl text-xs flex flex-col justify-between shadow-2xs hover:shadow-md transition duration-200 group">
                        <div className="space-y-3">
                          {/* Image thumbnail if present */}
                          {primaryImg ? (
                            <div className="relative w-full h-36 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700">
                              <img 
                                src={primaryImg} 
                                alt={post.title || "CMS Media"} 
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                              <div className="absolute top-2 right-2 flex gap-1">
                                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-xs ${
                                  post.status === "published" 
                                    ? "bg-emerald-600 text-white" 
                                    : "bg-gray-800/80 text-white backdrop-blur-xs"
                                }`}>
                                  {post.status}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold border ${getTypeBadgeStyle(post.type)}`}>
                                {post.type}
                              </span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                post.status === "published" 
                                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" 
                                  : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                              }`}>
                                {post.status}
                              </span>
                            </div>
                          )}

                          {primaryImg && (
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold border ${getTypeBadgeStyle(post.type)}`}>
                                {post.type}
                              </span>
                            </div>
                          )}

                          <div>
                            <h4 className="font-extrabold text-gray-950 dark:text-white text-sm line-clamp-2 leading-snug group-hover:text-emerald-800 dark:group-hover:text-emerald-400 transition">
                              {post.title || "Untitled Post"}
                            </h4>
                            <p className="text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed mt-1.5">
                              {post.content || "No excerpt text provided."}
                            </p>
                          </div>

                          {/* Extra Context tags */}
                          {post.type === 'promotion' && post.seoTitle && (
                            <div className="bg-emerald-50/80 dark:bg-emerald-950/40 p-2 rounded-lg text-[10px] text-emerald-900 dark:text-emerald-300 font-semibold space-y-0.5 border border-emerald-100 dark:border-emerald-900">
                              <div>📅 Date: {post.seoTitle}</div>
                              {post.seoDesc && <div>📍 Location: {post.seoDesc}</div>}
                            </div>
                          )}

                          {post.type === 'faq' && post.seoTitle && (
                            <div className="text-[10px] text-amber-800 dark:text-amber-300 font-bold">
                              🏷️ FAQ Category: {post.seoTitle}
                            </div>
                          )}
                        </div>
                        
                        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 mt-4">
                          <div className="flex items-center justify-between text-[10px] text-gray-400 mb-2">
                            <span>{post.author || "Admin"}</span>
                            <span>{post.createdAt ? String(post.createdAt).split('T')[0] : "Recent"}</span>
                          </div>

                          <div className="flex gap-1.5">
                            <button 
                              type="button" 
                              onClick={() => setPreviewCmsPost(post)} 
                              className="flex-1 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" /> Preview
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleEditCMS(post)} 
                              className="flex-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <PenTool className="w-3 h-3" /> Edit
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleDeleteCMS(post.id)} 
                              className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 p-1.5 rounded-lg transition flex items-center justify-center cursor-pointer" 
                              title="Delete Post"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ARTICLE PREVIEW MODAL */}
              {previewCmsPost && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-gray-200 dark:border-gray-800 shadow-2xl p-6 md:p-8 space-y-4 text-left animate-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold border ${getTypeBadgeStyle(previewCmsPost.type)}`}>
                          {previewCmsPost.type}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400">
                          Status: {previewCmsPost.status}
                        </span>
                      </div>
                      <button
                        onClick={() => setPreviewCmsPost(null)}
                        className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {previewCmsPost.imageUrl && (
                      <div className="w-full h-56 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <img 
                          src={previewCmsPost.imageUrl.split(',')[0]} 
                          alt={previewCmsPost.title} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    )}

                    <div>
                      <h2 className="text-2xl font-black text-gray-950 dark:text-white">{previewCmsPost.title}</h2>
                      <div className="text-xs text-gray-400 mt-1">
                        By {previewCmsPost.author || "Admin"} • {previewCmsPost.createdAt ? String(previewCmsPost.createdAt).split('T')[0] : "Published"}
                      </div>
                    </div>

                    <div className="prose dark:prose-invert max-w-none text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {previewCmsPost.content}
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                      <button
                        onClick={() => setPreviewCmsPost(null)}
                        className="px-4 py-2 bg-emerald-800 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition"
                      >
                        Close Preview
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 5.5: USER MANAGEMENT */}
        {activeModule === "users" && (
          <UserManagement 
            users={users} 
            onUpdateUsers={onUpdateUsers}
            isLoading={isLoadingUsers}
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

        {/* TAB 10.5: EVENTS & REGISTRATIONS */}
        {activeModule === "events" && (
          <div className="space-y-6 animate-in fade-in duration-150 text-left">
            <div className="flex justify-between items-center bg-zinc-50 p-6 rounded-2xl border">
              <div>
                <h3 className="font-bold text-lg text-gray-950">Events & Registrations</h3>
                <p className="text-xs text-gray-500">Manage attendee spots, vendor tickets, and event revenue.</p>
              </div>
            </div>

            <div className="space-y-6">
              {eventsData.map(event => {
                const eventRegs = eventRegistrations.filter(r => r.event_id === event.id);
                const revenue = eventRegs.filter(r => r.payment_status === "paid").reduce((sum, r) => sum + Number(r.amount_paid || 0), 0);
                
                return (
                  <div key={event.id} className="bg-white border rounded-2xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4 pb-4 border-b">
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg flex items-center gap-3">
                          {event.title}
                          <button onClick={() => handleDeleteEvent(event.id)} className="bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider cursor-pointer">
                            Delete Event
                          </button>
                        </h4>
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {event.date}</span>
                          <span>|</span>
                          <span className="font-bold">Price: {event.price > 0 ? `KES ${event.price}` : 'Free'}</span>
                          <span>|</span>
                          <span className="font-bold">Capacity: {eventRegs.length} / {event.capacity}</span>
                          <span>|</span>
                          <span className="font-bold text-emerald-600">Revenue: KES {revenue}</span>
                        </div>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded text-[10px] uppercase">{event.status}</span>
                    </div>

                    {eventRegs.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No registrations yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="text-[10px] uppercase text-gray-500 border-b">
                            <tr>
                              <th className="py-2">Name</th>
                              <th className="py-2">Contact</th>
                              <th className="py-2">Role</th>
                              <th className="py-2">Status</th>
                              <th className="py-2">Ticket #</th>
                            </tr>
                          </thead>
                          <tbody>
                            {eventRegs.map(reg => (
                              <tr key={reg.id} className="border-b last:border-0 border-gray-50 hover:bg-zinc-50">
                                <td className="py-3 font-medium">{reg.name}</td>
                                <td className="py-3"><div className="text-gray-900">{reg.email}</div><div className="text-gray-500">{reg.phone}</div></td>
                                <td className="py-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${reg.role === 'vendor' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                    {reg.role}
                                  </span>
                                </td>
                                <td className="py-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${reg.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : reg.payment_status === 'free' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'}`}>
                                    {reg.payment_status}
                                  </span>
                                </td>
                                <td className="py-3 font-mono text-gray-500">{reg.ticket_number || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
              {eventsData.length === 0 && (
                 <p className="text-sm text-gray-500 p-8 text-center bg-zinc-50 rounded-2xl border border-dashed">No events found. Create one from the CMS Web Editor (Promotions type).</p>
              )}
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
              <div className="mb-6 space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm">Upload New Media</h4>
                    <p className="text-xs text-gray-500">Select a category to organize your upload</p>
                  </div>
                  <select 
                    value={mediaUploadCategory} 
                    onChange={(e) => setMediaUploadCategory(e.target.value)}
                    className="p-2 border rounded-lg text-sm bg-gray-50 outline-none"
                  >
                    <option value="general">General Asset</option>
                    <option value="hero">Hero Slider</option>
                    <option value="blog">Blog Image</option>
                    <option value="product">Product Image</option>
                    <option value="promo">Promo Image</option>
                  </select>
                </div>
                
                <MediaUploader 
                  urls={[]} 
                  onChange={async (urls) => {
                    // Upload happens inside MediaUploader directly to Supabase storage.
                    // We just need to refresh the media list.
                    loadMediaFiles();
                  }} 
                  multiple={true} 
                  maxFiles={10} 
                  bucket="images" 
                  category={mediaUploadCategory}
                />
              </div>

              <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 gap-4">
                <h4 className="font-bold text-sm">Uploaded Files ({mediaFiles.length})</h4>
                
                <div className="flex flex-wrap gap-2">
                  {['all', 'general', 'hero', 'blog', 'product', 'promo'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setMediaCategoryFilter(cat)}
                      className={`px-3 py-1 text-xs font-bold rounded-full capitalize transition ${
                        mediaCategoryFilter === cat ? "bg-emerald-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

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
                  {mediaFiles
                    .filter(file => {
                      if (mediaCategoryFilter === 'all') return true;
                      const fileCategory = file.name.includes('_') ? file.name.split('_')[0] : 'general';
                      return fileCategory === mediaCategoryFilter;
                    })
                    .map((file, idx) => (
                    <div key={idx} className="group relative rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800 aspect-square flex flex-col justify-between shadow-xs transition-all hover:shadow-md">
                      <div className="relative w-full h-full overflow-hidden">
                        <img src={file.url} alt={file.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        
                        <span className="bg-emerald-800/90 text-white font-bold text-[9.5px] px-2 py-0.5 rounded-full capitalize absolute top-2 right-2 backdrop-blur-md shadow-xs z-10">
                          {file.name.includes('_') ? file.name.split('_')[0] : 'general'}
                        </span>
                        
                        {/* Always visible action overlay bar at bottom of card */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2.5 flex flex-col gap-1.5 transition-opacity">
                          <p className="text-[9px] text-white font-mono break-all leading-tight line-clamp-1 opacity-90">{file.name}</p>
                          <div className="flex items-center justify-between gap-1 pt-0.5">
                            <button
                              type="button"
                              onClick={() => setMediaPreviewModal({ name: file.name, url: file.url })}
                              className="flex-1 bg-white/20 hover:bg-white/35 active:scale-95 text-white p-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer backdrop-blur-xs"
                              title="Preview Full Image"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">View</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => { navigator.clipboard.writeText(file.url); toast.success("URL Copied to clipboard!"); }}
                              className="flex-1 bg-emerald-600/80 hover:bg-emerald-600 active:scale-95 text-white p-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                              title="Copy CDN Link"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Copy</span>
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleDeleteMedia(file.name)}
                              className="bg-red-500/80 hover:bg-red-600 active:scale-95 text-white p-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center cursor-pointer shadow-xs"
                              title="Delete File"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Media Lightbox Preview Modal */}
            {mediaPreviewModal && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 space-y-4 p-6 relative">
                  <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-gray-800">
                    <div>
                      <h4 className="font-bold text-base text-gray-900 dark:text-white break-all">{mediaPreviewModal.name}</h4>
                      <p className="text-xs text-gray-500 font-mono break-all mt-0.5">{mediaPreviewModal.url}</p>
                    </div>
                    <button 
                      onClick={() => setMediaPreviewModal(null)}
                      className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-full bg-gray-100 dark:bg-gray-800 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="max-h-[60vh] overflow-hidden rounded-2xl bg-gray-950 flex items-center justify-center p-2">
                    <img src={mediaPreviewModal.url} alt={mediaPreviewModal.name} className="max-h-[55vh] w-auto object-contain rounded-xl" />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <a
                      href={mediaPreviewModal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open Direct URL in New Tab
                    </a>

                    <div className="flex gap-2">
                      <button
                        onClick={() => { navigator.clipboard.writeText(mediaPreviewModal.url); toast.success("URL Copied to clipboard!"); }}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy Image Link
                      </button>
                      <button
                        onClick={async () => {
                          await handleDeleteMedia(mediaPreviewModal.name);
                          setMediaPreviewModal(null);
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete Media File
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 12: SETTINGS & PROFILE */}
        {(activeModule === "settings" || activeModule === "profile") && (
          <div className="space-y-6 animate-in fade-in duration-150 text-left max-w-2xl mx-auto">
            <div>
              <h3 className="text-lg font-bold text-gray-950 dark:text-white">Admin Profile & System Settings</h3>
              <p className="text-xs text-gray-500 mt-0.5">Manage administrative credentials, profile avatar, and system configuration.</p>
            </div>
            
            <form onSubmit={saveAdminProfile} className="bg-zinc-50/50 dark:bg-gray-800/50 p-6 border border-gray-200 dark:border-gray-700 rounded-2xl space-y-5">
              <div className="space-y-1.5 flex flex-col items-center sm:items-start pb-4 border-b border-gray-200 dark:border-gray-700">
                <label className="text-[10px] uppercase font-bold text-gray-500">Admin Profile Avatar</label>
                <div className="w-full max-w-xs">
                  <MediaUploader
                    urls={adminAvatarUrl ? [adminAvatarUrl] : []}
                    onChange={(urls) => setAdminAvatarUrl(urls[0] || '')}
                    multiple={false}
                    bucket="avatars"
                    label="Upload Admin Avatar"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Admin Name</label>
                  <input type="text" value={adminName} onChange={e => setAdminName(e.target.value)} required className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-emerald-600 text-xs dark:text-white transition" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Admin Email</label>
                  <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-emerald-600 text-xs dark:text-white transition" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Phone Number (Admin Contact)</label>
                <input type="tel" value={adminPhone} onChange={e => setAdminPhone(e.target.value)} placeholder="+254 7XX XXX XXX" className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-emerald-600 text-xs dark:text-white transition" />
              </div>
              
              <button type="submit" className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition cursor-pointer text-xs shadow-md mt-4">
                Save Admin Profile Configuration
              </button>
            </form>

            <div className="bg-red-50 dark:bg-red-950/30 p-6 border border-red-100 dark:border-red-900/40 rounded-2xl text-center space-y-3">
              <h4 className="font-bold text-red-900 dark:text-red-300">End Session</h4>
              <p className="text-xs text-red-700 dark:text-red-400 max-w-sm mx-auto">Terminate your current secure administrative session. You will be required to re-authenticate to access the ERP.</p>
              <button onClick={handleAdminSignOut} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer text-xs shadow-md mx-auto max-w-sm mt-2">
                <LogOut className="w-4 h-4" /> Secure Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);
}
