export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "hair" | "body" | "home";
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
  status: "active" | "scheduled" | "paused" | "completed";
  budget: number;
  impressions: number;
  clicks: number;
  conversions: number;
  startDate: string;
  endDate: string;
  roi: number; // calculated as (revenue - budget) / budget * 100
}

export interface BookingEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  imageUrl: string;
  capacity: number;
  registrantCount: number;
  registrants: {
    name: string;
    email: string;
    phone: string;
    registeredAt: string;
  }[];
  status: "upcoming" | "active" | "passed";
}

export interface CMSPost {
  id: string;
  title: string;
  content: string;
  type: "blog" | "testimonial" | "policy" | "faq" | "promo";
  status: "draft" | "published";
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

export interface SEOConfig {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  structuredDataJson: string;
  robotsText: string;
  sitemapGeneratedAt: string;
}
