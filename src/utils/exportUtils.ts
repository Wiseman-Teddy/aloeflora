import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportToCSV = (filename: string, rows: any[][], columns: string[]) => {
  const csvContent =
    "data:text/csv;charset=utf-8," +
    [columns.join(","), ...rows.map(e => e.join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (filename: string, title: string, columns: string[], rows: any[][]) => {
  const doc = new jsPDF();

  // Add Company Branding
  doc.setFontSize(20);
  doc.setTextColor(6, 78, 59); // emerald-800
  doc.text("ALOEFLORA PRODUCTS", 14, 22);
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(title, 14, 32);
  
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 40);

  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 45,
    theme: "grid",
    headStyles: { fillColor: [6, 78, 59] }, // emerald-800
    styles: { fontSize: 8 },
  });

  doc.save(`${filename}.pdf`);
};
