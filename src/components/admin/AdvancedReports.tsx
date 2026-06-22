import React, { useState, useMemo } from "react";
import { ShoppingBag, Layers, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Search } from "lucide-react";
import { Order, Product } from "../../types";

interface AdvancedReportsProps {
  orders: Order[];
  products: Product[];
  generateReportsPDF: (type: "sales" | "orders") => void;
  generateReportsCSV: (type: "sales" | "orders") => void;
}

export default function AdvancedReports({
  orders,
  products,
  generateReportsPDF,
  generateReportsCSV,
}: AdvancedReportsProps) {
  const [reportTab, setReportTab] = useState<"sales" | "orders">("sales");
  const [dateRange, setDateRange] = useState<"all" | "today" | "week" | "month">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filters
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const isMatchSearch = o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            o.customerName.toLowerCase().includes(searchQuery.toLowerCase());
      if (!isMatchSearch) return false;

      const orderDate = new Date(o.createdAt);
      const now = new Date();
      if (dateRange === "today") {
        return orderDate.toDateString() === now.toDateString();
      }
      if (dateRange === "week") {
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        return orderDate >= weekAgo;
      }
      if (dateRange === "month") {
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        return orderDate >= monthAgo;
      }
      return true;
    });
  }, [orders, dateRange, searchQuery]);

  // Derived metrics for Sales
  const totalProductsSold = filteredOrders.reduce((sum, o) => 
    sum + (o.paymentStatus === "paid" ? o.items.reduce((acc, i) => acc + i.quantity, 0) : 0), 0);
  
  const totalRevenue = filteredOrders.reduce((sum, o) => 
    sum + (o.paymentStatus === "paid" ? o.total : 0), 0);

  // Top Selling Products
  const productSalesMap = useMemo(() => {
    const map: Record<string, { name: string, qty: number, rev: number }> = {};
    filteredOrders.filter(o => o.paymentStatus === "paid").forEach(o => {
      o.items.forEach(i => {
        if (!map[i.productId]) map[i.productId] = { name: i.productName, qty: 0, rev: 0 };
        map[i.productId].qty += i.quantity;
        map[i.productId].rev += i.price * i.quantity;
      });
    });
    return Object.values(map).sort((a, b) => b.qty - a.qty);
  }, [filteredOrders]);

  const topSelling = productSalesMap.slice(0, 5);
  const leastSelling = [...productSalesMap].reverse().slice(0, 5);

  // Order Metrics
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders > 0 ? (filteredOrders.reduce((sum, o) => sum + o.total, 0) / totalOrders).toFixed(2) : "0.00";
  const statusBreakdown = useMemo(() => {
    const breakdown = { pending: 0, dispatched: 0, delivered: 0, cancelled: 0 };
    filteredOrders.forEach(o => {
      if (breakdown[o.deliveryStatus] !== undefined) breakdown[o.deliveryStatus]++;
    });
    return breakdown;
  }, [filteredOrders]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-left">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-950">Advanced Reporting</h3>
          <p className="text-xs text-gray-500 mt-1">Analytics and data intelligence for business operations.</p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setReportTab("sales")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${reportTab === "sales" ? "bg-white shadow text-emerald-800" : "text-gray-500 hover:text-gray-800"}`}
          >
            Product Sales
          </button>
          <button 
            onClick={() => setReportTab("orders")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${reportTab === "orders" ? "bg-white shadow text-emerald-800" : "text-gray-500 hover:text-gray-800"}`}
          >
            Customer Orders
          </button>
        </div>
      </div>

      {/* Global Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input 
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 bg-zinc-50 border rounded-xl text-xs focus:outline-none focus:border-emerald-800"
          />
        </div>
        <select 
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as any)}
          className="bg-zinc-50 border rounded-xl text-xs px-4 py-2 focus:outline-none focus:border-emerald-800"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
        </select>
        <div className="flex-1"></div>
        <div className="flex gap-2">
          <button onClick={() => generateReportsPDF(reportTab)} className="bg-emerald-800 text-white font-bold text-xs py-2 px-4 rounded-xl hover:bg-emerald-700 transition">Export PDF</button>
          <button onClick={() => generateReportsCSV(reportTab)} className="bg-gray-200 text-gray-800 font-bold text-xs py-2 px-4 rounded-xl hover:bg-gray-300 transition">Export CSV</button>
        </div>
      </div>

      {reportTab === "sales" ? (
        <div className="space-y-6 animate-in slide-in-from-bottom-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-50 border p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Products Sold</div>
              <div className="text-xl font-black text-gray-900">{totalProductsSold} Units</div>
            </div>
            <div className="bg-zinc-50 border p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Total Revenue</div>
              <div className="text-xl font-black text-emerald-800">KES {totalRevenue.toLocaleString()}</div>
            </div>
            <div className="bg-zinc-50 border p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Avg Price per Item</div>
              <div className="text-xl font-black text-gray-900">KES {totalProductsSold > 0 ? (totalRevenue / totalProductsSold).toFixed(0) : 0}</div>
            </div>
            <div className="bg-zinc-50 border p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Total Product Catalog</div>
              <div className="text-xl font-black text-gray-900">{products.length} Items</div>
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
                <ArrowDownRight className="w-4 h-4 text-red-500" /> Least Selling Products
              </h4>
              <div className="space-y-3">
                {leastSelling.length > 0 ? leastSelling.map((p, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-xs font-bold text-gray-800 truncate pr-4">{p.name}</span>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-gray-600">{p.qty} sold</div>
                      <div className="text-[10px] text-gray-500">KES {p.rev.toLocaleString()}</div>
                    </div>
                  </div>
                )) : <p className="text-xs text-gray-400 italic">No sales data found for this period.</p>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-bottom-2">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-zinc-50 border p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Total Orders</div>
              <div className="text-xl font-black text-gray-900">{totalOrders}</div>
            </div>
            <div className="bg-zinc-50 border p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Avg Order Value</div>
              <div className="text-xl font-black text-emerald-800">KES {avgOrderValue}</div>
            </div>
            <div className="bg-zinc-50 border p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Completed / Delivered</div>
              <div className="text-xl font-black text-gray-900">{statusBreakdown.delivered}</div>
            </div>
            <div className="bg-zinc-50 border p-5 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Pending / Processing</div>
              <div className="text-xl font-black text-amber-600">{statusBreakdown.pending + statusBreakdown.dispatched}</div>
            </div>
          </div>

          <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b bg-gray-50">
              <h4 className="text-sm font-bold text-gray-900">Order History</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-white border-b text-gray-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-4">Order ID / Date</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Items</th>
                    <th className="p-4 text-right">Total (KES)</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.length > 0 ? filteredOrders.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50 transition">
                      <td className="p-4">
                        <div className="font-mono text-emerald-800 font-bold">{o.id}</div>
                        <div className="text-gray-400 text-[10px]">{new Date(o.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="p-4 font-semibold text-gray-800">
                        {o.customerName}
                        <div className="text-[10px] font-normal text-gray-500">{o.phone}</div>
                      </td>
                      <td className="p-4 text-gray-600">
                        {o.items.length} items
                      </td>
                      <td className="p-4 text-right font-bold text-gray-900">
                        {o.total.toLocaleString()}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          o.deliveryStatus === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                          o.deliveryStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {o.deliveryStatus.toUpperCase()}
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
    </div>
  );
}
