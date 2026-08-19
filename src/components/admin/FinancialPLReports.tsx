import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  DollarSign,
  PieChart,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Zap,
  Target,
  Sparkles,
  ChevronDown
} from "lucide-react";
import { Order, Product, MarketingCampaign, Promo, StoreSettings } from "../../types";
import { generateFinancialPLStatementPDF, exportFinancialPLToCSV, PLSummaryData } from "../../utils/exportUtils";
import { toast } from "react-hot-toast";

interface FinancialPLReportsProps {
  orders: Order[];
  products: Product[];
  campaigns?: MarketingCampaign[];
  promos?: Promo[];
  storeSettings?: StoreSettings;
}

type PeriodType = "daily" | "weekly" | "monthly" | "semi_annually" | "annually" | "custom";
type DailySpan = "7d" | "14d" | "30d";

export default function FinancialPLReports({
  orders = [],
  products = [],
  campaigns = [],
  promos = [],
  storeSettings
}: FinancialPLReportsProps) {
  // Period Aggregation State
  const [periodType, setPeriodType] = useState<PeriodType>("monthly");
  const [dailySpan, setDailySpan] = useState<DailySpan>("14d");
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  
  // Filtering & View State
  const [orderStatusFilter, setOrderStatusFilter] = useState<"paid_only" | "all" | "delivered_only">("paid_only");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [activeSubTab, setActiveSubTab] = useState<"period_table" | "category_matrix" | "expense_breakdown">("period_table");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hoveredDataPoint, setHoveredDataPoint] = useState<any | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  // Filter Orders by Payment/Delivery Status and Custom Date
  const eligibleOrders = useMemo(() => {
    return orders.filter(o => {
      if (!o) return false;
      if (orderStatusFilter === "paid_only" && o.paymentStatus !== "paid") return false;
      if (orderStatusFilter === "delivered_only" && o.deliveryStatus !== "delivered") return false;
      return true;
    });
  }, [orders, orderStatusFilter]);

  // Operational Base Expenses (Hosting, Marketing, Logistics from Campaigns & Settings)
  const baseMonthlyHosting = 3500; // KES server/database infrastructure estimate
  const totalCampaignSpend = useMemo(() => {
    return campaigns.reduce((sum, c) => sum + (Number(c.budget) || 0), 0);
  }, [campaigns]);

  // Build Map of Product Cost Prices for fast COGS calculation
  const productCostMap = useMemo(() => {
    const map: Record<string, { cost: number; price: number; name: string; category: string; sku: string }> = {};
    products.forEach(p => {
      map[p.id] = {
        cost: Number(p.costPrice) || 200,
        price: Number(p.price) || 500,
        name: p.name || "Product",
        category: p.category || "general",
        sku: p.sku || "N/A"
      };
    });
    return map;
  }, [products]);

  // Aggregate Performance Data by Period Intervals
  const aggregatedData = useMemo(() => {
    const now = new Date();
    const periods: Array<{
      key: string;
      label: string;
      startDate: Date;
      endDate: Date;
    }> = [];

    if (periodType === "daily") {
      const daysCount = dailySpan === "7d" ? 7 : dailySpan === "14d" ? 14 : 30;
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
        const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
        const label = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
        periods.push({ key: d.toISOString().slice(0, 10), label, startDate: start, endDate: end });
      }
    } else if (periodType === "weekly") {
      // 12 Rolling Weeks
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - (i * 7));
        const dayOfWeek = d.getDay();
        const diffToMonday = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const start = new Date(d.setDate(diffToMonday));
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        const label = `Wk ${12 - i} (${start.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })})`;
        periods.push({ key: `wk-${12 - i}`, label, startDate: start, endDate: end });
      }
    } else if (periodType === "monthly") {
      // 12 Calendar Months of Current Year
      const currentYear = now.getFullYear();
      for (let m = 0; m < 12; m++) {
        const start = new Date(currentYear, m, 1, 0, 0, 0);
        const end = new Date(currentYear, m + 1, 0, 23, 59, 59);
        const label = start.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
        periods.push({ key: `m-${m}`, label, startDate: start, endDate: end });
      }
    } else if (periodType === "semi_annually") {
      // Current Year and Last Year Semi-Annuals (H1 / H2)
      const currentYear = now.getFullYear();
      periods.push(
        {
          key: `${currentYear}-H1`,
          label: `${currentYear} H1 (Jan - Jun)`,
          startDate: new Date(currentYear, 0, 1, 0, 0, 0),
          endDate: new Date(currentYear, 5, 30, 23, 59, 59)
        },
        {
          key: `${currentYear}-H2`,
          label: `${currentYear} H2 (Jul - Dec)`,
          startDate: new Date(currentYear, 6, 1, 0, 0, 0),
          endDate: new Date(currentYear, 11, 31, 23, 59, 59)
        },
        {
          key: `${currentYear - 1}-H1`,
          label: `${currentYear - 1} H1 (Jan - Jun)`,
          startDate: new Date(currentYear - 1, 0, 1, 0, 0, 0),
          endDate: new Date(currentYear - 1, 5, 30, 23, 59, 59)
        },
        {
          key: `${currentYear - 1}-H2`,
          label: `${currentYear - 1} H2 (Jul - Dec)`,
          startDate: new Date(currentYear - 1, 6, 1, 0, 0, 0),
          endDate: new Date(currentYear - 1, 11, 31, 23, 59, 59)
        }
      );
    } else if (periodType === "annually") {
      // 3 Years Comparison
      const currentYear = now.getFullYear();
      for (let y = currentYear - 2; y <= currentYear; y++) {
        const start = new Date(y, 0, 1, 0, 0, 0);
        const end = new Date(y, 11, 31, 23, 59, 59);
        periods.push({ key: `yr-${y}`, label: `FY ${y}`, startDate: start, endDate: end });
      }
    } else if (periodType === "custom") {
      const start = new Date(customStartDate + "T00:00:00");
      const end = new Date(customEndDate + "T23:59:59");
      periods.push({
        key: "custom-range",
        label: `${start.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} - ${end.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`,
        startDate: start,
        endDate: end
      });
    }

    // Compute period stats
    const periodRows = periods.map(p => {
      const matchingOrders = eligibleOrders.filter(o => {
        const oDate = new Date(o.createdAt);
        return oDate >= p.startDate && oDate <= p.endDate;
      });

      let revenue = 0;
      let cogs = 0;
      let unitsSold = 0;
      let shippingLogistics = 0;
      let discounts = 0;

      matchingOrders.forEach(o => {
        revenue += Number(o.total) || 0;
        shippingLogistics += Number(o.deliveryFee) || 0;
        const calculatedDiscount = Math.max(0, (Number(o.subtotal) || 0) + (Number(o.deliveryFee) || 0) - (Number(o.total) || 0));
        discounts += calculatedDiscount;

        (o.items || []).forEach(item => {
          const qty = Number(item.quantity) || 1;
          unitsSold += qty;
          const pInfo = productCostMap[item.productId];
          const unitCost = pInfo ? pInfo.cost : (Number(item.price) || 500) * 0.4;
          cogs += unitCost * qty;
        });
      });

      // Scale marketing and hosting to period length
      const periodDurationDays = Math.max(1, (p.endDate.getTime() - p.startDate.getTime()) / (1000 * 60 * 60 * 24));
      const hostingShare = Math.round((baseMonthlyHosting / 30) * periodDurationDays);
      const marketingShare = Math.round((totalCampaignSpend / 365) * periodDurationDays);

      const operatingExpenses = shippingLogistics + discounts + hostingShare + marketingShare;
      const grossProfit = revenue - cogs;
      const grossMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
      const netProfit = grossProfit - operatingExpenses;
      const netMarginPct = revenue > 0 ? (netProfit / revenue) * 100 : 0;

      return {
        period: p.label,
        key: p.key,
        orderCount: matchingOrders.length,
        unitsSold,
        revenue,
        cogs,
        grossProfit,
        grossMarginPct,
        expenses: operatingExpenses,
        netProfit,
        netMarginPct,
        breakdown: {
          logistics: shippingLogistics,
          marketing: marketingShare,
          hosting: hostingShare,
          discounts
        }
      };
    });

    return periodRows;
  }, [eligibleOrders, periodType, dailySpan, customStartDate, customEndDate, productCostMap, totalCampaignSpend]);

  // Overall Totals Across Selected Time Range
  const totals = useMemo(() => {
    const totalRevenue = aggregatedData.reduce((sum, r) => sum + r.revenue, 0);
    const totalCogs = aggregatedData.reduce((sum, r) => sum + r.cogs, 0);
    const grossProfit = totalRevenue - totalCogs;
    const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const operatingExpenses = aggregatedData.reduce((sum, r) => sum + r.expenses, 0);
    const netProfit = grossProfit - operatingExpenses;
    const netMarginPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const orderCount = aggregatedData.reduce((sum, r) => sum + r.orderCount, 0);
    const unitsSold = aggregatedData.reduce((sum, r) => sum + r.unitsSold, 0);
    const aov = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0;
    const profitPerOrder = orderCount > 0 ? Math.round(netProfit / orderCount) : 0;

    const expenseBreakdown = {
      logistics: aggregatedData.reduce((sum, r) => sum + r.breakdown.logistics, 0),
      marketing: aggregatedData.reduce((sum, r) => sum + r.breakdown.marketing, 0),
      hosting: aggregatedData.reduce((sum, r) => sum + r.breakdown.hosting, 0),
      discounts: aggregatedData.reduce((sum, r) => sum + r.breakdown.discounts, 0)
    };

    return {
      totalRevenue,
      totalCogs,
      grossProfit,
      grossMarginPct,
      operatingExpenses,
      netProfit,
      netMarginPct,
      orderCount,
      unitsSold,
      aov,
      profitPerOrder,
      expenseBreakdown
    };
  }, [aggregatedData]);

  // Product Category Profitability Matrix
  const categoryMatrix = useMemo(() => {
    const catMap: Record<string, { unitsSold: number; revenue: number; cogs: number; grossProfit: number; marginPct: number }> = {
      hair: { unitsSold: 0, revenue: 0, cogs: 0, grossProfit: 0, marginPct: 0 },
      body: { unitsSold: 0, revenue: 0, cogs: 0, grossProfit: 0, marginPct: 0 },
      home: { unitsSold: 0, revenue: 0, cogs: 0, grossProfit: 0, marginPct: 0 },
      coffee: { unitsSold: 0, revenue: 0, cogs: 0, grossProfit: 0, marginPct: 0 }
    };

    eligibleOrders.forEach(o => {
      (o.items || []).forEach(item => {
        const pInfo = productCostMap[item.productId];
        const category = (pInfo?.category || "hair").toLowerCase();
        if (!catMap[category]) {
          catMap[category] = { unitsSold: 0, revenue: 0, cogs: 0, grossProfit: 0, marginPct: 0 };
        }
        const qty = Number(item.quantity) || 1;
        const rev = (Number(item.price) || 0) * qty;
        const cost = (pInfo?.cost || 200) * qty;

        catMap[category].unitsSold += qty;
        catMap[category].revenue += rev;
        catMap[category].cogs += cost;
      });
    });

    return Object.entries(catMap).map(([category, stats]) => {
      const grossProfit = stats.revenue - stats.cogs;
      const marginPct = stats.revenue > 0 ? (grossProfit / stats.revenue) * 100 : 0;
      return {
        category,
        unitsSold: stats.unitsSold,
        revenue: stats.revenue,
        cogs: stats.cogs,
        grossProfit,
        marginPct
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [eligibleOrders, productCostMap]);

  // Individual Products Profitability List
  const productProfitability = useMemo(() => {
    const prodMap: Record<string, { id: string; name: string; sku: string; category: string; unitsSold: number; revenue: number; cogs: number }> = {};

    eligibleOrders.forEach(o => {
      (o.items || []).forEach(item => {
        const id = item.productId || "unknown";
        const pInfo = productCostMap[id];
        if (!prodMap[id]) {
          prodMap[id] = {
            id,
            name: item.productName || pInfo?.name || "Product",
            sku: pInfo?.sku || "N/A",
            category: pInfo?.category || "general",
            unitsSold: 0,
            revenue: 0,
            cogs: 0
          };
        }
        const qty = Number(item.quantity) || 1;
        const rev = (Number(item.price) || 0) * qty;
        const cost = (pInfo?.cost || 200) * qty;

        prodMap[id].unitsSold += qty;
        prodMap[id].revenue += rev;
        prodMap[id].cogs += cost;
      });
    });

    return Object.values(prodMap).map(p => {
      const grossProfit = p.revenue - p.cogs;
      const marginPct = p.revenue > 0 ? (grossProfit / p.revenue) * 100 : 0;
      return {
        ...p,
        grossProfit,
        marginPct
      };
    }).filter(p => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    }).sort((a, b) => b.revenue - a.revenue);
  }, [eligibleOrders, productCostMap, searchQuery]);

  // Maximum value for SVG dynamic trend graph scaling
  const maxChartValue = useMemo(() => {
    const maxRev = Math.max(...aggregatedData.map(r => r.revenue), 1000);
    const maxProfit = Math.max(...aggregatedData.map(r => r.netProfit), 0);
    return Math.max(maxRev, maxProfit) * 1.15;
  }, [aggregatedData]);

  // Export handlers
  const handleExportPDF = () => {
    const label = `${periodType.toUpperCase()} Financial Statement (${new Date().toLocaleDateString()})`;
    const exportData: PLSummaryData = {
      periodLabel: label,
      totalRevenue: totals.totalRevenue,
      totalCogs: totals.totalCogs,
      grossProfit: totals.grossProfit,
      grossMarginPct: totals.grossMarginPct,
      operatingExpenses: totals.operatingExpenses,
      netProfit: totals.netProfit,
      netMarginPct: totals.netMarginPct,
      orderCount: totals.orderCount,
      unitsSold: totals.unitsSold,
      expenseBreakdown: totals.expenseBreakdown,
      periodRows: aggregatedData,
      categoryRows: categoryMatrix
    };
    generateFinancialPLStatementPDF(exportData);
    toast.success("Financial P&L PDF Statement generated!");
  };

  const handleExportCSV = () => {
    const label = `${periodType.toUpperCase()}_PL_Report`;
    const exportData: PLSummaryData = {
      periodLabel: label,
      totalRevenue: totals.totalRevenue,
      totalCogs: totals.totalCogs,
      grossProfit: totals.grossProfit,
      grossMarginPct: totals.grossMarginPct,
      operatingExpenses: totals.operatingExpenses,
      netProfit: totals.netProfit,
      netMarginPct: totals.netMarginPct,
      orderCount: totals.orderCount,
      unitsSold: totals.unitsSold,
      expenseBreakdown: totals.expenseBreakdown,
      periodRows: aggregatedData,
      categoryRows: categoryMatrix
    };
    exportFinancialPLToCSV(exportData);
    toast.success("P&L Financial Ledger exported to CSV!");
  };

  // Color palette for Categories
  const categoryColors: Record<string, string> = {
    hair: "#047857", // Emerald
    body: "#84cc16", // Lime
    home: "#0284c7", // Sky
    coffee: "#b45309" // Amber/Brown
  };

  // Calculate Angles for Category Pie / Donut Chart
  const categoryDonutSlices = useMemo(() => {
    const totalRev = categoryMatrix.reduce((sum, c) => sum + c.revenue, 0) || 1;
    let currentAngle = 0;
    return categoryMatrix.map(c => {
      const percentage = (c.revenue / totalRev) * 100;
      const angle = (c.revenue / totalRev) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const radStart = (startAngle - 90) * (Math.PI / 180);
      const radEnd = (endAngle - 90) * (Math.PI / 180);

      const x1 = 100 + 75 * Math.cos(radStart);
      const y1 = 100 + 75 * Math.sin(radStart);
      const x2 = 100 + 75 * Math.cos(radEnd);
      const y2 = 100 + 75 * Math.sin(radEnd);

      const ix1 = 100 + 45 * Math.cos(radEnd);
      const iy1 = 100 + 45 * Math.sin(radEnd);
      const ix2 = 100 + 45 * Math.cos(radStart);
      const iy2 = 100 + 45 * Math.sin(radStart);

      const largeArc = angle > 180 ? 1 : 0;

      const pathData = angle >= 359.9
        ? `M 100,25 A 75,75 0 1,0 100,175 A 75,75 0 1,0 100,25 M 100,55 A 45,45 0 1,1 100,145 A 45,45 0 1,1 100,55 Z`
        : `M ${x1} ${y1} A 75 75 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A 45 45 0 ${largeArc} 0 ${ix2} ${iy2} Z`;

      return {
        category: c.category,
        percentage,
        revenue: c.revenue,
        color: categoryColors[c.category] || "#6b7280",
        pathData
      };
    });
  }, [categoryMatrix]);

  // Operational Expenses Donut Slices
  const expenseDonutSlices = useMemo(() => {
    const totalExp = (totals.totalCogs + totals.operatingExpenses) || 1;
    const items = [
      { name: "COGS (Inventory Cost)", amount: totals.totalCogs, color: "#ef4444" },
      { name: "Logistics & Delivery", amount: totals.expenseBreakdown.logistics, color: "#3b82f6" },
      { name: "Marketing & Ads", amount: totals.expenseBreakdown.marketing, color: "#8b5cf6" },
      { name: "Cloud & DevOps Hosting", amount: totals.expenseBreakdown.hosting, color: "#10b981" },
      { name: "Promo Discounts", amount: totals.expenseBreakdown.discounts, color: "#f59e0b" }
    ];

    let currentAngle = 0;
    return items.map(item => {
      const percentage = (item.amount / totalExp) * 100;
      const angle = (item.amount / totalExp) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const radStart = (startAngle - 90) * (Math.PI / 180);
      const radEnd = (endAngle - 90) * (Math.PI / 180);

      const x1 = 100 + 75 * Math.cos(radStart);
      const y1 = 100 + 75 * Math.sin(radStart);
      const x2 = 100 + 75 * Math.cos(radEnd);
      const y2 = 100 + 75 * Math.sin(radEnd);

      const ix1 = 100 + 45 * Math.cos(radEnd);
      const iy1 = 100 + 45 * Math.sin(radEnd);
      const ix2 = 100 + 45 * Math.cos(radStart);
      const iy2 = 100 + 45 * Math.sin(radStart);

      const largeArc = angle > 180 ? 1 : 0;
      const pathData = angle >= 359.9
        ? `M 100,25 A 75,75 0 1,0 100,175 A 75,75 0 1,0 100,25 M 100,55 A 45,45 0 1,1 100,145 A 45,45 0 1,1 100,55 Z`
        : `M ${x1} ${y1} A 75 75 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A 45 45 0 ${largeArc} 0 ${ix2} ${iy2} Z`;

      return {
        ...item,
        percentage,
        pathData
      };
    });
  }, [totals]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-left">
      {/* Header & Main Period Selectors */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-extrabold text-gray-950 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              Enterprise Profit & Loss (P&L) Reports
            </h3>
            <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
              Audited ERP
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Automated financial statements, multi-period profit breakdown, category margins, and expense auditing.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period Mode Selector */}
          <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex items-center gap-1 border border-gray-200 dark:border-gray-700">
            {[
              { id: "daily", label: "Daily" },
              { id: "weekly", label: "Weekly" },
              { id: "monthly", label: "Monthly" },
              { id: "semi_annually", label: "Semi-Annual" },
              { id: "annually", label: "Annual" },
              { id: "custom", label: "Custom" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setPeriodType(tab.id as PeriodType)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  periodType === tab.id
                    ? "bg-emerald-800 text-white shadow-xs"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Daily Sub-Span Selector */}
          {periodType === "daily" && (
            <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/50 p-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
              {(["7d", "14d", "30d"] as DailySpan[]).map(span => (
                <button
                  key={span}
                  onClick={() => setDailySpan(span)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                    dailySpan === span ? "bg-emerald-800 text-white" : "text-emerald-800 dark:text-emerald-300"
                  }`}
                >
                  {span === "7d" ? "7 Days" : span === "14d" ? "14 Days" : "30 Days"}
                </button>
              ))}
            </div>
          )}

          {/* Custom Date Pickers */}
          {periodType === "custom" && (
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs">
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="px-2 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-[11px] dark:text-white font-medium"
              />
              <span className="text-gray-400 font-bold">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="px-2 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-[11px] dark:text-white font-medium"
              />
            </div>
          )}

          {/* Export Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportPDF}
              className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition"
              title="Export P&L PDF Statement"
            >
              <FileText className="w-3.5 h-3.5" /> PDF Statement
            </button>
            <button
              onClick={handleExportCSV}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 text-gray-700 dark:text-gray-200 font-bold text-xs py-2 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
              title="Export P&L CSV Ledger"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> CSV Ledger
            </button>
          </div>
        </div>
      </div>

      {/* Top Controls & Order Status Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50/70 dark:bg-gray-800/40 p-3 rounded-2xl border border-gray-200/70 dark:border-gray-700/60">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider mr-1">Orders Filter:</span>
          {[
            { id: "paid_only", label: "Paid / Completed Orders Only" },
            { id: "delivered_only", label: "Delivered Only" },
            { id: "all", label: "All Orders (Inc. Pending)" }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setOrderStatusFilter(f.id as any)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                orderStatusFilter === f.id
                  ? "bg-emerald-800 text-white shadow-2xs"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
          Reconciled across <strong className="text-gray-950 dark:text-white font-bold">{totals.orderCount}</strong> checkout orders ({totals.unitsSold} units)
        </div>
      </div>

      {/* Executive Financial KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Gross Revenue */}
        <div className="bg-gradient-to-br from-emerald-50/80 to-emerald-100/40 dark:from-emerald-950/40 dark:to-emerald-900/20 p-4 rounded-2xl border border-emerald-200/70 dark:border-emerald-800/50">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Gross Sales Revenue</div>
          <div className="text-xl font-black text-emerald-950 dark:text-white mt-1">
            KES {totals.totalRevenue.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" /> Money Inflow
          </div>
        </div>

        {/* Cost of Goods Sold (COGS) */}
        <div className="bg-gradient-to-br from-rose-50/80 to-rose-100/40 dark:from-rose-950/40 dark:to-rose-900/20 p-4 rounded-2xl border border-rose-200/70 dark:border-rose-800/50">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800 dark:text-rose-300">Cost of Goods (COGS)</div>
          <div className="text-xl font-black text-rose-950 dark:text-white mt-1">
            KES {totals.totalCogs.toLocaleString()}
          </div>
          <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
            {totals.totalRevenue > 0 ? ((totals.totalCogs / totals.totalRevenue) * 100).toFixed(1) : 0}% of Revenue
          </div>
        </div>

        {/* Gross Profit & Margin */}
        <div className="bg-gradient-to-br from-blue-50/80 to-blue-100/40 dark:from-blue-950/40 dark:to-blue-900/20 p-4 rounded-2xl border border-blue-200/70 dark:border-blue-800/50">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800 dark:text-blue-300">Gross Profit (Margin)</div>
          <div className="text-xl font-black text-blue-950 dark:text-white mt-1">
            KES {totals.grossProfit.toLocaleString()}
          </div>
          <div className="text-[10px] text-blue-700 dark:text-blue-400 font-bold mt-1">
            {totals.grossMarginPct.toFixed(1)}% Margin
          </div>
        </div>

        {/* Operating Expenses */}
        <div className="bg-gradient-to-br from-amber-50/80 to-amber-100/40 dark:from-amber-950/40 dark:to-amber-900/20 p-4 rounded-2xl border border-amber-200/70 dark:border-amber-800/50">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300">Total OPEX Overhead</div>
          <div className="text-xl font-black text-amber-950 dark:text-white mt-1">
            KES {totals.operatingExpenses.toLocaleString()}
          </div>
          <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium mt-1">
            Logistics, Ads & Cloud
          </div>
        </div>

        {/* Net Operating Profit */}
        <div className="bg-gradient-to-br from-teal-50/80 to-teal-100/40 dark:from-teal-950/40 dark:to-teal-900/20 p-4 rounded-2xl border border-teal-200/70 dark:border-teal-800/50">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 dark:text-teal-300">Net Operating Profit</div>
          <div className={`text-xl font-black mt-1 ${totals.netProfit >= 0 ? "text-emerald-950 dark:text-emerald-300" : "text-rose-600"}`}>
            KES {totals.netProfit.toLocaleString()}
          </div>
          <div className="text-[10px] font-bold text-teal-700 dark:text-teal-400 mt-1">
            {totals.netMarginPct.toFixed(1)}% Net Margin
          </div>
        </div>

        {/* Unit Economics & AOV */}
        <div className="bg-gradient-to-br from-purple-50/80 to-purple-100/40 dark:from-purple-950/40 dark:to-purple-900/20 p-4 rounded-2xl border border-purple-200/70 dark:border-purple-800/50">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-purple-800 dark:text-purple-300">Avg Order Value (AOV)</div>
          <div className="text-xl font-black text-purple-950 dark:text-white mt-1">
            KES {totals.aov.toLocaleString()}
          </div>
          <div className="text-[10px] text-purple-700 dark:text-purple-400 font-medium mt-1">
            KES {totals.profitPerOrder} profit / order
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid: Interactive Trend Chart & Donut Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Performance Trend Graph */}
        <div className="lg:col-span-7 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h4 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                Revenue, COGS & Net Profit Trajectory ({periodType.toUpperCase()})
              </h4>
              <p className="text-[11px] text-gray-500">Live multi-series financial trajectory over active period intervals.</p>
            </div>
            
            {/* Chart Legend */}
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Gross Revenue
              </span>
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> COGS
              </span>
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Net Profit
              </span>
            </div>
          </div>

          {/* SVG Dynamic Trend Chart */}
          <div className="relative pt-2">
            <svg className="w-full h-56 overflow-visible" viewBox="0 0 500 180">
              {/* Horizontal Grid lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="currentColor" className="text-gray-100 dark:text-gray-800" strokeDasharray="3 3" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="currentColor" className="text-gray-100 dark:text-gray-800" strokeDasharray="3 3" />
              <line x1="0" y1="130" x2="500" y2="130" stroke="currentColor" className="text-gray-100 dark:text-gray-800" strokeDasharray="3 3" />
              <line x1="0" y1="160" x2="500" y2="160" stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth="1" />

              {/* Data Bars / Columns */}
              {aggregatedData.map((row, idx) => {
                const totalBars = aggregatedData.length || 1;
                const slotWidth = 500 / totalBars;
                const barWidth = Math.min(22, slotWidth * 0.35);
                const xCenter = (idx * slotWidth) + (slotWidth / 2);

                const revHeight = Math.max(2, (row.revenue / maxChartValue) * 140);
                const cogsHeight = Math.max(2, (row.cogs / maxChartValue) * 140);
                const profitHeight = Math.max(2, (Math.max(0, row.netProfit) / maxChartValue) * 140);

                const revY = 160 - revHeight;
                const cogsY = 160 - cogsHeight;
                const profitY = 160 - profitHeight;

                const isHovered = hoveredDataPoint?.key === row.key;

                return (
                  <g 
                    key={row.key} 
                    className="cursor-pointer transition-opacity hover:opacity-100 group"
                    onMouseEnter={() => setHoveredDataPoint(row)}
                    onMouseLeave={() => setHoveredDataPoint(null)}
                  >
                    {/* Background hover highlight */}
                    <rect
                      x={idx * slotWidth}
                      y="10"
                      width={slotWidth}
                      height="150"
                      fill={isHovered ? "rgba(16, 185, 129, 0.08)" : "transparent"}
                      rx="4"
                    />

                    {/* Revenue Bar */}
                    <rect
                      x={xCenter - barWidth}
                      y={revY}
                      width={barWidth}
                      height={revHeight}
                      fill="#059669"
                      rx="3"
                      className="transition-all duration-300 group-hover:fill-emerald-500"
                    />

                    {/* COGS Bar */}
                    <rect
                      x={xCenter}
                      y={cogsY}
                      width={barWidth}
                      height={cogsHeight}
                      fill="#f43f5e"
                      rx="3"
                      className="transition-all duration-300 group-hover:fill-rose-400"
                    />

                    {/* Net Profit Node */}
                    <circle
                      cx={xCenter}
                      cy={profitY}
                      r={isHovered ? 4.5 : 3}
                      fill="#2563eb"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />

                    {/* X-axis Label */}
                    <text
                      x={xCenter}
                      y="174"
                      textAnchor="middle"
                      fontSize="8"
                      className="fill-gray-400 font-mono"
                    >
                      {row.period.split(" ")[0]}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredDataPoint && (
              <div className="absolute top-2 right-2 bg-gray-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 z-10 border border-gray-700 animate-in fade-in">
                <div className="font-extrabold text-emerald-400 pb-1 border-b border-gray-800">{hoveredDataPoint.period}</div>
                <div className="flex justify-between gap-4 text-gray-300">
                  <span>Gross Revenue:</span>
                  <span className="font-bold text-white font-mono">KES {hoveredDataPoint.revenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between gap-4 text-rose-300">
                  <span>COGS:</span>
                  <span className="font-bold font-mono">KES {hoveredDataPoint.cogs.toLocaleString()}</span>
                </div>
                <div className="flex justify-between gap-4 text-emerald-300">
                  <span>Net Profit:</span>
                  <span className="font-bold font-mono">KES {hoveredDataPoint.netProfit.toLocaleString()} ({hoveredDataPoint.netMarginPct.toFixed(1)}%)</span>
                </div>
                <div className="flex justify-between gap-4 text-gray-400 text-[10px] pt-1 border-t border-gray-800">
                  <span>Orders: {hoveredDataPoint.orderCount}</span>
                  <span>Units: {hoveredDataPoint.unitsSold}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Category Revenue & Expense Donut Charts */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5">
          {/* Donut Chart 1: Revenue by Category */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                Revenue Distribution By Category
              </h4>
              <span className="text-[10px] font-mono text-gray-400 font-bold">100% Volume</span>
            </div>

            <div className="flex items-center gap-4">
              {/* SVG Donut */}
              <div className="relative w-28 h-28 shrink-0">
                <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                  {categoryDonutSlices.map(slice => (
                    <path
                      key={slice.category}
                      d={slice.pathData}
                      fill={slice.color}
                      className="transition-transform duration-200 hover:scale-105 origin-center cursor-pointer"
                      onMouseEnter={() => setHoveredSlice(slice.category)}
                      onMouseLeave={() => setHoveredSlice(null)}
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[11px] font-black text-gray-900 dark:text-white font-mono">
                    KES {(totals.totalRevenue / 1000).toFixed(0)}k
                  </span>
                  <span className="text-[8px] text-gray-400 font-bold uppercase">Total Rev</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="space-y-1.5 flex-1 text-xs">
                {categoryMatrix.map(c => (
                  <div key={c.category} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 font-medium">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: categoryColors[c.category] || "#6b7280" }}></span>
                      <span className="capitalize">{c.category}</span>
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white font-mono text-[11px]">
                      {totals.totalRevenue > 0 ? ((c.revenue / totals.totalRevenue) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Donut Chart 2: Operating Expense Breakdown */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                Cost & Expense Allocation
              </h4>
              <span className="text-[10px] font-mono text-rose-600 font-bold">KES {(totals.totalCogs + totals.operatingExpenses).toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-4">
              {/* SVG Donut */}
              <div className="relative w-28 h-28 shrink-0">
                <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                  {expenseDonutSlices.map(slice => (
                    <path
                      key={slice.name}
                      d={slice.pathData}
                      fill={slice.color}
                      className="transition-transform duration-200 hover:scale-105 origin-center cursor-pointer"
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[11px] font-black text-rose-600 font-mono">
                    KES {((totals.totalCogs + totals.operatingExpenses) / 1000).toFixed(0)}k
                  </span>
                  <span className="text-[8px] text-gray-400 font-bold uppercase">Total Costs</span>
                </div>
              </div>

              {/* Expense Legend List */}
              <div className="space-y-1 flex-1 text-[11px]">
                {expenseDonutSlices.slice(0, 4).map(e => (
                  <div key={e.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 truncate">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: e.color }}></span>
                      <span className="truncate">{e.name}</span>
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white font-mono text-[10px] shrink-0 ml-1">
                      {e.percentage.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation for Tables */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
          {/* Sub-Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveSubTab("period_table")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === "period_table"
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-950"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> Period Statement Ledger
            </button>
            <button
              onClick={() => setActiveSubTab("category_matrix")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === "category_matrix"
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-950"
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Product & Category Margins
            </button>
            <button
              onClick={() => setActiveSubTab("expense_breakdown")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === "expense_breakdown"
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-950"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" /> Operational Overhead Ledger
            </button>
          </div>

          {/* Search Box */}
          {activeSubTab === "category_matrix" && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search product name or SKU..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none dark:text-white"
              />
            </div>
          )}
        </div>

        {/* TAB 1: PERIOD STATEMENT TABLE */}
        {activeSubTab === "period_table" && (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 font-bold border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="p-3">Period Interval</th>
                  <th className="p-3 text-center">Orders</th>
                  <th className="p-3 text-center">Units Sold</th>
                  <th className="p-3 text-right">Gross Revenue</th>
                  <th className="p-3 text-right">COGS</th>
                  <th className="p-3 text-right">Gross Profit</th>
                  <th className="p-3 text-center">Gross Margin %</th>
                  <th className="p-3 text-right">OPEX Overhead</th>
                  <th className="p-3 text-right">Net Profit</th>
                  <th className="p-3 text-center">Net Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {aggregatedData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-gray-400 italic">
                      No order transaction data found for this period filter.
                    </td>
                  </tr>
                ) : (
                  aggregatedData.map(r => (
                    <tr key={r.key} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition font-medium">
                      <td className="p-3 font-bold text-gray-900 dark:text-white font-mono whitespace-nowrap">
                        {r.period}
                      </td>
                      <td className="p-3 text-center font-mono">{r.orderCount}</td>
                      <td className="p-3 text-center font-mono">{r.unitsSold}</td>
                      <td className="p-3 text-right font-bold text-emerald-800 dark:text-emerald-400 font-mono">
                        KES {r.revenue.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-bold text-rose-600 dark:text-rose-400 font-mono">
                        KES {r.cogs.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-bold text-blue-700 dark:text-blue-400 font-mono">
                        KES {r.grossProfit.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold px-2 py-0.5 rounded text-[10px]">
                          {r.grossMarginPct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-gray-600 dark:text-gray-300">
                        KES {r.expenses.toLocaleString()}
                      </td>
                      <td className={`p-3 text-right font-black font-mono ${r.netProfit >= 0 ? "text-emerald-800 dark:text-emerald-400" : "text-rose-600"}`}>
                        KES {r.netProfit.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                          r.netMarginPct >= 20
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                            : r.netMarginPct >= 0
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300"
                        }`}>
                          {r.netMarginPct.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-emerald-50/70 dark:bg-emerald-950/40 font-black text-emerald-950 dark:text-white border-t-2 border-emerald-300 dark:border-emerald-700">
                <tr>
                  <td className="p-3 uppercase">Total / Summary</td>
                  <td className="p-3 text-center">{totals.orderCount}</td>
                  <td className="p-3 text-center">{totals.unitsSold}</td>
                  <td className="p-3 text-right font-mono">KES {totals.totalRevenue.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-rose-700 dark:text-rose-400">KES {totals.totalCogs.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-blue-800 dark:text-blue-300">KES {totals.grossProfit.toLocaleString()}</td>
                  <td className="p-3 text-center">{totals.grossMarginPct.toFixed(1)}%</td>
                  <td className="p-3 text-right font-mono">KES {totals.operatingExpenses.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-emerald-800 dark:text-emerald-300">KES {totals.netProfit.toLocaleString()}</td>
                  <td className="p-3 text-center">{totals.netMarginPct.toFixed(1)}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* TAB 2: PRODUCT & CATEGORY PROFITABILITY MATRIX */}
        {activeSubTab === "category_matrix" && (
          <div className="space-y-5">
            {/* Category Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {categoryMatrix.map(c => (
                <div key={c.category} className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="capitalize font-extrabold text-xs text-gray-900 dark:text-white">{c.category} Care</span>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">{c.marginPct.toFixed(1)}% Margin</span>
                  </div>
                  <div className="text-base font-black text-gray-900 dark:text-white mt-1">KES {c.revenue.toLocaleString()}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{c.unitsSold} units | Profit: KES {c.grossProfit.toLocaleString()}</div>
                </div>
              ))}
            </div>

            {/* Individual Products Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 font-bold border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-center">Units Sold</th>
                    <th className="p-3 text-right">Revenue (KES)</th>
                    <th className="p-3 text-right">Cost (COGS)</th>
                    <th className="p-3 text-right">Gross Profit</th>
                    <th className="p-3 text-center">Gross Margin %</th>
                    <th className="p-3 text-center">Contribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {productProfitability.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-gray-400 italic">
                        No product profitability records found matching your query.
                      </td>
                    </tr>
                  ) : (
                    productProfitability.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition font-medium">
                        <td className="p-3 font-bold text-gray-900 dark:text-white">{p.name}</td>
                        <td className="p-3 font-mono text-[11px] text-emerald-800 dark:text-emerald-400 font-semibold">{p.sku}</td>
                        <td className="p-3">
                          <span className="capitalize px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                            {p.category}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono">{p.unitsSold}</td>
                        <td className="p-3 text-right font-bold text-emerald-800 dark:text-emerald-400 font-mono">
                          KES {p.revenue.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-bold text-rose-600 dark:text-rose-400 font-mono">
                          KES {p.cogs.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-bold text-blue-700 dark:text-blue-400 font-mono">
                          KES {p.grossProfit.toLocaleString()}
                        </td>
                        <td className="p-3 text-center font-bold">
                          <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded text-[10px]">
                            {p.marginPct.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono text-gray-500">
                          {totals.grossProfit > 0 ? ((p.grossProfit / totals.grossProfit) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: OPERATING OVERHEAD EXPENSES LEDGER */}
        {activeSubTab === "expense_breakdown" && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-semibold">
                <Zap className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Operational expenses include delivery fulfillment, marketing campaign ad-spends, server infrastructure, and promo discounts.</span>
              </div>
              <span className="font-mono font-black text-amber-950 dark:text-white shrink-0">Total: KES {totals.operatingExpenses.toLocaleString()}</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 font-bold border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="p-3">Expense Line Item</th>
                    <th className="p-3">Account Description</th>
                    <th className="p-3">Funding / Source Channel</th>
                    <th className="p-3 text-right">Amount (KES)</th>
                    <th className="p-3 text-center">% of Total OPEX</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                  <tr className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition">
                    <td className="p-3 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5 text-blue-600" /> Logistics & Delivery
                    </td>
                    <td className="p-3 text-gray-500">Carrier shipping and local door delivery rider costs</td>
                    <td className="p-3 text-gray-600 dark:text-gray-400">Order Delivery Fees Pool</td>
                    <td className="p-3 text-right font-black font-mono text-gray-900 dark:text-white">
                      KES {totals.expenseBreakdown.logistics.toLocaleString()}
                    </td>
                    <td className="p-3 text-center font-bold text-gray-700 dark:text-gray-300 font-mono">
                      {totals.operatingExpenses > 0 ? ((totals.expenseBreakdown.logistics / totals.operatingExpenses) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>

                  <tr className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition">
                    <td className="p-3 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Marketing & Ad Spends
                    </td>
                    <td className="p-3 text-gray-500">Social campaigns, influencer seeding & Meta/Google ads</td>
                    <td className="p-3 text-gray-600 dark:text-gray-400">Campaigns Module Budget</td>
                    <td className="p-3 text-right font-black font-mono text-gray-900 dark:text-white">
                      KES {totals.expenseBreakdown.marketing.toLocaleString()}
                    </td>
                    <td className="p-3 text-center font-bold text-gray-700 dark:text-gray-300 font-mono">
                      {totals.operatingExpenses > 0 ? ((totals.expenseBreakdown.marketing / totals.operatingExpenses) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>

                  <tr className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition">
                    <td className="p-3 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Cloud & DevOps Hosting
                    </td>
                    <td className="p-3 text-gray-500">Supabase Postgres database, edge functions & storage</td>
                    <td className="p-3 text-gray-600 dark:text-gray-400">Fixed Operating Infrastructure</td>
                    <td className="p-3 text-right font-black font-mono text-gray-900 dark:text-white">
                      KES {totals.expenseBreakdown.hosting.toLocaleString()}
                    </td>
                    <td className="p-3 text-center font-bold text-gray-700 dark:text-gray-300 font-mono">
                      {totals.operatingExpenses > 0 ? ((totals.expenseBreakdown.hosting / totals.operatingExpenses) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>

                  <tr className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition">
                    <td className="p-3 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-amber-600" /> Promo & Coupon Discounts
                    </td>
                    <td className="p-3 text-gray-500">Price deductions applied via promo coupon codes</td>
                    <td className="p-3 text-gray-600 dark:text-gray-400">Checkout Discounts Subsidies</td>
                    <td className="p-3 text-right font-black font-mono text-gray-900 dark:text-white">
                      KES {totals.expenseBreakdown.discounts.toLocaleString()}
                    </td>
                    <td className="p-3 text-center font-bold text-gray-700 dark:text-gray-300 font-mono">
                      {totals.operatingExpenses > 0 ? ((totals.expenseBreakdown.discounts / totals.operatingExpenses) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
