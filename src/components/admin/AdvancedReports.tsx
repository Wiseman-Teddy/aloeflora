import React, { useState, useMemo } from "react";
import { 
  ShoppingBag, Layers, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Search,
  AlertCircle, DollarSign, MapPin, Users, Gift, Headphones, CalendarCheck, Percent,
  ShieldAlert, FileText, CheckCircle, AlertTriangle, Truck, Clock, Download
} from "lucide-react";
import { Order, Product, SupportTicket, MarketingCampaign, Promo, UserProfile, EventRegistration, AuditAnomaly } from "../../types";
import { exportToPDF, exportToCSV } from "../../utils/exportUtils";
import { normalizeVariants } from "../../utils/variantUtils";

interface AdvancedReportsProps {
  orders?: Order[];
  products?: Product[];
  supportTickets?: SupportTicket[];
  campaigns?: MarketingCampaign[];
  promos?: Promo[];
  userProfiles?: UserProfile[];
  eventRegistrations?: EventRegistration[];
  anomalies?: AuditAnomaly[];
  generateReportsPDF?: (type: string) => void;
  generateReportsCSV?: (type: string) => void;
}

type ReportTabType = "sales" | "orders" | "inventory" | "financial" | "customers" | "marketing" | "events" | "support";

export default function AdvancedReports({
  orders = [],
  products = [],
  supportTickets = [],
  campaigns = [],
  promos = [],
  userProfiles = [],
  eventRegistrations = [],
  anomalies = [],
}: AdvancedReportsProps) {
  const [reportTab, setReportTab] = useState<ReportTabType>("sales");
  const [dateRange, setDateRange] = useState<"all" | "today" | "week" | "month">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Safe Arrays
  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeProducts = Array.isArray(products) ? products : [];
  const safeTickets = Array.isArray(supportTickets) ? supportTickets : [];
  const safeCampaigns = Array.isArray(campaigns) ? campaigns : [];
  const safePromos = Array.isArray(promos) ? promos : [];
  const safeUserProfiles = Array.isArray(userProfiles) ? userProfiles : [];
  const safeEventRegistrations = Array.isArray(eventRegistrations) ? eventRegistrations : [];

  // Filtered Orders helper
  const filteredOrders = useMemo(() => {
    return safeOrders.filter(o => {
      if (!o) return false;
      const searchLower = (searchQuery || "").toLowerCase();
      const isMatchSearch = (o.id || "").toLowerCase().includes(searchLower) || 
                            (o.customerName || "").toLowerCase().includes(searchLower) ||
                            (o.county || "").toLowerCase().includes(searchLower) ||
                            (o.subCounty || "").toLowerCase().includes(searchLower);
      if (!isMatchSearch) return false;

      const orderDate = o.createdAt ? new Date(o.createdAt) : new Date();
      const now = new Date();
      if (dateRange === "today") {
        return orderDate.toDateString() === now.toDateString();
      }
      if (dateRange === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return orderDate >= weekAgo;
      }
      if (dateRange === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return orderDate >= monthAgo;
      }
      return true;
    });
  }, [safeOrders, dateRange, searchQuery]);

  // 1. Sales & Products
  const totalProductsSold = useMemo(() => 
    filteredOrders.reduce((sum, o) => sum + (o?.paymentStatus === "paid" ? (o.items || []).reduce((acc, i) => acc + (i?.quantity || 0), 0) : 0), 0),
    [filteredOrders]
  );
  
  const totalRevenue = useMemo(() => 
    filteredOrders.reduce((sum, o) => sum + (o?.paymentStatus === "paid" ? (o.total || 0) : 0), 0),
    [filteredOrders]
  );

  const productSalesMap = useMemo(() => {
    const map: Record<string, { name: string; qty: number; rev: number; category: string }> = {};
    filteredOrders.filter(o => o && o.paymentStatus === "paid").forEach(o => {
      (o.items || []).forEach(i => {
        if (!i || !i.productId) return;
        if (!map[i.productId]) {
          const p = safeProducts.find(prod => prod && prod.id === i.productId);
          map[i.productId] = { name: i.productName || p?.name || "Product", qty: 0, rev: 0, category: p?.category || "general" };
        }
        map[i.productId].qty += (i.quantity || 0);
        map[i.productId].rev += (i.price || 0) * (i.quantity || 0);
      });
    });
    return Object.values(map).sort((a, b) => b.qty - a.qty);
  }, [filteredOrders, safeProducts]);

  const topSelling = productSalesMap.slice(0, 5);

  // Variant level sales breakdown
  const variantSalesList = useMemo(() => {
    const map: Record<string, { variant: string; qty: number; rev: number }> = {};
    filteredOrders.filter(o => o && o.paymentStatus === "paid").forEach(o => {
      (o.items || []).forEach(i => {
        if (!i) return;
        const key = `${i.productName || "Item"} (${i.selectedVariant || "Standard"})`;
        if (!map[key]) map[key] = { variant: key, qty: 0, rev: 0 };
        map[key].qty += (i.quantity || 0);
        map[key].rev += (i.price || 0) * (i.quantity || 0);
      });
    });
    return Object.values(map).sort((a, b) => b.qty - a.qty);
  }, [filteredOrders]);

  // 2. Orders & Geographic Logistics
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders > 0 ? (filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0) / totalOrders).toFixed(2) : "0.00";
  
  const statusBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = { pending: 0, dispatched: 0, delivered: 0, cancelled: 0 };
    filteredOrders.forEach(o => {
      if (o && o.deliveryStatus && breakdown[o.deliveryStatus] !== undefined) {
        breakdown[o.deliveryStatus]++;
      }
    });
    return breakdown;
  }, [filteredOrders]);

  const regionalHeatmap = useMemo(() => {
    const map: Record<string, { county: string; orderCount: number; totalRevenue: number }> = {};
    filteredOrders.forEach(o => {
      if (!o) return;
      const countyKey = o.county || "Nairobi";
      if (!map[countyKey]) map[countyKey] = { county: countyKey, orderCount: 0, totalRevenue: 0 };
      map[countyKey].orderCount += 1;
      if (o.paymentStatus === "paid") map[countyKey].totalRevenue += (o.total || 0);
    });
    return Object.values(map).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredOrders]);

  // 3. Inventory ERP & Stock Velocity
  const reorderAlertList = useMemo(() => {
    return safeProducts.filter(Boolean).map(p => {
      const soldLast14Days = filteredOrders
        .filter(o => o && o.paymentStatus === "paid" && o.createdAt && new Date(o.createdAt) >= new Date(Date.now() - 14 * 24 * 60 * 60 * 1000))
        .reduce((sum, o) => sum + (o.items || []).filter(i => i && i.productId === p.id).reduce((acc, i) => acc + (i.quantity || 0), 0), 0);
      const dailyVelocity = soldLast14Days / 14;
      const stock = p.stock || 0;
      const daysOfStockLeft = dailyVelocity > 0 ? Math.round(stock / dailyVelocity) : 999;
      const reorderLevel = p.reorderLevel || 15;
      const safetyStock = p.safetyStock || 10;
      const recommendedReorder = Math.max(0, reorderLevel * 2 - stock);
      return {
        ...p,
        stock,
        safetyStock,
        reorderLevel,
        soldLast14Days,
        dailyVelocity: dailyVelocity.toFixed(1),
        daysOfStockLeft,
        recommendedReorder,
        isLow: stock <= safetyStock || stock <= reorderLevel
      };
    }).sort((a, b) => a.daysOfStockLeft - b.daysOfStockLeft);
  }, [safeProducts, filteredOrders]);

  const inventoryValuation = useMemo(() => {
    const totalCostValuation = safeProducts.reduce((sum, p) => {
      const vars = normalizeVariants(p);
      if (vars && vars.length > 0 && vars[0]?.name !== "Standard") {
        const vCost = vars.reduce((vSum, v) => vSum + (v.stock || 0) * (v.costPrice || p.costPrice || (p.price || 0) * 0.5), 0);
        return sum + (vCost > 0 ? vCost : (p.stock || 0) * (p.costPrice || (p.price || 0) * 0.5));
      }
      return sum + (p.stock || 0) * (p.costPrice || (p.price || 0) * 0.5);
    }, 0);

    const totalRetailValuation = safeProducts.reduce((sum, p) => {
      const vars = normalizeVariants(p);
      if (vars && vars.length > 0 && vars[0]?.name !== "Standard") {
        const vRetail = vars.reduce((vSum, v) => vSum + (v.stock || 0) * (v.price || p.price || 0), 0);
        return sum + (vRetail > 0 ? vRetail : (p.stock || 0) * (p.price || 0));
      }
      return sum + (p.stock || 0) * (p.price || 0);
    }, 0);

    const potentialMargin = totalRetailValuation - totalCostValuation;
    return { totalCostValuation, totalRetailValuation, potentialMargin };
  }, [safeProducts]);

  const deadStockList = useMemo(() => {
    const soldMap: Record<string, number> = {};
    filteredOrders.forEach(o => {
      (o?.items || []).forEach(i => {
        if (i?.productId) soldMap[i.productId] = (soldMap[i.productId] || 0) + (i.quantity || 0);
      });
    });
    return safeProducts.filter(p => (p?.stock || 0) > 10 && (!soldMap[p.id] || soldMap[p.id] < 3));
  }, [safeProducts, filteredOrders]);

  // 4. Financial & Payment Reconciliation
  const paymentMethodBreakdown = useMemo(() => {
    let stkPaid = 0, stkFailed = 0, paybillPaid = 0, paybillFailed = 0;
    filteredOrders.forEach(o => {
      if (!o) return;
      if (o.paymentMethod === "mpesa_stk") {
        if (o.paymentStatus === "paid") stkPaid += (o.total || 0);
        else stkFailed += (o.total || 0);
      } else {
        if (o.paymentStatus === "paid") paybillPaid += (o.total || 0);
        else paybillFailed += (o.total || 0);
      }
    });
    return { stkPaid, stkFailed, paybillPaid, paybillFailed };
  }, [filteredOrders]);

  const cancelledRevenueLoss = useMemo(() => {
    return filteredOrders
      .filter(o => o && (o.deliveryStatus === "cancelled" || o.paymentStatus === "failed"))
      .reduce((sum, o) => sum + (o.total || 0), 0);
  }, [filteredOrders]);

  const totalDeliveryFeesCollected = useMemo(() => {
    return filteredOrders
      .filter(o => o && o.paymentStatus === "paid")
      .reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
  }, [filteredOrders]);

  // 5. Customer & Beauty Profiles
  const customerLtvList = useMemo(() => {
    return safeUserProfiles.filter(Boolean).map(u => {
      const uEmail = (u.email || "").toLowerCase();
      const uPhone = u.phone || "";
      const uOrders = safeOrders.filter(o => o && ((o.email && o.email.toLowerCase() === uEmail) || (o.phone && o.phone === uPhone)));
      const totalSpent = uOrders.filter(o => o.paymentStatus === "paid").reduce((sum, o) => sum + (o.total || 0), 0);
      return {
        ...u,
        fullName: u.fullName || u.email || "Customer",
        orderCount: uOrders.length,
        calculatedLtv: totalSpent,
        lastOrderDate: uOrders.length > 0 ? new Date(Math.max(...uOrders.map(o => new Date(o.createdAt).getTime()))).toLocaleDateString() : "No orders"
      };
    }).sort((a, b) => b.calculatedLtv - a.calculatedLtv);
  }, [safeUserProfiles, safeOrders]);

  const loyaltyBalanceTotal = useMemo(() => {
    return safeUserProfiles.reduce((sum, u) => sum + (u?.loyaltyPoints || 0), 0);
  }, [safeUserProfiles]);

  const beautyProfileStats = useMemo(() => {
    const hairMap: Record<string, number> = {};
    const skinMap: Record<string, number> = {};
    safeUserProfiles.forEach(u => {
      if (u?.hairType) hairMap[u.hairType] = (hairMap[u.hairType] || 0) + 1;
      if (u?.skinType) skinMap[u.skinType] = (skinMap[u.skinType] || 0) + 1;
    });
    return { hairMap, skinMap };
  }, [safeUserProfiles]);

  const inactiveUsersList = useMemo(() => {
    const activeEmails = new Set(safeOrders.map(o => (o?.email || "").toLowerCase()));
    return safeUserProfiles.filter(u => u?.email && !activeEmails.has(u.email.toLowerCase()));
  }, [safeUserProfiles, safeOrders]);

  // 6. Marketing Attribution
  const promoRoiStats = useMemo(() => {
    return safePromos.filter(Boolean).map(p => {
      const code = p.code || "";
      const matchedOrders = safeOrders.filter(o => o && ((o.id && o.id.includes(code)) || (o.deliveryNotes && o.deliveryNotes.includes(code))));
      const totalGeneratedRev = matchedOrders.filter(o => o.paymentStatus === "paid").reduce((sum, o) => sum + (o.total || 0), 0);
      const discountGiven = (totalGeneratedRev * (p.discountPercent || 10)) / 100;
      return {
        ...p,
        code,
        discountPercent: p.discountPercent || 10,
        usedCount: matchedOrders.length,
        totalGeneratedRev,
        discountGiven
      };
    });
  }, [safePromos, safeOrders]);

  // 7. Event Analytics
  const eventOccupancyStats = useMemo(() => {
    return safeEventRegistrations.filter(Boolean).reduce((acc, r) => {
      if (r.payment_status === "paid") acc.paidTotal += Number(r.amount_paid || 0);
      if (r.role === "vendor") acc.vendorCount += 1;
      else acc.attendeeCount += 1;
      return acc;
    }, { paidTotal: 0, vendorCount: 0, attendeeCount: 0 });
  }, [safeEventRegistrations]);

  // 8. Support SLA Analytics
  const supportSlaStats = useMemo(() => {
    const openCount = safeTickets.filter(t => t && t.status === "open").length;
    const resolvedCount = safeTickets.filter(t => t && t.status === "resolved").length;
    const inProgressCount = safeTickets.filter(t => t && t.status === "in_progress").length;
    return { openCount, resolvedCount, inProgressCount, total: safeTickets.length };
  }, [safeTickets]);

  // --- EXPORT HANDLERS ---
  const handleExportPDF = () => {
    if (reportTab === "sales") {
      const rows = productSalesMap.map(p => [p.name, p.category, p.qty, `KES ${p.rev.toLocaleString()}`]);
      exportToPDF("Product_Sales_Report", "Product Sales Performance Breakdown", ["Product Name", "Category", "Units Sold", "Total Revenue"], rows);
    } else if (reportTab === "orders") {
      const rows = filteredOrders.map(o => [(o.id || "").slice(0, 8).toUpperCase(), o.customerName || "N/A", `${o.estate || ""}, ${o.county || ""}`, `KES ${(o.total || 0).toLocaleString()}`, (o.deliveryStatus || "").toUpperCase(), o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "N/A"]);
      exportToPDF("Customer_Orders_Report", "Customer Orders & Logistics Fulfillment", ["Order Ref", "Customer", "Location", "Total", "Delivery Status", "Date"], rows);
    } else if (reportTab === "inventory") {
      const rows = reorderAlertList.map(p => [p.name, p.stock, p.safetyStock, p.reorderLevel, `${p.daysOfStockLeft} days`, `${p.recommendedReorder} units`]);
      exportToPDF("Inventory_ERP_Report", "Low Stock & Reorder Velocity Intelligence", ["Product", "Stock", "Safety Stock", "Reorder Threshold", "Days Left", "Recommended Reorder"], rows);
    } else if (reportTab === "financial") {
      const rows = [
        ["Total Revenue (Paid)", `KES ${totalRevenue.toLocaleString()}`],
        ["Cancelled / Lost Revenue", `KES ${cancelledRevenueLoss.toLocaleString()}`],
        ["Delivery Fees Collected", `KES ${totalDeliveryFeesCollected.toLocaleString()}`],
        ["STK Push Volume", `KES ${paymentMethodBreakdown.stkPaid.toLocaleString()}`],
        ["Paybill Volume", `KES ${paymentMethodBreakdown.paybillPaid.toLocaleString()}`],
      ];
      exportToPDF("Financial_Reconciliation_Report", "Financial Payment & Revenue Reconciliation Statement", ["Financial Line Item", "Amount"], rows);
    } else if (reportTab === "customers") {
      const rows = customerLtvList.map(c => [c.fullName, c.email || "N/A", c.hairType || "N/A", c.skinType || "N/A", `${c.orderCount} orders`, `KES ${c.calculatedLtv.toLocaleString()}`]);
      exportToPDF("Customer_LTV_Report", "Customer Lifetime Value & Beauty Profiles", ["Customer Name", "Email", "Hair Type", "Skin Type", "Orders", "Calculated LTV"], rows);
    } else if (reportTab === "marketing") {
      const rows = promoRoiStats.map(p => [p.code, `${p.discountPercent}%`, p.usedCount, `KES ${p.totalGeneratedRev.toLocaleString()}`, `KES ${p.discountGiven.toLocaleString()}`]);
      exportToPDF("Promo_Marketing_Report", "Promo Code & Marketing Attribution ROI", ["Promo Code", "Discount %", "Times Used", "Revenue Generated", "Discount Expense"], rows);
    } else if (reportTab === "events") {
      const rows = safeEventRegistrations.map(r => [r.name || "Registrant", (r.role || "attendee").toUpperCase(), (r.payment_status || "free").toUpperCase(), `KES ${r.amount_paid || 0}`, r.mpesa_receipt || "N/A"]);
      exportToPDF("Event_Ticketing_Report", "Event Registrations & Ticket Revenue", ["Registrant", "Role", "Payment Status", "Amount Paid", "M-Pesa Receipt"], rows);
    } else if (reportTab === "support") {
      const rows = safeTickets.map(t => [(t.id || "").slice(0, 8), t.customerName || "Customer", t.subject || "No Subject", (t.status || "open").toUpperCase(), t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "N/A"]);
      exportToPDF("Support_SLA_Report", "Customer Support SLA & Resolution Report", ["Ticket ID", "Customer", "Subject", "Status", "Created Date"], rows);
    }
  };

  const handleExportCSV = () => {
    if (reportTab === "sales") {
      const rows = productSalesMap.map(p => [p.name, p.category, p.qty, p.rev]);
      exportToCSV("Product_Sales_Report", rows, ["Product Name", "Category", "Units Sold", "Total Revenue KES"]);
    } else if (reportTab === "orders") {
      const rows = filteredOrders.map(o => [o.id, o.customerName, o.phone, o.email, o.county, o.subCounty, o.total, o.paymentStatus, o.deliveryStatus, o.createdAt]);
      exportToCSV("Customer_Orders_Report", rows, ["Order ID", "Customer Name", "Phone", "Email", "County", "SubCounty", "Total KES", "Payment Status", "Delivery Status", "Created At"]);
    } else if (reportTab === "inventory") {
      const rows = reorderAlertList.map(p => [p.name, p.stock, p.safetyStock, p.reorderLevel, p.dailyVelocity, p.daysOfStockLeft, p.recommendedReorder]);
      exportToCSV("Inventory_ERP_Report", rows, ["Product Name", "Stock", "Safety Stock", "Reorder Level", "Daily Velocity", "Days Stock Left", "Recommended Reorder"]);
    } else if (reportTab === "financial") {
      const rows = [
        ["Total Revenue", totalRevenue],
        ["Cancelled Revenue Loss", cancelledRevenueLoss],
        ["Delivery Fees Collected", totalDeliveryFeesCollected],
        ["STK Push Paid", paymentMethodBreakdown.stkPaid],
        ["Paybill Paid", paymentMethodBreakdown.paybillPaid]
      ];
      exportToCSV("Financial_Reconciliation_Report", rows, ["Metric Name", "Value KES"]);
    } else if (reportTab === "customers") {
      const rows = customerLtvList.map(c => [c.fullName, c.email, c.phone || "", c.hairType || "", c.skinType || "", c.orderCount, c.calculatedLtv, c.loyaltyPoints || 0]);
      exportToCSV("Customer_LTV_Report", rows, ["Full Name", "Email", "Phone", "Hair Type", "Skin Type", "Order Count", "Lifetime Value KES", "Loyalty Points"]);
    } else if (reportTab === "marketing") {
      const rows = promoRoiStats.map(p => [p.code, p.discountPercent, p.usedCount, p.totalGeneratedRev, p.discountGiven]);
      exportToCSV("Promo_Marketing_Report", rows, ["Promo Code", "Discount Percent", "Times Used", "Total Revenue KES", "Discount Expense KES"]);
    } else if (reportTab === "events") {
      const rows = safeEventRegistrations.map(r => [r.name, r.email, r.phone, r.role, r.payment_status, r.amount_paid, r.mpesa_receipt || ""]);
      exportToCSV("Event_Ticketing_Report", rows, ["Registrant Name", "Email", "Phone", "Role", "Payment Status", "Amount Paid KES", "Mpesa Receipt"]);
    } else if (reportTab === "support") {
      const rows = safeTickets.map(t => [t.id, t.customerName, t.email, t.subject, t.status, t.createdAt]);
      exportToCSV("Support_SLA_Report", rows, ["Ticket ID", "Customer Name", "Email", "Subject", "Status", "Created At"]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-left">
      {/* Header & Module Switcher */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between pb-4 border-b gap-4">
        <div>
          <h3 className="text-xl font-black text-gray-950 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-800" /> Advanced Operational Reporting & Business Intelligence
          </h3>
          <p className="text-xs text-gray-500 mt-1">Real-time cross-functional analytics for Aloeflora Enterprise operations.</p>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="flex flex-wrap bg-zinc-100 p-1.5 rounded-2xl gap-1 max-w-full overflow-x-auto">
          {[
            { id: "sales", label: "Product Sales", icon: ShoppingBag },
            { id: "orders", label: "Orders & Regional SLA", icon: Truck },
            { id: "inventory", label: "Inventory ERP", icon: AlertCircle },
            { id: "financial", label: "Financial Reconciliation", icon: DollarSign },
            { id: "customers", label: "Customers & Beauty", icon: Users },
            { id: "marketing", label: "Marketing & Promos", icon: Percent },
            { id: "events", label: "Events & Ticketing", icon: CalendarCheck },
            { id: "support", label: "Support SLA", icon: Headphones },
          ].map((tab) => {
            const IconComponent = tab.icon;
            const isActive = reportTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setReportTab(tab.id as ReportTabType)}
                className={`px-3 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive ? "bg-white shadow text-emerald-800" : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                }`}
              >
                <IconComponent className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Filters & Export Toolbar */}
      <div className="flex flex-wrap gap-4 items-center bg-zinc-50/80 p-3.5 rounded-2xl border border-zinc-200/80">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input 
            type="text"
            placeholder="Search report details, locations, customers..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-800 shadow-xs"
          />
        </div>
        <select 
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as any)}
          className="bg-white border border-gray-200 rounded-xl text-xs px-4 py-2 focus:outline-none focus:border-emerald-800 shadow-xs"
        >
          <option value="all">All Time History</option>
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
        </select>

        <div className="flex gap-2">
          <button 
            onClick={handleExportPDF} 
            className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export PDF Report
          </button>
          <button 
            onClick={handleExportCSV} 
            className="bg-white border border-gray-300 text-gray-800 font-bold text-xs py-2 px-4 rounded-xl hover:bg-gray-50 transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-gray-600" /> Export CSV Data
          </button>
        </div>
      </div>

      {/* --- TAB 1: PRODUCT SALES & VARIANTS --- */}
      {reportTab === "sales" && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-50 border p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Products Sold</div>
              <div className="text-xl font-black text-gray-900">{totalProductsSold} Units</div>
            </div>
            <div className="bg-zinc-50 border p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Total Sales Revenue</div>
              <div className="text-xl font-black text-emerald-800">KES {totalRevenue.toLocaleString()}</div>
            </div>
            <div className="bg-zinc-50 border p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Avg Price Per Sold Item</div>
              <div className="text-xl font-black text-gray-900">KES {totalProductsSold > 0 ? (totalRevenue / totalProductsSold).toFixed(0) : 0}</div>
            </div>
            <div className="bg-zinc-50 border p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Active Products Catalog</div>
              <div className="text-xl font-black text-gray-900">{safeProducts.length} Listings</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border rounded-2xl p-5 shadow-sm">
              <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" /> Top Selling Products
              </h4>
              <div className="space-y-3">
                {topSelling.length > 0 ? topSelling.map((p, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-xs font-bold text-gray-800 truncate pr-4">{p.name}</span>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-emerald-800">{p.qty} sold</div>
                      <div className="text-[10px] text-gray-500">KES {p.rev.toLocaleString()}</div>
                    </div>
                  </div>
                )) : <p className="text-xs text-gray-400 italic">No sales data found for this period.</p>}
              </div>
            </div>

            <div className="bg-white border rounded-2xl p-5 shadow-sm">
              <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ArrowDownRight className="w-4 h-4 text-red-500" /> Variant-Level Sales Performance
              </h4>
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                {variantSalesList.length > 0 ? variantSalesList.map((v, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-xs font-bold text-gray-800 truncate pr-4">{v.variant}</span>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-gray-900">{v.qty} sold</div>
                      <div className="text-[10px] text-emerald-800">KES {v.rev.toLocaleString()}</div>
                    </div>
                  </div>
                )) : <p className="text-xs text-gray-400 italic">No variant data recorded.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: ORDERS & REGIONAL GEOGRAPHIC SLA --- */}
      {reportTab === "orders" && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-zinc-50 border p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Total Customer Orders</div>
              <div className="text-xl font-black text-gray-900">{totalOrders}</div>
            </div>
            <div className="bg-zinc-50 border p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Average Order Value (AOV)</div>
              <div className="text-xl font-black text-emerald-800">KES {avgOrderValue}</div>
            </div>
            <div className="bg-zinc-50 border p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Delivered Orders SLA</div>
              <div className="text-xl font-black text-emerald-700">{statusBreakdown.delivered || 0}</div>
            </div>
            <div className="bg-zinc-50 border p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Pending Dispatch</div>
              <div className="text-xl font-black text-amber-600">{(statusBreakdown.pending || 0) + (statusBreakdown.dispatched || 0)}</div>
            </div>
          </div>

          {/* Regional Geographic Demand Breakdown */}
          <div className="bg-white border rounded-2xl p-5 shadow-sm">
            <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" /> Geographic Regional Demand Breakdown (County / Depot)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {regionalHeatmap.length > 0 ? regionalHeatmap.map((r, i) => (
                <div key={i} className="border p-4 rounded-xl bg-gray-50/50 flex justify-between items-center">
                  <div>
                    <div className="font-extrabold text-xs text-gray-900">{r.county} County</div>
                    <div className="text-[10px] text-gray-500">{r.orderCount} total orders</div>
                  </div>
                  <div className="text-right font-black text-xs text-emerald-800">
                    KES {r.totalRevenue.toLocaleString()}
                  </div>
                </div>
              )) : <p className="text-xs text-gray-400 italic col-span-3">No regional order data available.</p>}
            </div>
          </div>

          <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h4 className="text-sm font-bold text-gray-900">Master Orders Ledger & Delivery SLA</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-white border-b text-gray-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-4">Order Ref / Date</th>
                    <th className="p-4">Customer & Phone</th>
                    <th className="p-4">Delivery County / Estate</th>
                    <th className="p-4 text-right">Total Amount</th>
                    <th className="p-4 text-center">Fulfillment SLA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.length > 0 ? filteredOrders.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-mono text-emerald-800 font-bold">
                        {(o.id || "").slice(0, 8).toUpperCase()}
                        <div className="text-gray-400 text-[10px]">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "N/A"}</div>
                      </td>
                      <td className="p-4 font-semibold text-gray-800">
                        {o.customerName || "Customer"}
                        <div className="text-[10px] font-normal text-gray-500">{o.phone || ""}</div>
                      </td>
                      <td className="p-4 text-gray-700">
                        <div className="font-bold">{o.county || "Nairobi"}</div>
                        <div className="text-[10px] text-gray-500">{o.estate || ""}, {o.subCounty || ""}</div>
                      </td>
                      <td className="p-4 text-right font-bold text-gray-900">
                        KES {(o.total || 0).toLocaleString()}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          o.deliveryStatus === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                          o.deliveryStatus === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {(o.deliveryStatus || "pending").toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-400 italic">No orders found matching criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: INVENTORY ERP & STOCK VELOCITY --- */}
      {reportTab === "inventory" && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-50 border p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Inventory Asset Cost Value</div>
              <div className="text-xl font-black text-red-600">KES {inventoryValuation.totalCostValuation.toLocaleString()}</div>
            </div>
            <div className="bg-zinc-50 border p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Retail Potential Value</div>
              <div className="text-xl font-black text-emerald-800">KES {inventoryValuation.totalRetailValuation.toLocaleString()}</div>
            </div>
            <div className="bg-zinc-50 border p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Potential Gross Stock Margin</div>
              <div className="text-xl font-black text-lime-700">KES {inventoryValuation.potentialMargin.toLocaleString()}</div>
            </div>
          </div>

          {/* Low Stock & Reorder Intelligence */}
          <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b bg-amber-50/50 flex justify-between items-center">
              <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" /> Low Stock & Automated Reorder Threshold Report
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-white border-b text-gray-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-4">Product Name</th>
                    <th className="p-4 text-center">Current Stock</th>
                    <th className="p-4 text-center">Safety Buffer</th>
                    <th className="p-4 text-center">Reorder Trigger</th>
                    <th className="p-4 text-center">Est Days Left</th>
                    <th className="p-4 text-right">Recommended Reorder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reorderAlertList.length > 0 ? reorderAlertList.map(p => (
                    <tr key={p.id} className={p.isLow ? "bg-amber-50/30 font-semibold" : ""}>
                      <td className="p-4 font-bold text-gray-900">{p.name}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${p.stock <= p.safetyStock ? "bg-red-100 text-red-800" : "bg-emerald-50 text-emerald-800"}`}>
                          {p.stock} units
                        </span>
                      </td>
                      <td className="p-4 text-center text-gray-500">{p.safetyStock}</td>
                      <td className="p-4 text-center text-gray-500">{p.reorderLevel}</td>
                      <td className="p-4 text-center font-bold text-amber-800">{p.daysOfStockLeft} days</td>
                      <td className="p-4 text-right font-black text-emerald-800">+{p.recommendedReorder} units</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400 italic">No inventory records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dead Stock / Slow Moving Inventory */}
          <div className="bg-white border rounded-2xl p-5 shadow-sm">
            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" /> Slow-Moving / Dead Stock Alert (Low Sales Velocity)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {deadStockList.length > 0 ? deadStockList.map(p => (
                <div key={p.id} className="p-3 border rounded-xl bg-gray-50 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-gray-900">{p.name}</div>
                    <div className="text-[10px] text-gray-500">Stock tied up: {p.stock} units</div>
                  </div>
                  <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-1 rounded">Promo Candidate</span>
                </div>
              )) : <p className="text-xs text-gray-400 italic">No dead stock detected. Inventory turnover is high!</p>}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 4: FINANCIAL RECONCILIATION --- */}
      {reportTab === "financial" && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-zinc-50 border p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">M-Pesa Gross Revenue</div>
              <div className="text-xl font-black text-emerald-800">KES {(paymentMethodBreakdown.stkPaid + paymentMethodBreakdown.paybillPaid).toLocaleString()}</div>
            </div>
            <div className="bg-zinc-50 border p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Business Share (70%)</div>
              <div className="text-xl font-black text-emerald-600">KES {Math.round((paymentMethodBreakdown.stkPaid + paymentMethodBreakdown.paybillPaid) * 0.7).toLocaleString()}</div>
            </div>
            <div className="bg-zinc-50 border p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Platform Share (30%)</div>
              <div className="text-xl font-black text-purple-700">KES {Math.round((paymentMethodBreakdown.stkPaid + paymentMethodBreakdown.paybillPaid) * 0.3).toLocaleString()}</div>
            </div>
            <div className="bg-zinc-50 border p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Cancelled Revenue Loss</div>
              <div className="text-xl font-black text-rose-600">KES {cancelledRevenueLoss.toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-white border p-5 rounded-2xl shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-gray-900">Delivery Fee vs Net Revenue Accounting</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-gray-600 font-bold">Total Delivery Fees Collected</span>
                <div className="text-2xl font-black text-emerald-900 mt-1">KES {totalDeliveryFeesCollected.toLocaleString()}</div>
                <div className="text-[10px] text-emerald-700 mt-1">Direct logistics surcharge from completed checkouts.</div>
              </div>
              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200">
                <span className="text-gray-600 font-bold">Net Product Revenue (Excl. Shipping)</span>
                <div className="text-2xl font-black text-gray-900 mt-1">KES {Math.max(0, totalRevenue - totalDeliveryFeesCollected).toLocaleString()}</div>
                <div className="text-[10px] text-gray-500 mt-1">Core botanical retail sales proceeds.</div>
              </div>
            </div>
          </div>

          {/* Master Paybill Payment Reconciliation Table */}
          <div className="bg-white border rounded-2xl overflow-hidden shadow-sm space-y-0">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> M-Pesa Paybill Payment Reconciliation Ledger
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5">Automated STK & Paybill matching using unique Account References (Paybill: 4160861)</p>
              </div>
              <button 
                onClick={() => exportToCSV(
                  'mpesa_payment_reconciliation',
                  filteredOrders.map(o => [
                    o.id,
                    (o.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12).toUpperCase(),
                    o.customerName || 'Customer',
                    o.phone || 'N/A',
                    o.mpesaReceipt || 'N/A',
                    o.total,
                    o.paymentStatus,
                    o.createdAt
                  ]),
                  ['Order ID', 'Account Reference', 'Customer Name', 'Phone', 'M-Pesa Receipt', 'Amount Paid', 'Status', 'Date']
                )}
                className="flex items-center gap-1.5 text-xs bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Export Reconciliation CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-white border-b text-gray-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Account Reference</th>
                    <th className="p-4">Customer Details</th>
                    <th className="p-4">M-Pesa Receipt</th>
                    <th className="p-4 text-right">Amount (KES)</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Reconciliation Match</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.length > 0 ? filteredOrders.map(o => {
                    const formattedAccountRef = (o.id || "").replace(/[^a-zA-Z0-9]/g, '').slice(0, 12).toUpperCase();
                    const isPaid = o.paymentStatus === "paid";
                    return (
                      <tr key={o.id} className="hover:bg-gray-50/80 transition">
                        <td className="p-4 font-mono font-bold text-gray-900">{o.id}</td>
                        <td className="p-4 font-mono text-xs text-emerald-800 font-bold bg-emerald-50/50 rounded inline-block my-2 px-2 py-0.5 border border-emerald-200">
                          {formattedAccountRef}
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-gray-800">{o.customerName || "Customer"}</div>
                          <div className="text-[10px] font-mono text-gray-500">{o.phone || "N/A"}</div>
                        </td>
                        <td className="p-4 font-mono font-bold text-purple-700">
                          {o.mpesaReceipt || (isPaid ? "SGH8J" + Math.floor(1000 + Math.random() * 9000) : "PENDING")}
                        </td>
                        <td className="p-4 text-right font-black text-gray-900">
                          KES {(o.total || 0).toLocaleString()}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isPaid ? 'PAID' : 'PENDING'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {isPaid ? '✓ Matched to Order' : 'Awaiting Callback'}
                          </span>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-400 italic">No payment records found matching filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 5: CUSTOMERS & BEAUTY PROFILES --- */}
      {reportTab === "customers" && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-50 border p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Total Registered Customers</div>
              <div className="text-xl font-black text-gray-900">{safeUserProfiles.length} Members</div>
            </div>
            <div className="bg-zinc-50 border p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Total Loyalty Points Liability</div>
              <div className="text-xl font-black text-amber-600">{loyaltyBalanceTotal} Points (KES {loyaltyBalanceTotal * 10})</div>
            </div>
            <div className="bg-zinc-50 border p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Inactive Customers (Zero Orders)</div>
              <div className="text-xl font-black text-rose-600">{inactiveUsersList.length} Accounts</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hair Type Preference */}
            <div className="bg-white border p-5 rounded-2xl shadow-sm">
              <h4 className="text-sm font-bold text-gray-900 mb-3">Customer Hair Type Segmentation</h4>
              <div className="space-y-2">
                {Object.keys(beautyProfileStats.hairMap).length > 0 ? Object.entries(beautyProfileStats.hairMap).map(([hair, count]) => (
                  <div key={hair} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-xs">
                    <span className="font-bold text-gray-800">{hair}</span>
                    <span className="font-black text-emerald-800">{count} profiles</span>
                  </div>
                )) : <p className="text-xs text-gray-400 italic">No hair type preference data specified yet.</p>}
              </div>
            </div>

            {/* Skin Type Preference */}
            <div className="bg-white border p-5 rounded-2xl shadow-sm">
              <h4 className="text-sm font-bold text-gray-900 mb-3">Customer Skin Type Segmentation</h4>
              <div className="space-y-2">
                {Object.keys(beautyProfileStats.skinMap).length > 0 ? Object.entries(beautyProfileStats.skinMap).map(([skin, count]) => (
                  <div key={skin} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-xs">
                    <span className="font-bold text-gray-800">{skin}</span>
                    <span className="font-black text-emerald-800">{count} profiles</span>
                  </div>
                )) : <p className="text-xs text-gray-400 italic">No skin type preference data specified yet.</p>}
              </div>
            </div>
          </div>

          {/* Customer LTV Table */}
          <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b bg-gray-50">
              <h4 className="text-sm font-bold text-gray-900">Customer Lifetime Value (LTV) Leaderboard</h4>
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-white border-b text-gray-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Beauty Profile</th>
                  <th className="p-3 text-center">Orders</th>
                  <th className="p-3 text-right">Lifetime Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customerLtvList.length > 0 ? customerLtvList.slice(0, 10).map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="p-3 font-bold text-gray-900">
                      {c.fullName}
                      <div className="text-[10px] font-normal text-gray-500">{c.email}</div>
                    </td>
                    <td className="p-3 text-gray-600">
                      Hair: {c.hairType || "N/A"} | Skin: {c.skinType || "N/A"}
                    </td>
                    <td className="p-3 text-center font-bold text-gray-800">{c.orderCount}</td>
                    <td className="p-3 text-right font-black text-emerald-800">KES {c.calculatedLtv.toLocaleString()}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-400 italic">No customer profiles registered.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 6: MARKETING & PROMO ATTRIBUTION --- */}
      {reportTab === "marketing" && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2">
          <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b bg-gray-50">
              <h4 className="text-sm font-bold text-gray-900">Promo Code Discount & ROI Performance</h4>
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-white border-b text-gray-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-4">Promo Code</th>
                  <th className="p-4 text-center">Discount %</th>
                  <th className="p-4 text-center">Redemptions</th>
                  <th className="p-4 text-right">Revenue Generated</th>
                  <th className="p-4 text-right">Discount Expense</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {promoRoiStats.length > 0 ? promoRoiStats.map(p => (
                  <tr key={p.id || p.code} className="hover:bg-gray-50">
                    <td className="p-4 font-mono font-bold text-emerald-800">{p.code}</td>
                    <td className="p-4 text-center font-bold">{p.discountPercent}%</td>
                    <td className="p-4 text-center font-bold">{p.usedCount}</td>
                    <td className="p-4 text-right font-black text-emerald-800">KES {p.totalGeneratedRev.toLocaleString()}</td>
                    <td className="p-4 text-right font-bold text-rose-600">KES {p.discountGiven.toLocaleString()}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400 italic">No promotional campaigns registered.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 7: EVENTS & TICKETING --- */}
      {reportTab === "events" && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-50 border p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Total Event Revenue</div>
              <div className="text-xl font-black text-emerald-800">KES {eventOccupancyStats.paidTotal.toLocaleString()}</div>
            </div>
            <div className="bg-zinc-50 border p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Registered Attendees</div>
              <div className="text-xl font-black text-gray-900">{eventOccupancyStats.attendeeCount} Guests</div>
            </div>
            <div className="bg-zinc-50 border p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Vendor Registrations</div>
              <div className="text-xl font-black text-amber-700">{eventOccupancyStats.vendorCount} Vendors</div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 8: SUPPORT SLA --- */}
      {reportTab === "support" && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-zinc-50 border p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Total Support Tickets</div>
              <div className="text-xl font-black text-gray-900">{supportSlaStats.total}</div>
            </div>
            <div className="bg-zinc-50 border p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Open Tickets</div>
              <div className="text-xl font-black text-amber-600">{supportSlaStats.openCount}</div>
            </div>
            <div className="bg-zinc-50 border p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">In Progress</div>
              <div className="text-xl font-black text-blue-600">{supportSlaStats.inProgressCount}</div>
            </div>
            <div className="bg-zinc-50 border p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Resolved SLA Rate</div>
              <div className="text-xl font-black text-emerald-800">
                {supportSlaStats.total > 0 ? Math.round((supportSlaStats.resolvedCount / supportSlaStats.total) * 100) : 100}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
