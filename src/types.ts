export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  costPrice: number;
  category: "hair" | "body" | "home" | "coffee";
  subCategory: string;
  imageUrl: string;
  stock: number;
  safetyStock: number;
  reorderLevel: number;
  rating: number;
  reviewsCount: number;
  reviews: ProductReview[];
  variants?: string[];
  features?: string[];
  mediaUrls?: string[];
  specifications?: string[];
}

export interface ProductReview {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: string;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  county: string;
  subCounty: string;
  estate: string;
  building?: string;
  houseNumber?: string;
  deliveryNotes?: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    costPrice?: number;
    selectedVariant?: string;
  }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: "mpesa_stk" | "mpesa_paybill";
  paymentStatus: "pending" | "paid" | "failed";
  mpesaReceipt?: string;
  deliveryStatus: "pending" | "dispatched" | "delivered" | "cancelled";
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
  replies: {
    sender: "admin" | "customer";
    message: string;
    timestamp: string;
  }[];
}

export interface MarketingCampaign {
  id: string;
  name: string;
  platform: "Google Ads" | "Meta Ads" | "Instagram Ads" | "Facebook Ads" | "Email";
  status: "active" | "scheduled" | "paused" | "completed" | "draft";
  budget: number;
  impressions: number;
  clicks: number;
  conversions: number;
  startDate: string;
  endDate: string;
  roi: number; // calculated as (revenue - budget) / budget * 100
  subject?: string;
  audience?: string;
  openRate?: number;
  sentCount?: number;
  deliveryRate?: number;
}

export interface Promo {
  id: string;
  code: string;
  discountPercent: number;
  isActive: boolean;
  createdAt: string;
}

export interface BookingEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  location: string;
  description: string;
  imageUrl?: string;
  capacity: number;
  price: number;
  vendor_enabled?: boolean;
  vendor_price?: number;
  vendor_capacity?: number;
  attendee_enabled?: boolean;
  attendee_price?: number;
  status: "upcoming" | "active" | "passed" | "draft";
  created_at?: string;
  registrants?: { email: string }[];
  registrantCount?: number;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id?: string;
  role: "attendee" | "vendor";
  name: string;
  email: string;
  phone: string;
  payment_status: "free" | "pending" | "paid" | "failed";
  amount_paid: number;
  ticket_number?: string;
  mpesa_receipt?: string;
  created_at?: string;
}

export interface CMSPost {
  id: string;
  title: string;
  content: string;
  type: "blog" | "testimonial" | "policy" | "faq" | "promo" | "promotion" | "hero" | "award" | "about" | "team";
  status: "draft" | "published";
  imageUrl?: string;
  author: string;
  createdAt: string;
  seoTitle?: string;
  seoDesc?: string;
  seoKeywords?: string;
}

export interface DevOpsLog {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error";
  service: "api" | "database" | "payment" | "auth" | "cdn";
  message: string;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  databaseLatency: number;
  activeSessions: number;
  requestCount: number;
}

export interface AuditAnomaly {
  id: string;
  type: "stock_discrepancy" | "suspicious_payment" | "price_mismatch" | "rate_limit_trip";
  severity: "low" | "medium" | "high";
  message: string;
  timestamp: string;
  status: "unresolved" | "dismissed" | "resolved";
  resolvedBy?: string;
}

export interface StoreSettings {
  id?: string;
  adminName: string;
  adminEmail: string;
  seoTitle: string;
  seoDesc: string;
  seoKeywords: string;
  seoRobots: string;
  sitemapGeneratedAt: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  address?: string;
  hairType?: string;
  skinType?: string;
  wishlist?: string[];
  cart?: CartItem[];
  loyaltyPoints?: number;
  role: "admin" | "customer" | "moderator";
  accountStatus: "active" | "suspended" | "locked";
  createdAt: string;
  lastLogin?: string;
  totalSpending: number;
  orderCount: number;
}

export interface ReportExportData {
  title: string;
  columns: string[];
  rows: any[][];
}
