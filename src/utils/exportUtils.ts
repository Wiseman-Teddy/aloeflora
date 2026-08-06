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
    item.productName + (item.selectedVariant ? ` (${item.selectedVariant})` : ""),
    item.quantity,
    `KES ${item.price.toLocaleString()}`,
    `KES ${(item.price * item.quantity).toLocaleString()}`,
  ]);

  autoTable(doc, {
    head: [["#", "Item Description", "Qty", "Unit Price", "Total Amount"]],
    body: tableRows,
    startY: 90,
    theme: "striped",
    headStyles: { fillColor: [6, 78, 59], textColor: [255, 255, 255] },
    styles: { fontSize: 9, cellPadding: 4 },
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
  doc.text("Thank you for shopping with Aloeflora! For support, email support@aloeflora.com", 14, finalY + 40);

  doc.save(`Aloeflora_Invoice_${order.id.slice(0, 8).toUpperCase()}.pdf`);
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

