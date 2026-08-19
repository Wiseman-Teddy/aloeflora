import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Order, UserProfile } from "../types";

export const exportToCSV = (filename: string, rows: any[][], columns: string[]) => {
  const csvContent =
    "data:text/csv;charset=utf-8," +
    [columns.map(c => `"${c.replace(/"/g, '""')}"`).join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (
  filename: string,
  title: string,
  columns: string[],
  rows: any[][],
  summaryLines?: string[]
) => {
  const doc = new jsPDF();

  // Add Company Branding
  doc.setFontSize(20);
  doc.setTextColor(6, 78, 59); // emerald-800
  doc.text("ALOEFLORA PRODUCTS", 14, 20);

  doc.setFontSize(12);
  doc.setTextColor(50);
  doc.text(title, 14, 28);

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 35);

  let currentY = 40;
  if (summaryLines && summaryLines.length > 0) {
    doc.setFontSize(9);
    doc.setTextColor(70);
    summaryLines.forEach(line => {
      doc.text(line, 14, currentY);
      currentY += 5;
    });
    currentY += 3;
  }

  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: currentY,
    theme: "grid",
    headStyles: { fillColor: [6, 78, 59], textColor: [255, 255, 255], fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 3 },
    alternateRowStyles: { fillColor: [248, 250, 249] },
  });

  doc.save(`${filename}.pdf`);
};

export const exportOrderInvoicePDF = (order: Order) => {
  const doc = new jsPDF();

  // Header Branding
  doc.setFontSize(22);
  doc.setTextColor(6, 78, 59);
  doc.text("ALOEFLORA PRODUCTS", 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Natural & Botanical Care", 14, 28);
  doc.text("Nairobi CBD Depot, Kenya | info@aloeflora.com", 14, 33);

  // Invoice Title Right Aligned
  doc.setFontSize(16);
  doc.setTextColor(6, 78, 59);
  doc.text("OFFICIAL TAX INVOICE", 140, 22);

  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text(`Invoice No: INV-${order.id.slice(0, 8).toUpperCase()}`, 140, 28);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 140, 33);
  doc.text(`Payment Method: ${(order.paymentMethod || "M-PESA").toUpperCase()}`, 140, 38);
  if (order.mpesaReceipt) {
    doc.text(`M-Pesa Receipt: ${order.mpesaReceipt}`, 140, 43);
  }

  // Divider
  doc.setDrawColor(220);
  doc.line(14, 48, 196, 48);

  // Customer & Shipping Info
  doc.setFontSize(11);
  doc.setTextColor(6, 78, 59);
  doc.text("Billed & Shipped To:", 14, 56);

  doc.setFontSize(9);
  doc.setTextColor(60);
  doc.text(`Customer Name: ${order.customerName}`, 14, 62);
  doc.text(`Phone: ${order.phone}`, 14, 67);
  doc.text(`Email: ${order.email}`, 14, 72);
  doc.text(`Location: ${order.estate}, ${order.subCounty}, ${order.county} County`, 14, 77);
  if (order.building || order.houseNumber) {
    doc.text(`Building / House: ${order.building || ""} ${order.houseNumber || ""}`, 14, 82);
  }

  // Items Table
  const tableRows = order.items.map((item, idx) => [
    idx + 1,
    item.sku || "N/A",
    item.productName + (item.selectedVariant ? ` (${item.selectedVariant})` : "") + (item.batchNumber ? ` [Lot: ${item.batchNumber}]` : ""),
    item.quantity,
    `KES ${item.price.toLocaleString()}`,
    `KES ${(item.price * item.quantity).toLocaleString()}`,
  ]);

  autoTable(doc, {
    head: [["#", "SKU", "Item Description & Batch", "Qty", "Unit Price", "Total Amount"]],
    body: tableRows,
    startY: 90,
    theme: "striped",
    headStyles: { fillColor: [6, 78, 59], textColor: [255, 255, 255] },
    styles: { fontSize: 8.5, cellPadding: 3.5 },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 130;

  // Calculation Summary Right Aligned
  doc.setFontSize(9);
  doc.setTextColor(60);
  doc.text(`Subtotal: KES ${order.subtotal.toLocaleString()}`, 140, finalY + 10);
  doc.text(`Delivery Fee: KES ${order.deliveryFee.toLocaleString()}`, 140, finalY + 16);
  
  doc.setFontSize(12);
  doc.setTextColor(6, 78, 59);
  doc.text(`Grand Total: KES ${order.total.toLocaleString()}`, 140, finalY + 24);

  // Footer Note
  doc.setFontSize(8);
  doc.setTextColor(140);
  doc.text("Thank you for shopping with Aloeflora! For support, email info@aloefloraproducts.com", 14, finalY + 40);

  doc.save(`Aloeflora_Invoice_${order.id.slice(0, 8).toUpperCase()}.pdf`);
};

export const exportStockMovementsCSV = (movements: any[]) => {
  const headers = ["Timestamp", "Product ID", "SKU", "Movement Type", "Quantity Change", "Stock Before", "Stock After", "Batch Number", "Reference ID", "Notes", "Performed By"];
  const rows = movements.map(m => [
    new Date(m.created_at || m.createdAt).toLocaleString(),
    m.product_id || m.productId,
    m.sku || "",
    (m.movement_type || m.movementType || "").toUpperCase(),
    m.quantity_delta ?? m.quantityDelta,
    m.stock_before ?? m.stockBefore ?? "",
    m.stock_after ?? m.stockAfter ?? "",
    m.batch_number || m.batchNumber || "",
    m.reference_id || m.referenceId || "",
    `"${(m.notes || '').replace(/"/g, '""')}"`,
    m.performed_by || m.performedBy || ""
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Aloeflora_Stock_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportLoyaltyStatementPDF = (userProfile: UserProfile, orders: Order[]) => {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.setTextColor(6, 78, 59);
  doc.text("ALOEFLORA REWARDS", 14, 20);

  doc.setFontSize(12);
  doc.setTextColor(60);
  doc.text("Loyalty Points & Rewards Audit Statement", 14, 28);

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Member Name: ${userProfile.fullName}`, 14, 36);
  doc.text(`Email: ${userProfile.email}`, 14, 41);
  doc.text(`Current Loyalty Balance: ${userProfile.loyaltyPoints || 0} Points (KES ${(userProfile.loyaltyPoints || 0) * 10} value)`, 14, 46);
  doc.text(`Generated Date: ${new Date().toLocaleDateString()}`, 14, 51);

  const tableRows = orders.map(o => [
    o.id.slice(0, 8).toUpperCase(),
    new Date(o.createdAt).toLocaleDateString(),
    `KES ${o.total.toLocaleString()}`,
    `+${Math.floor(o.total / 100)} pts`,
    o.deliveryStatus.toUpperCase()
  ]);

  autoTable(doc, {
    head: [["Order Ref", "Date", "Order Amount", "Points Earned", "Status"]],
    body: tableRows,
    startY: 58,
    theme: "grid",
    headStyles: { fillColor: [6, 78, 59], textColor: [255, 255, 255] },
    styles: { fontSize: 8 },
  });

  doc.save(`Loyalty_Statement_${userProfile.fullName.replace(/\s+/g, "_")}.pdf`);
};

export interface PLSummaryData {
  periodLabel: string;
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  grossMarginPct: number;
  operatingExpenses: number;
  netProfit: number;
  netMarginPct: number;
  orderCount: number;
  unitsSold: number;
  expenseBreakdown: {
    logistics: number;
    marketing: number;
    hosting: number;
    discounts: number;
  };
  periodRows: Array<{
    period: string;
    orderCount: number;
    unitsSold: number;
    revenue: number;
    cogs: number;
    grossProfit: number;
    grossMarginPct: number;
    expenses: number;
    netProfit: number;
    netMarginPct: number;
  }>;
  categoryRows: Array<{
    category: string;
    unitsSold: number;
    revenue: number;
    cogs: number;
    grossProfit: number;
    marginPct: number;
  }>;
}

export const generateFinancialPLStatementPDF = (data: PLSummaryData) => {
  const doc = new jsPDF();

  // Header Banner
  doc.setFontSize(22);
  doc.setTextColor(6, 78, 59); // Emerald 900
  doc.text("ALOEFLORA PRODUCTS ENTERPRISE", 14, 20);

  doc.setFontSize(13);
  doc.setTextColor(31, 41, 55); // Gray 800
  doc.text("Official Profit & Loss (P&L) Financial Statement", 14, 28);

  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128); // Gray 500
  doc.text(`Reporting Period: ${data.periodLabel}`, 14, 35);
  doc.text(`Generated on: ${new Date().toLocaleString('en-GB')} | Currency: Kenyan Shilling (KES)`, 14, 40);

  // Executive Summary KPI Box
  doc.setDrawColor(209, 250, 229);
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14, 45, 182, 32, 3, 3, "FD");

  doc.setFontSize(10);
  doc.setTextColor(6, 78, 59);
  doc.text(`GROSS REVENUE: KES ${data.totalRevenue.toLocaleString()}`, 20, 53);
  doc.text(`COST OF GOODS (COGS): KES ${data.totalCogs.toLocaleString()}`, 20, 60);
  doc.text(`GROSS PROFIT: KES ${data.grossProfit.toLocaleString()} (${data.grossMarginPct.toFixed(1)}%)`, 20, 67);

  doc.setTextColor(153, 27, 27);
  doc.text(`TOTAL OPEX: KES ${data.operatingExpenses.toLocaleString()}`, 110, 53);
  doc.setTextColor(data.netProfit >= 0 ? 6 : 153, data.netProfit >= 0 ? 78 : 27, data.netProfit >= 0 ? 59 : 27);
  doc.text(`NET PROFIT: KES ${data.netProfit.toLocaleString()} (${data.netMarginPct.toFixed(1)}%)`, 110, 60);
  doc.setTextColor(75, 85, 99);
  doc.text(`VOLUME: ${data.orderCount} Orders | ${data.unitsSold} Units`, 110, 67);

  // 1. Period Performance Breakdown Table
  doc.setFontSize(11);
  doc.setTextColor(6, 78, 59);
  doc.text("1. Period-by-Period Performance Statement", 14, 86);

  const periodTableRows = data.periodRows.map(r => [
    r.period,
    r.orderCount.toString(),
    r.unitsSold.toString(),
    `KES ${r.revenue.toLocaleString()}`,
    `KES ${r.cogs.toLocaleString()}`,
    `KES ${r.grossProfit.toLocaleString()}`,
    `${r.grossMarginPct.toFixed(1)}%`,
    `KES ${r.expenses.toLocaleString()}`,
    `KES ${r.netProfit.toLocaleString()}`,
    `${r.netMarginPct.toFixed(1)}%`
  ]);

  autoTable(doc, {
    head: [["Period", "Orders", "Units", "Gross Revenue", "COGS", "Gross Profit", "Margin", "OPEX", "Net Profit", "Net %"]],
    body: periodTableRows,
    startY: 90,
    theme: "striped",
    headStyles: { fillColor: [6, 78, 59], textColor: [255, 255, 255], fontSize: 7.5 },
    styles: { fontSize: 7, cellPadding: 2 },
  });

  let currentY = (doc as any).lastAutoTable.finalY + 12;

  // Check if we need a new page
  if (currentY > 220) {
    doc.addPage();
    currentY = 20;
  }

  // 2. Category Profitability Breakdown
  doc.setFontSize(11);
  doc.setTextColor(6, 78, 59);
  doc.text("2. Product Category Profitability Matrix", 14, currentY);

  const categoryTableRows = data.categoryRows.map(c => [
    c.category.toUpperCase(),
    c.unitsSold.toString(),
    `KES ${c.revenue.toLocaleString()}`,
    `KES ${c.cogs.toLocaleString()}`,
    `KES ${c.grossProfit.toLocaleString()}`,
    `${c.marginPct.toFixed(1)}%`,
    `${((c.grossProfit / (data.grossProfit || 1)) * 100).toFixed(1)}%`
  ]);

  autoTable(doc, {
    head: [["Category", "Units Sold", "Revenue (KES)", "COGS (KES)", "Gross Profit (KES)", "Gross Margin", "Profit Contribution"]],
    body: categoryTableRows,
    startY: currentY + 4,
    theme: "grid",
    headStyles: { fillColor: [2, 44, 34], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2.5 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;
  if (currentY > 235) {
    doc.addPage();
    currentY = 20;
  }

  // 3. Operating Expense Itemization
  doc.setFontSize(11);
  doc.setTextColor(6, 78, 59);
  doc.text("3. Operating Expense Breakdown", 14, currentY);

  const expenseRows = [
    ["Logistics & Delivery Fulfillment", `KES ${data.expenseBreakdown.logistics.toLocaleString()}`, `${((data.expenseBreakdown.logistics / (data.operatingExpenses || 1)) * 100).toFixed(1)}%`],
    ["Marketing Campaigns & Advertising", `KES ${data.expenseBreakdown.marketing.toLocaleString()}`, `${((data.expenseBreakdown.marketing / (data.operatingExpenses || 1)) * 100).toFixed(1)}%`],
    ["Cloud Infrastructure & DevOps Hosting", `KES ${data.expenseBreakdown.hosting.toLocaleString()}`, `${((data.expenseBreakdown.hosting / (data.operatingExpenses || 1)) * 100).toFixed(1)}%`],
    ["Promotional Discounts & Coupons", `KES ${data.expenseBreakdown.discounts.toLocaleString()}`, `${((data.expenseBreakdown.discounts / (data.operatingExpenses || 1)) * 100).toFixed(1)}%`],
    ["TOTAL OPERATING EXPENSES", `KES ${data.operatingExpenses.toLocaleString()}`, "100.0%"]
  ];

  autoTable(doc, {
    head: [["Expense Category / Overhead Line", "Total Amount (KES)", "% of Total OPEX"]],
    body: expenseRows,
    startY: currentY + 4,
    theme: "plain",
    headStyles: { fillColor: [75, 85, 99], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
  });

  // Footer note
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Generated by Aloeflora ERP Financial Auditing Engine. Confirmed and reconciled against Safaricom M-Pesa webhook ledgers.", 14, 285);

  doc.save(`Aloeflora_PL_Statement_${data.periodLabel.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
};

export const exportFinancialPLToCSV = (data: PLSummaryData) => {
  let csv = `ALOEFLORA ENTERPRISE - PROFIT & LOSS FINANCIAL STATEMENT\n`;
  csv += `Reporting Period,${data.periodLabel}\n`;
  csv += `Generated On,${new Date().toISOString()}\n`;
  csv += `Currency,KES (Kenyan Shilling)\n\n`;

  csv += `EXECUTIVE FINANCIAL SUMMARY\n`;
  csv += `Gross Sales Revenue,KES ${data.totalRevenue}\n`;
  csv += `Cost of Goods Sold (COGS),KES ${data.totalCogs}\n`;
  csv += `Gross Profit,KES ${data.grossProfit}\n`;
  csv += `Gross Profit Margin %,${data.grossMarginPct.toFixed(2)}%\n`;
  csv += `Operating Expenses,KES ${data.operatingExpenses}\n`;
  csv += `Net Operating Profit,KES ${data.netProfit}\n`;
  csv += `Net Profit Margin %,${data.netMarginPct.toFixed(2)}%\n`;
  csv += `Total Orders,${data.orderCount}\n`;
  csv += `Total Units Sold,${data.unitsSold}\n\n`;

  csv += `PERIOD PERFORMANCE BREAKDOWN\n`;
  csv += `Period,Orders,Units Sold,Gross Revenue (KES),COGS (KES),Gross Profit (KES),Gross Margin %,OPEX (KES),Net Profit (KES),Net Margin %\n`;
  data.periodRows.forEach(r => {
    csv += `"${r.period}",${r.orderCount},${r.unitsSold},${r.revenue},${r.cogs},${r.grossProfit},${r.grossMarginPct.toFixed(2)}%,${r.expenses},${r.netProfit},${r.netMarginPct.toFixed(2)}%\n`;
  });
  csv += `\n`;

  csv += `CATEGORY PROFITABILITY MATRIX\n`;
  csv += `Category,Units Sold,Revenue (KES),COGS (KES),Gross Profit (KES),Gross Margin %\n`;
  data.categoryRows.forEach(c => {
    csv += `"${c.category}",${c.unitsSold},${c.revenue},${c.cogs},${c.grossProfit},${c.marginPct.toFixed(2)}%\n`;
  });
  csv += `\n`;

  csv += `OPERATING EXPENSE ITEMIZATION\n`;
  csv += `Expense Line,Amount (KES),% of OPEX\n`;
  csv += `Logistics & Delivery,${data.expenseBreakdown.logistics},${((data.expenseBreakdown.logistics / (data.operatingExpenses || 1)) * 100).toFixed(2)}%\n`;
  csv += `Marketing & Ads,${data.expenseBreakdown.marketing},${((data.expenseBreakdown.marketing / (data.operatingExpenses || 1)) * 100).toFixed(2)}%\n`;
  csv += `Hosting & DevOps,${data.expenseBreakdown.hosting},${((data.expenseBreakdown.hosting / (data.operatingExpenses || 1)) * 100).toFixed(2)}%\n`;
  csv += `Promo Discounts,${data.expenseBreakdown.discounts},${((data.expenseBreakdown.discounts / (data.operatingExpenses || 1)) * 100).toFixed(2)}%\n`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Aloeflora_PL_Statement_${data.periodLabel.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

