import { Injectable } from "@angular/core";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Person, Transaction } from "../../models/app.models";

@Injectable({
  providedIn: "root",
})
export class PdfService {
  generatePersonPDF(
    person: Person,
    transactions: Transaction[],
    sectionType: string,
    userName: string,
    userEmail: string
  ): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Header
    doc.setFontSize(24);
    doc.setTextColor(79, 70, 229); // Indigo color
    doc.text("FinTrack", pageWidth / 2, yPos, { align: "center" });

    yPos += 10;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Advanced Personal Financial Tracker", pageWidth / 2, yPos, {
      align: "center",
    });

    // Divider
    yPos += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, pageWidth - 20, yPos);

    yPos += 10;

    // Person Details
    doc.setFontSize(16);
    doc.setTextColor(79, 70, 229);
    doc.text(`${person.name}`, 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    if (person.email) {
      doc.text(`Email: ${person.email}`, 20, yPos);
      yPos += 6;
    }
    if (person.phone) {
      doc.text(`Phone: ${person.phone}`, 20, yPos);
      yPos += 6;
    }
    yPos += 8;

    // Transactions Table
    if (transactions.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Transaction History", 20, yPos);
      yPos += 8;

      const tableData = transactions.map((t) => [
        new Date(t.date).toLocaleDateString("en-IN"),
        `Rs. ${t.amount.toLocaleString("en-IN")}`,
        t.status.charAt(0).toUpperCase() + t.status.slice(1),
        t.remarks || "-",
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["Date", "Amount", "Status", "Remarks"]],
        body: tableData,
        theme: "striped",
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: "bold",
        },
        bodyStyles: {
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 250],
        },
        margin: { left: 20, right: 20 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text("No transactions found", 20, yPos);
      yPos += 10;
    }

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Generated on: ${new Date().toLocaleString("en-IN")}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );

    // Save PDF
    const filename = `FinTrack_${sectionType}_${person.name.replace(
      /\s+/g,
      "_"
    )}_${Date.now()}.pdf`;
    doc.save(filename);
  }

  private formatSectionName(section: string): string {
    return section.charAt(0).toUpperCase() + section.slice(1);
  }
}
