import React, { useState } from "react";
import { BookOpen, Database, Cpu, Terminal, Shield, BarChart3, ListChecks } from "lucide-react";

export default function ArchitectureDocs() {
  const [activeTab, setActiveTab] = useState<string>("system");

  const selectTab = (id: string) => {
    setActiveTab(id);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const sqlSchema = `-- ==========================================
-- ALOEFLORA ENTERPRISE DATABASE SCHEMA
-- Target Database: PostgreSQL / Supabase
-- User Authorization: RBAC (Admin & Customer)
-- ==========================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE user_role AS ENUM ('customer', 'admin');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'failed');
CREATE TYPE delivery_status AS ENUM ('pending', 'dispatched', 'delivered', 'cancelled');
CREATE TYPE severity_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE anomaly_type AS ENUM ('stock_discrepancy', 'suspicious_payment', 'price_mismatch', 'rate_limit_trip');

-- 3. PROFILES / USERS (Supports Supabase Auth sync)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    role user_role DEFAULT 'customer'::user_role,
    reward_points INTEGER DEFAULT 0,
    referral_code VARCHAR(30) UNIQUE,
    referred_by VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. PRODUCTS & INVENTORY
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('hair', 'body', 'home')),
    sub_category VARCHAR(100) NOT NULL,
    image_url TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    safety_stock INTEGER NOT NULL DEFAULT 10,
    reorder_level INTEGER NOT NULL DEFAULT 15,
    rating DECIMAL(3,2) DEFAULT 5.0,
    reviews_count INTEGER DEFAULT 0,
    variants TEXT[] DEFAULT '{}',
    features TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. ORDERS & CHECKOUTS
CREATE TABLE orders (
    id VARCHAR(50) PRIMARY KEY, -- ORD-XXXX
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(255) NOT NULL,
    county VARCHAR(100) NOT NULL DEFAULT 'Nairobi',
    sub_county VARCHAR(100) NOT NULL,
    estate VARCHAR(100) NOT NULL,
    building VARCHAR(150),
    house_number VARCHAR(50),
    delivery_notes TEXT,
    subtotal DECIMAL(12, 2) NOT NULL,
    delivery_fee DECIMAL(12, 2) NOT NULL,
    total DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status order_status DEFAULT 'pending'::order_status,
    delivery_status delivery_status DEFAULT 'pending'::delivery_status,
    mpesa_receipt VARCHAR(100) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. ORDER ITEMS
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    selected_variant VARCHAR(100)
);

-- 7. AUDIT ANOMALIES (Financial and Stock Fraud Engine)
CREATE TABLE audit_anomalies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type anomaly_type NOT NULL,
    severity severity_level NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'unresolved',
    resolved_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Anonymous users & customers can VIEW products
CREATE POLICY "Products are publicly viewable" ON products 
    FOR SELECT TO public USING (true);

-- Admin has full absolute access on products
CREATE POLICY "Admins have full write access on products" ON products 
    FOR ALL TO authenticated 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Customers can view only their own orders
CREATE POLICY "Customers can select own orders" ON orders 
    FOR SELECT TO authenticated 
    USING (profile_id = auth.uid());

-- Admin can see and update ALL orders
CREATE POLICY "Admins have total order controls" ON orders 
    FOR ALL TO authenticated 
    USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
`;

  const dockerfile = `# ALOEFLORA Enterprise Production Multi-Stage Deployment
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

# Copy compiled resources
COPY --from=builder /app/dist ./dist
# If full stack, copy server.cjs
COPY --from=builder /app/dist/server.cjs ./dist/server.cjs

EXPOSE 3000
CMD ["node", "dist/server.cjs"]
`;

  const githubActions = `# CI/CD Pipeline for ALOEFLORA
name: Deploy ALOEFLORA Enterprise Platform

on:
  push:
    branches: [ main, production ]

jobs:
  validate-and-build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Verify Types and Formatting
        run: npm run lint

      - name: Build Application Bundle
        run: npm run build
        env:
          GEMINI_API_KEY: \${{ secrets.GEMINI_API_KEY }}

      - name: Deploy to Cloud Run (Google Cloud)
        if: github.ref == 'refs/heads/production'
        uses: google-github-actions/deploy-cloudrun@v2
        with:
          service: aloeflora-production
          region: europe-west2
          source: ./
`;

  const mpesaApiSpec = `{
  "Safaricom_Daraja_Interface": {
    "stk_push_initiate": {
      "endpoint": "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      "method": "POST",
      "headers": {
        "Authorization": "Bearer OThB...Wjh4S082",
        "Content-Type": "application/json"
      },
      "body_schema": {
        "BusinessShortCode": "174379",
        "Password": "MTc0Mzc5YmZiM...==",
        "Timestamp": "20260615143501",
        "TransactionType": "CustomerPayBillOnline",
        "Amount": "subtotal + delivery_fee",
        "PartyA": "254702283637",
        "PartyB": "174379",
        "PhoneNumber": "254702283637",
        "CallBackURL": "https://aloeflora.co.ke/api/payments/mpesa-callback",
        "AccountReference": "ORD-9281",
        "TransactionDesc": "Aloeflora Product Purchase"
      }
    },
    "callback_handler": {
      "endpoint": "/api/payments/mpesa-callback",
      "method": "POST",
      "processing_logic": "Extract Body.stkCallback.ResultCode. If 0, parse CallbackMetadata for ReceiptNumber, transaction date, and match with the active database orders table via AccountReference. Update payment_status to 'paid' and auto log event into CRM audit logs."
    }
  }
}`;

  return (
    <div id="architecture-docs-container" className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6 overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-gray-100 dark:border-gray-800 gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 px-3 py-1 rounded-full uppercase tracking-wider">
            Enterprise Deliverables (1-20)
          </span>
          <h2 className="text-2xl font-semibold text-gray-950 dark:text-white mt-2">
            System & Security Architecture Blueprint
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Production specifications, database schema definitions, and devops setups compiled for ALOEFLORA Kenya.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => selectTab("system")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "system"
                ? "bg-emerald-800 text-white shadow"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" /> System Architecture
          </button>
          <button
            onClick={() => selectTab("database")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "database"
                ? "bg-emerald-800 text-white shadow"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <Database className="w-3.5 h-3.5" /> DB Schema SQL
          </button>
          <button
            onClick={() => selectTab("api")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "api"
                ? "bg-emerald-800 text-white shadow"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" /> API Specifications
          </button>
          <button
            onClick={() => selectTab("devops")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "devops"
                ? "bg-emerald-800 text-white shadow"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Infrastructure
          </button>
          <button
            onClick={() => selectTab("auditing")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "auditing"
                ? "bg-emerald-800 text-white shadow"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Auditing Core
          </button>
          <button
            onClick={() => selectTab("roadmap")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "roadmap"
                ? "bg-emerald-800 text-white shadow"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" /> Roadmap
          </button>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === "system" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 rounded-xl p-4">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2.5 py-1 rounded">
                  01. Web Client (SPA)
                </span>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2.5">
                  Single Page Application built using <strong>React 19</strong>, styled seamlessly with <strong>Tailwind CSS 4.0</strong>, employing interactive motion loops.
                </p>
                <div className="border-t border-dashed border-emerald-200 dark:border-emerald-800 mt-3 pt-3">
                  <span className="text-[10px] font-mono text-gray-500">Security Check:</span>
                  <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 mt-1">
                    CSRF tokens, robust phone constraints, safe storage hooks.
                  </div>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-800 px-2.5 py-1 rounded">
                  02. Server Middleware
                </span>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2.5">
                  Production ready custom HTTP gateway proxying Safaricom Daraja M-Pesa callbacks, executing Gemini AI analysis, and serving cached client-side static files.
                </p>
                <div className="border-t border-dashed border-zinc-200 dark:border-zinc-700 mt-3 pt-3">
                  <span className="text-[10px] font-mono text-gray-500">Deployment target:</span>
                  <div className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 mt-1">
                    Google Cloud Run with container auto-scaling.
                  </div>
                </div>
              </div>

              <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 rounded-xl p-4">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2.5 py-1 rounded">
                  03. Supabase & Drizzle DB
                </span>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2.5">
                  Highly transactional Postgres layers hosting <strong>Row Level Security (RLS)</strong> with strict division of roles, automated indexing thresholds, and hot backups.
                </p>
                <div className="border-t border-dashed border-amber-200 dark:border-amber-800 mt-3 pt-3">
                  <span className="text-[10px] font-mono text-gray-500">Database Engine:</span>
                  <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-400 mt-1">
                    Indexed order structures + safety stocking cues.
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/40 p-5 rounded-xl border border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Enterprise Full-Stack Architecture Diagram</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Physical routing of requests in Vercel & Supabase environments.</p>
              
              <div className="mt-4 font-mono text-xs text-gray-600 dark:text-gray-400 leading-relaxed bg-white dark:bg-gray-950 p-4 rounded-lg border border-gray-200 dark:border-gray-800 overflow-x-auto">
                {`  ┌───────────────────┐                 ┌────────────────────┐
  │   User Iframe     │ ──( HTTPS )───> │ Modern Vercel CDN  │
  │  (React 19 App)   │                 │ (Dynamic Routing)  │
  └───────────────────┘                 └────────────────────┘
            ▲;                                     │ 
            │                                 (Edge Functions)
    (M-Pesa Webhook Callback)                      │
            │                                      ▼
  ┌───────────────────┐                 ┌────────────────────┐
  │ Safaricom Daraja  │ <──(Callback)── │ Supabase backend / │
  │ (M-PESA Gateway)  │ ──(STK Push)──> │ Postgres DB (Kenya)│
  └───────────────────┘                 └────────────────────┘
                                                   │
                                            (Gemini Pro API)
                                                   ▼
                                        ┌────────────────────┐
                                        │ Google Generative  │
                                        │ AI SDK Engine      │
                                        └────────────────────┘`}
              </div>
            </div>
          </div>
        )}

        {activeTab === "database" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-gray-500">Comprehensive PostgreSQL DDL Script</div>
              <button
                onClick={() => copyToClipboard(sqlSchema)}
                className="text-xs font-medium text-emerald-800 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded cursor-pointer transition"
              >
                Copy SQL DDL
              </button>
            </div>
            <pre className="text-xs font-mono bg-gray-50 dark:bg-gray-950 text-gray-700 dark:text-gray-300 p-4 rounded-xl border border-gray-200 dark:border-gray-800 overflow-x-auto max-h-96">
              <code>{sqlSchema}</code>
            </pre>
            <div className="text-xs text-gray-500 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/30 p-3 rounded-lg flex items-start gap-2">
              <span className="text-yellow-800 dark:text-yellow-400 font-bold">⚠️ DB Strategy Note:</span>
              <span>
                Make sure you enforce strict RLS policies as shown above. There are exactly <strong>two role privileges</strong>: <strong>'admin'</strong> and <strong>'customer'</strong>. Super admins and executives access everything using the same unified profile flags.
              </span>
            </div>
          </div>
        )}

        {activeTab === "api" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-950 dark:text-white">Safaricom Daraja API Payload Formats</h3>
            <p className="text-xs text-gray-500">JSON schema specifications used for payment matching in STK pushes.</p>
            <div className="relative">
              <button
                onClick={() => copyToClipboard(mpesaApiSpec)}
                className="absolute right-3 top-3 text-xs font-medium text-emerald-800 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded cursor-pointer transition"
              >
                Copy JSON
              </button>
              <pre className="text-xs font-mono bg-gray-50 dark:bg-gray-950 text-gray-700 dark:text-gray-300 p-4 rounded-xl border border-gray-200 dark:border-gray-800 overflow-x-auto max-h-80">
                <code>{mpesaApiSpec}</code>
              </pre>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="text-xs font-semibold text-gray-950 dark:text-white mb-2">Full CRUD API Endpoint Map</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                  <span className="font-bold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded text-[10px] mr-2">GET</span>
                  <span className="font-mono text-gray-700 dark:text-gray-300">/api/products</span>
                  <p className="text-[11px] text-gray-500 mt-1">Queries current items filtering by tags, limits, and categories.</p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                  <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] mr-2">POST</span>
                  <span className="font-mono text-gray-700 dark:text-gray-300">/api/payments/stk-push</span>
                  <p className="text-[11px] text-gray-500 mt-1">Triggers Safaricom Daraja API STK transaction request to custom phone.</p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                  <span className="font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] mr-2">PUT</span>
                  <span className="font-mono text-gray-700 dark:text-gray-300">/api/admin/products/:id</span>
                  <p className="text-[11px] text-gray-500 mt-1">Updates catalog specifications and resets stock levels with logs.</p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                  <span className="font-bold text-violet-800 bg-violet-50 px-1.5 py-0.5 rounded text-[10px] mr-2">POST</span>
                  <span className="font-mono text-gray-700 dark:text-gray-300">/api/admin/gemini-audit</span>
                  <p className="text-[11px] text-gray-500 mt-1">Invokes server-side Gemini 3.5 Assistant to crawl audit logs for errors.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "devops" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">Multi-Stage Dockerfile</span>
                  <button onClick={() => copyToClipboard(dockerfile)} className="text-[11px] text-emerald-800 underline hover:text-emerald-700 cursor-pointer">Copy</button>
                </div>
                <pre className="text-[10px] font-mono bg-gray-50 dark:bg-gray-950 text-gray-700 dark:text-gray-300 p-3 rounded-xl border border-gray-200 dark:border-gray-800 overflow-x-auto h-64">
                  <code>{dockerfile}</code>
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">GitHub Actions CI/CD Pipeline</span>
                  <button onClick={() => copyToClipboard(githubActions)} className="text-[11px] text-emerald-800 underline hover:text-emerald-700 cursor-pointer">Copy</button>
                </div>
                <pre className="text-[10px] font-mono bg-gray-50 dark:bg-gray-950 text-gray-700 dark:text-gray-300 p-3 rounded-xl border border-gray-200 dark:border-gray-800 overflow-x-auto h-64">
                  <code>{githubActions}</code>
                </pre>
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <span className="text-xs font-bold text-gray-950 dark:text-white">Security & Backup Strategy</span>
              <ul className="text-xs text-gray-600 dark:text-gray-400 mt-2 space-y-2 list-disc pl-4">
                <li><strong>GDPR & NDPA Compliance:</strong> Full database data encryption at rest (PG-Crypto) with automatic scrubbing options for customer delivery records upon request.</li>
                <li><strong>SSL Enforced Transfers:</strong> A++ SSL encryption via Vercel edge reverse proxying, discarding HTTP traffic completely.</li>
                <li><strong>Automated Backup schedule:</strong> Daily snapshots stored in multiple regions via Supabase continuous storage backups, allowing point-in-time recoveries in under 10 seconds.</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === "auditing" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Internal ERP Core Accounting Equations</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              How the Executive Financial Dashboard aggregates income ledgers to prevent accounting discrepancies.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-950 p-4 rounded-xl border border-gray-100 dark:border-gray-800 space-y-2">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                  01. Profit & Loss Formulas
                </span>
                <div className="font-mono text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-3 rounded mt-2 space-y-2">
                  <div>• Revenue = SumOf(PaidOrderTotal) - SumOf(ReturnedOrderTotal)</div>
                  <div>• COGS = SumOf(OrderQuantity * ProductProductionCost)</div>
                  <div>• Gross Profit = Revenue - COGS</div>
                  <div>• Net Profit = Gross Profit - Operating Expenses</div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-950 p-4 rounded-xl border border-gray-100 dark:border-gray-800 space-y-2">
                <span className="text-xs font-semibold text-rose-800 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded">
                  02. Automated Fraud & Anomaly Flags
                </span>
                <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc pl-4 space-y-1 mt-2">
                  <li><strong>Price Variance:</strong> Flags cases where order_item unit price differs from products catalog table at time of purchase.</li>
                  <li><strong>Stale STK push:</strong> Highlights transactions retaining pending states for more than 15 minutes (indicating bad connection or simulation drops).</li>
                  <li><strong>Safety Stock Trip:</strong> Alerts admins for instant reordering immediately when inventory drops below safety stocks.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === "roadmap" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">ALOEFLORA 5-Phase Deployment Plan</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Step by step path towards full public launching in Nairobi, Kenya.</p>
            </div>

            <div className="relative border-l border-emerald-100 dark:border-emerald-900 ml-4 space-y-6">
              <div className="relative pl-6">
                <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-emerald-700 rounded-full border-2 border-white dark:border-gray-900"></div>
                <div className="text-xs font-bold text-emerald-800 dark:text-emerald-400">PHASE 1: Core Catalog Setup & Layout Crafting (Week 1)</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Extract brand design assets out of the raw green leaf logo. Stabilize fully dynamic React 19 product listings, filters, comparisons, and persistent offline storage capabilities.
                </p>
              </div>

              <div className="relative pl-6">
                <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-emerald-700 rounded-full border-2 border-white dark:border-gray-900"></div>
                <div className="text-xs font-bold text-emerald-800 dark:text-emerald-400">PHASE 2: Checkout & Safaricom Daraja Webhooks (Week 2-3)</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Bind County and Estate delivery fee algorithms. Connect production merchant paybills to Daraja STK Push callbacks, establishing failed-transaction retries.
                </p>
              </div>

              <div className="relative pl-6">
                <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-emerald-700 rounded-full border-2 border-white dark:border-gray-900"></div>
                <div className="text-xs font-bold text-gray-800 dark:text-gray-200">PHASE 3: Unified Executive Dashboard & Auditing (Week 4)</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Spin up Postgres database indexes, deploy CRM dashboard systems (campaign ROI counters, customer ticketing modules), and link AI descriptions writer powered by Gemini.
                </p>
              </div>

              <div className="relative pl-6">
                <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-gray-300 dark:bg-gray-700 rounded-full border-2 border-white dark:border-gray-900"></div>
                <div className="text-xs font-bold text-gray-500">PHASE 4: Technical SEO, GA4 & Schema Integration (Week 5)</div>
                <p className="text-xs text-gray-500 mt-1">
                  Configure XML auto-sitemaps, craft rich schema structured data scripts (Product metadata, LocalBusiness markers) to secure SEO indexing on search engines.
                </p>
              </div>

              <div className="relative pl-6">
                <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-gray-300 dark:bg-gray-700 rounded-full border-2 border-white dark:border-gray-900"></div>
                <div className="text-xs font-bold text-gray-500">PHASE 5: DevOps Integration & Security Hardening (Week 6)</div>
                <p className="text-xs text-gray-500 mt-1">
                  Mount Vercel caching buffers, trigger Dockerized regression test protocols, provision secondary encryption keys, and start official marketing pushes.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
