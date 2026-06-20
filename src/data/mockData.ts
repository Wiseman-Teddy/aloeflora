import { Product, Order, SupportTicket, MarketingCampaign, BookingEvent, CMSPost, DevOpsLog, AuditAnomaly, StoreSettings } from "../types";

export const CUSTOMER_RATING_ACCENTS = [
  "Deep forest fragrance",
  "High aloe concentration",
  "Incredible slip and hydration",
  "Lovely lavender undertones",
  "Extremely gentle on natural hair",
  "Affordable bulk packaging"
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Aloeflora Pure Aloe Vera Gel Shampoo",
    description: "Formulated with 85% raw organic Aloe juice sourced from local Kenyan farms. Restores natural moisture, repairs damaged hair cuticles, and relieves dry, itchy scalp. Sulfate-free and color-safe.",
    price: 850, costPrice: 382,
    category: "hair",
    subCategory: "Shampoos",
    imageUrl: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&q=80&w=600",
    stock: 45,
    safetyStock: 15,
    reorderLevel: 20,
    rating: 4.8,
    reviewsCount: 124,
    variants: ["250ml", "500ml", "1 Liter"],
    features: ["85% Pure Aloe Vera Extract", "Organic Rosemary Oil", "Sulfate-Free", "Rich nourishing lather"],
    mediaUrls: ["https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&q=80&w=600"],
    specifications: ["pH: 5.5", "Scent: Rosemary", "Texture: Gel"],
    reviews: [
      { id: "r1", author: "Amani Wanjiku", rating: 5, comment: "This shampoo completely resolved my scalp itchiness within two washes. High quality African hair care!", date: "2026-06-10" },
      { id: "r2", author: "Derrick Kiprop", rating: 4, comment: "Smells wonderful and leaves natural curls soft. I pair it with the deep growth oil.", date: "2026-06-08" }
    ]
  },
  {
    id: "p2",
    name: "Aloeflora Hydrating Aloe & Avocado Conditioner",
    description: "An ultra-creamy deep conditioning treatment blending fresh avocado oil with concentrated aloe pulp. Delivers intense slip for easy detangling, preventing hair breakage during wash days.",
    price: 900, costPrice: 405,
    category: "hair",
    subCategory: "Conditioners",
    imageUrl: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&q=80&w=600",
    stock: 32,
    safetyStock: 10,
    reorderLevel: 15,
    rating: 4.9,
    reviewsCount: 98,
    variants: ["250ml", "500ml"],
    features: ["Cold-pressed Avocado Oil", "Max slip detangling", "Intense hydration lock", "pH Balanced 4.5"],
    reviews: [
      { id: "r3", author: "Zahra Hassan", rating: 5, comment: "Comb slips through my 4C hair effortlessly after leaving this on for 10 minutes. A absolute miracle product.", date: "2026-06-05" }
    ]
  },
  {
    id: "p3",
    name: "Aloeflora Aloe & Castor Growth Hair Oil",
    description: "A signature hair nutrient stimulant sealing ends, moisturizing roots, and stimulating rapid volume. Infused with black castor oil, herbal aloe peptides, and Kenyan peppermint oil.",
    price: 1200, costPrice: 540,
    category: "hair",
    subCategory: "Oils",
    imageUrl: "https://images.unsplash.com/photo-1608248597481-496100c8c836?auto=format&fit=crop&q=80&w=600",
    stock: 8, // triggers low stock warning!
    safetyStock: 10,
    reorderLevel: 12,
    rating: 4.7,
    reviewsCount: 156,
    variants: ["100ml", "200ml"],
    features: ["Nairobi Peppermint Stimulant", "Dense Black Castor Seeds", "Aloe Peptides", "Rich in Omega 9 fatty acids"],
    reviews: [
      { id: "r4", author: "Doris Akinyi", rating: 5, comment: "My edges are filling in beautifully! Applied every other night. Best natural oil Kenya has to offer.", date: "2026-06-12" }
    ]
  },
  {
    id: "p4",
    name: "Aloeflora Nourishing Herbal Growth Cream",
    description: "Daily leave-in hydration styling butter containing shea butter, wild aloe leaf infusion, and hibiscus extract. Holds moisture for up to 72 hours, excellent for twists, braids, and blowouts.",
    price: 950, costPrice: 427,
    category: "hair",
    subCategory: "Hair Creams",
    imageUrl: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&q=80&w=600",
    stock: 60,
    safetyStock: 15,
    reorderLevel: 20,
    rating: 4.6,
    reviewsCount: 74,
    variants: ["250g", "400g"],
    features: ["Raw Shea Butter base", "Nourishing Hibiscus Extract", "Non-greasy long-last style", "Ideal for protective styles"],
    reviews: []
  },
  {
    id: "p5",
    name: "Aloeflora Aloe Calendula Moisturizing Soap",
    description: "Handcrafted natural herbal bath bar blending anti-inflammatory Calendula flowers with cold-pressed olive oils and high-purity aloe soap base. Gently regenerates dry, sensitive, or eczema-prone skin.",
    price: 350, costPrice: 157,
    category: "body",
    subCategory: "Soaps",
    imageUrl: "https://images.unsplash.com/photo-1607006342411-1a9330b6b21c?auto=format&fit=crop&q=80&w=600",
    stock: 120,
    safetyStock: 25,
    reorderLevel: 30,
    rating: 4.8,
    reviewsCount: 215,
    variants: ["Standard Bar", "Double Pack"],
    features: ["Kenya Calendula Petals", "Moisturizing Olive Oils Base", "Suitable for highly sensitive skin", "Biodegradable natural lather"],
    reviews: [
      { id: "r5", author: "Gathoni Njuguna", rating: 5, comment: "My skin eczema cleared completely. So soft and doesn't dry you out like industrial soaps. I buy in packs of 5.", date: "2026-06-01" }
    ]
  },
  {
    id: "p6",
    name: "Aloeflora Ultra-Shea Hydrating Body Lotion",
    description: "Intense deep restoration body moisturizer infused with cold-pressed cocoa butter, multi-vitamin aloe concentrate, and Kenyan macadamia seed oils. Absorbs fast with a velvety premium finish.",
    price: 750, costPrice: 337,
    category: "body",
    subCategory: "Lotions",
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=600",
    stock: 55,
    safetyStock: 15,
    reorderLevel: 20,
    rating: 4.7,
    reviewsCount: 142,
    variants: ["200ml", "400ml"],
    features: ["West African Cocoa Butter", "Kenya Macadamia Hydration", "Intense Vitamin E & B5", "Light weight satin feel"],
    reviews: []
  },
  {
    id: "p7",
    name: "Aloeflora Calming Lavender Aloe Body Oil",
    description: "Luxurious dry body glow oil soothing muscles and locking in hydration after showers. Features organic aloe juice and french lavender buds, ideal for relaxing body therapies.",
    price: 1100, costPrice: 495,
    category: "body",
    subCategory: "Body Oils",
    imageUrl: "https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=600",
    stock: 25,
    safetyStock: 8,
    reorderLevel: 10,
    rating: 4.9,
    reviewsCount: 63,
    variants: ["150ml"],
    features: ["Therapeutic French Lavender Oil", "Antioxidant Rich Argan Oil", "Instant dry absorption", "Premium calming aromatherapy"],
    reviews: []
  },
  {
    id: "p8",
    name: "Aloeflora Aloe Mint Refining Exfoliating Scrub",
    description: "Revitalizing face and body micro-exfoliant made from crushed walnut shells, fine sugar crystals, concentrated aloe extract, and spearmint essential oil. Buffs dry skin to reveal polished radiance.",
    price: 800, costPrice: 360,
    category: "body",
    subCategory: "Scrubs",
    imageUrl: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=80&w=600",
    stock: 19,
    safetyStock: 10,
    reorderLevel: 12,
    rating: 4.5,
    reviewsCount: 45,
    variants: ["200g"],
    features: ["Natural Walnut Shell Powder", "Cool Spearmint Tingle", "Soothing Aloe Moisture Barrier", "Gentle non-abrasive action"],
    reviews: []
  },
  {
    id: "p9",
    name: "Aloeflora Aloe Vera Lavender Air Freshener",
    description: "Eco-friendly, water-based household room spray neutralizing heavy kitchen or bathroom odors instantly. Crafted with pure lavender hydrosol and organic aloe enzymes.",
    price: 500, costPrice: 225,
    category: "home",
    subCategory: "Air Fresheners",
    imageUrl: "https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?auto=format&fit=crop&q=80&w=600",
    stock: 5, // triggers low stock warning!
    safetyStock: 8,
    reorderLevel: 10,
    rating: 4.6,
    reviewsCount: 88,
    variants: ["250ml", "500ml Refill"],
    features: ["Water-based Aerosol Free", "True Lavender Hydrosol", "Natural Bio-enzyme Odor eliminator", "Safe for pets and children"],
    reviews: []
  },
  {
    id: "p10",
    name: "Aloeflora Bio-Degradable Pine Multi-Cleaner",
    description: "A tough, concentrated natural surface disinfectant stripping kitchen grease and floor grime with the power of pine needles oil, citrus extracts, and natural saponified aloe. No harsh chemical gases.",
    price: 650, costPrice: 292,
    category: "home",
    subCategory: "Cleaning Products",
    imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=600",
    stock: 40,
    safetyStock: 10,
    reorderLevel: 15,
    rating: 4.8,
    reviewsCount: 110,
    variants: ["500ml", "1 Liter", "5 Liter Gallon"],
    features: ["Concentrated natural sap", "Kenyan Pine Essential Oil", "Non-toxic biodegradable surfs", "Zero chlorine or phosphates"],
    reviews: [
      { id: "r6", author: "Kamau Mwangi", rating: 5, comment: "Hands down the best floor cleaner. Smells amazing like Kenyan forests, and is absolutely non-chemical. Toddler safe!", date: "2026-06-11" }
    ]
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: "ORD-9281",
    customerName: "Njeri Mwangi",
    phone: "+254711223344",
    email: "njeri.mwangi@gmail.com",
    county: "Nairobi",
    subCounty: "Westlands",
    estate: "Kitisuru Lane",
    building: "Kitisuru Heights",
    houseNumber: "A4",
    items: [
      { productId: "p1", productName: "Aloeflora Pure Aloe Vera Gel Shampoo", quantity: 2, price: 850, costPrice: 382 },
      { productId: "p3", productName: "Aloeflora Aloe & Castor Growth Hair Oil", quantity: 1, price: 1200, costPrice: 540 }
    ],
    subtotal: 2900,
    deliveryFee: 250, // Outside CBD
    total: 3150,
    paymentMethod: "mpesa_stk",
    paymentStatus: "paid",
    deliveryStatus: "delivered",
    mpesaReceipt: "QFL98HA8F1",
    createdAt: "2026-06-14T10:15:30Z"
  },
  {
    id: "ORD-8941",
    customerName: "Brian Ochieng",
    phone: "+254702283637",
    email: "brian.ochieng@outlook.com",
    county: "Nairobi",
    subCounty: "Starehe (CBD)",
    estate: "Moia Avenue",
    building: "Trust Tower",
    houseNumber: "Floor 4, Suite 12",
    items: [
      { productId: "p5", productName: "Aloeflora Aloe Calendula Moisturizing Soap", quantity: 5, price: 350, costPrice: 157 },
      { productId: "p10", productName: "Aloeflora Bio-Degradable Pine Multi-Cleaner", quantity: 1, price: 650, costPrice: 292 }
    ],
    subtotal: 2400,
    deliveryFee: 0, // CBD Nairobi Delivery Free
    total: 2400,
    paymentMethod: "mpesa_paybill",
    paymentStatus: "paid",
    deliveryStatus: "dispatched",
    mpesaReceipt: "QFZ42JL9B1",
    createdAt: "2026-06-14T15:40:00Z"
  },
  {
    id: "ORD-7312",
    customerName: "Faith Chepngetich",
    phone: "+254722556677",
    email: "faith.chep@gmail.com",
    county: "Nairobi",
    subCounty: "Langata",
    estate: "Karen Estates",
    building: "Acacia Villas",
    houseNumber: "Gate 14",
    items: [
      { productId: "p2", productName: "Aloeflora Hydrating Aloe & Avocado Conditioner", quantity: 1, price: 900, costPrice: 405 },
      { productId: "p6", productName: "Aloeflora Ultra-Shea Hydrating Body Lotion", quantity: 1, price: 750, costPrice: 337 }
    ],
    subtotal: 1650,
    deliveryFee: 300, // Karen higher tier Outside CBD
    total: 1950,
    paymentMethod: "mpesa_stk",
    paymentStatus: "pending",
    deliveryStatus: "pending",
    createdAt: "2026-06-15T06:20:15Z"
  }
];

export const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: "TCK-5120",
    customerName: "Esther Wambui",
    email: "esther.wambui@yahoo.com",
    phone: "+254799887766",
    subject: "Bulk Order Discount inquiry",
    message: "Hi Aloeflora team, I was looking to purchase 50 units of the Aloe Calendula Moisturizing Soap for a skin care spa in Nairobi. Do you have bulk discounts or wholesale prices?",
    status: "open",
    createdAt: "2026-06-14T08:30:00Z",
    replies: []
  },
  {
    id: "TCK-4819",
    customerName: "Geoffrey Otieno",
    email: "geoff.ot@gamil.com",
    phone: "+254734123456",
    subject: "M-PESA transaction stalled during checkout",
    message: "Tried doing STK checkout but Safari connection was slow. I received the Mpesa confirmation but the site didn't redirect. My reference is QFL83G65F.",
    status: "in_progress",
    createdAt: "2026-06-13T16:12:00Z",
    replies: [
      { sender: "admin", message: "Hello Geoffrey, thank you for reaching out. We have verified transaction QFL83G65F and matched it in our Safaricom Daraja ledger. Your order is now marked as Paid and dispatched!", timestamp: "2026-06-14T09:00:00Z" }
    ]
  }
];

export const INITIAL_CAMPAIGNS: MarketingCampaign[] = [
  {
    id: "CMP-01",
    name: "Nairobi Eco Hair Care Launch",
    platform: "Meta Ads",
    status: "active",
    budget: 15000,
    impressions: 48500,
    clicks: 4500,
    conversions: 245,
    startDate: "2026-06-01",
    endDate: "2026-06-30",
    roi: 185.5 // (245 * 850 revenue - 15000) / 15000 * 100
  },
  {
    id: "CMP-02",
    name: "Pure Aloe Moisturizers Google Push",
    platform: "Google Ads",
    status: "active",
    budget: 25000,
    impressions: 82000,
    clicks: 6800,
    conversions: 370,
    startDate: "2026-06-05",
    endDate: "2026-06-25",
    roi: 215.2
  },
  {
    id: "CMP-03",
    name: "Affordable Home Care Campaign",
    platform: "Instagram Ads",
    status: "scheduled",
    budget: 10000,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    startDate: "2026-06-20",
    endDate: "2026-07-05",
    roi: 0
  }
];

export const INITIAL_EVENTS: BookingEvent[] = [
  {
    id: "EVT-101",
    title: "Aloeflora Natural Hair, Body & Wellness Expo 2026",
    date: "2026-07-12",
    time: "09:00 AM - 05:00 PM",
    location: "KICC Amphitheatre, Nairobi",
    description: "Join ALOEFLORA specialists for an immersive full-day skin analysis and curl textures workshop. Bring home absolute organic wellness formulations, enjoy free Kenya tea, organic foods, and product customisation booths.",
    imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800",
    capacity: 250,
    registrantCount: 142,
    status: "upcoming",
    registrants: [
      { name: "Slyvia Nekesa", email: "slyv.nekesa@yahoo.com", phone: "0711223344", registeredAt: "2026-06-10T12:00:00Z" },
      { name: "John Musyoka", email: "musyo@gmail.com", phone: "0722334455", registeredAt: "2026-06-11T14:30:00Z" }
    ]
  },
  {
    id: "EVT-102",
    title: "Kenyan Herb Harvest Farm Tour",
    date: "2026-08-05",
    time: "08:00 AM - 04:00 PM",
    location: "Aloeflora Botanical Plot, Limuru",
    description: "An exclusive educational morning walk through the high-density green fields of Limuru where we grow over 15 distinct natural sub-species of Aloe vera under absolute sustainable agroforestry.",
    imageUrl: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&q=80&w=800",
    capacity: 50,
    registrantCount: 48,
    status: "upcoming",
    registrants: []
  }
];

export const INITIAL_CMS: CMSPost[] = [
  {
    id: "hero-title",
    title: "Storefront Hero Title",
    content: "Nature's Absolute Repair System",
    type: "blog",
    status: "published",
    author: "Admin Master",
    createdAt: "2026-06-15"
  },
  {
    id: "hero-subtitle",
    title: "Storefront Hero Subtitle",
    content: "Affordable, High-Quality and Natural Solutions for Hair, Skin and Home Care specifically built for the Kenyan environment.",
    type: "blog",
    status: "published",
    author: "Admin Master",
    createdAt: "2026-06-15"
  },
  {
    id: "about-text",
    title: "Storefront About Text",
    content: "ALOEFLORA PRODUCTS is a premium Kenyan organic brand utilizing the potent cellular structures of localized Aloe Vera strains grown under direct sun. Our formulations deliver unrivaled moisture retention for 4C hair textures and sensitive African skin profiles.",
    type: "blog",
    status: "published",
    author: "Admin Master",
    createdAt: "2026-06-15"
  },
  {
    id: "CMS-01",
    title: "How Local Kenyan Aloe Vera outperforms global strains",
    content: "When it comes to cellular hair hydration and moisture sealing, the geographical conditions of high elevation Kenya soil paired with dry heat elements creates high concentrations of pure polysaccharides within the succulent leaf core tissue...",
    type: "blog",
    status: "published",
    author: "Dr. Dorcas Obondo",
    createdAt: "2026-05-18",
    seoTitle: "Best Natural Hair Kenya - Aloe Vera Secret Benefits",
    seoDesc: "Discover why local Kenyan raw aloe vera yields unprecedented scalp repair benefits compared to chemical shampoos.",
    seoKeywords: "Best Hair Products Nairobi, Natural Hair Products Kenya, Natural Body Products Kenya"
  },
  {
    id: "CMS-02",
    title: "Return Policy and Nairobi CBD free collection guidelines",
    content: "ALOEFLORA ensures 100% satisfaction on all hair and home care products. Customers are entitled to full exchanges or immediate KES refund in cases of physical damage, product leaks, or raw component sensitivities when alerted within 7 calendar days...",
    type: "policy",
    status: "published",
    author: "Customer Support Manager",
    createdAt: "2026-04-10"
  },
  {
    id: "CMS-03",
    title: "Which product matches 4C natural coils?",
    content: "For thick, tight 4C styles, we strongly recommend combining the Aloeflora Pure Aloe Vera Gel Shampoo with our Ultra-Shea Hydrating Butter Cream daily to form reliable protective moisture moisture wraps...",
    type: "faq",
    status: "published",
    author: "Hair Care Team",
    createdAt: "2026-06-02"
  },
  {
    id: "hero-1",
    title: "Revitalize Your Hair",
    content: "Discover the magic of pure Aloe Vera in our new collection.",
    type: "hero",
    status: "published",
    author: "Admin Master",
    createdAt: "2026-06-16",
    imageUrl: "https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?auto=format&fit=crop&q=80&w=1200"
  },
  {
    id: "award-1",
    title: "Best Eco Brand 2025",
    content: "We are proud to be recognized as the top eco-friendly brand in Kenya.",
    type: "award",
    status: "published",
    author: "Admin Master",
    createdAt: "2026-06-17",
    imageUrl: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=600"
  }
];

export const INITIAL_DEV_LOGS: DevOpsLog[] = [
  { id: "log-1", timestamp: "2026-06-15T14:30:15Z", level: "info", service: "cdn", message: "Vercel edge asset warm cache hit initialized successfully for Nairobi node." },
  { id: "log-2", timestamp: "2026-06-15T14:31:02Z", level: "info", service: "database", message: "Postgres Pool: Connected 8/20 idle postgres connection clients to Supabase." },
  { id: "log-3", timestamp: "2026-06-15T14:32:45Z", level: "info", service: "payment", message: "Daraja Gateway Status: Safaricom C2B webhook registers positive heartbeat test." },
  { id: "log-4", timestamp: "2026-06-15T14:34:11Z", level: "warn", service: "auth", message: "Rate limit threshold breached for external IP 197.136.255.42 on /api/auth." },
  { id: "log-5", timestamp: "2026-06-15T14:35:01Z", level: "info", service: "api", message: "Successfully sync state engine variables in local cache storage." }
];

export const INITIAL_AUDIT_ANOMALIES: AuditAnomaly[] = [
  {
    id: "ANM-001",
    type: "stock_discrepancy",
    severity: "medium",
    message: "Reorder trigger warning: Aloeflora Aloe & Castor Growth Hair Oil (p3) has fallen to 8 units. Below safety threshold of 10.",
    timestamp: "2026-06-15T05:12:00Z",
    status: "unresolved"
  },
  {
    id: "ANM-002",
    type: "suspicious_payment",
    severity: "medium",
    message: "A typical STK request speed anomaly: Transaction ORD-7312 has been awaiting checkout processing callback for over 45 minutes.",
    timestamp: "2026-06-15T07:15:30Z",
    status: "unresolved"
  }
];

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  adminName: "Master Admin",
  adminEmail: "aganyawiseman@gmail.com",
  seoTitle: "ALOEFLORA PRODUCTS | Quality, Affordable & Natural Hair, Body, Home Care Kenya",
  seoDesc: "Welcome to ALOEFLORA PRODUCTS Kenya. We offer premium, natural, organic hair care, skin care, and non-toxic home care solutions locally crafted and shipped in Nairobi, Kenya.",
  seoKeywords: "Best Hair Products Nairobi, Natural Hair Products Kenya, Affordable Hair Care Products, Natural Body Products Kenya, Affordable Home Care Products, Best Quality Natural Products Nairobi",
  seoRobots: `User-agent: *
Allow: /
Disallow: /admin
Sitemap: https://aloeflora.co.ke/sitemap.xml`,
  sitemapGeneratedAt: "2026-06-15"
};
