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
    userEmail: string,
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

    // Calculate Summary
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const completedAmount = transactions
      .filter((t) => t.status === "completed")
      .reduce((sum, t) => sum + t.amount, 0);
    const pendingAmount = transactions
      .filter((t) => t.status === "pending")
      .reduce((sum, t) => sum + t.amount, 0);

    // Summary Section
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(79, 70, 229);
    doc.text("Summary", 20, yPos);
    yPos += 8;

    // Summary Box
    doc.setFillColor(245, 245, 250);
    doc.rect(20, yPos - 5, pageWidth - 40, 25, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    // Total Amount
    doc.text("Total Amount:", 25, yPos);
    doc.setFont("helvetica", "bold");
    doc.text(`Rs. ${totalAmount.toLocaleString("en-IN")}`, 70, yPos);

    // Completed Amount
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 128, 0); // Green color
    doc.text("Completed:", 25, yPos + 7);
    doc.setFont("helvetica", "bold");
    doc.text(`Rs. ${completedAmount.toLocaleString("en-IN")}`, 70, yPos + 7);

    // Pending Amount
    doc.setFont("helvetica", "normal");
    doc.setTextColor(255, 140, 0); // Orange color
    doc.text("Pending:", 25, yPos + 14);
    doc.setFont("helvetica", "bold");
    doc.text(`Rs. ${pendingAmount.toLocaleString("en-IN")}`, 70, yPos + 14);

    yPos += 30;

    // Reset text color
    doc.setTextColor(0, 0, 0);

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
      { align: "center" },
    );

    // Save PDF
    const filename = `FinTrack_${sectionType}_${person.name.replace(
      /\s+/g,
      "_",
    )}_${Date.now()}.pdf`;
    doc.save(filename);
  }

  generateOthersPDF(
    groups: { title: string; accounts: { name: string; balance: number }[] }[],
    sectionType: string,
    userName: string,
    userEmail: string,
  ): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;
    const overallTotal = groups.reduce(
      (sum, group) =>
        sum +
        group.accounts.reduce(
          (groupSum, account) => groupSum + (Number(account.balance) || 0),
          0,
        ),
      0,
    );
    const totalAccounts = groups.reduce(
      (sum, group) => sum + group.accounts.length,
      0,
    );

    // Header
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229);
    doc.text("FinTrack", pageWidth / 2, yPos, { align: "center" });

    yPos += 8;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Advanced Personal Financial Tracker", pageWidth / 2, yPos, {
      align: "center",
    });

    yPos += 8;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 10;

    // User info
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Section: ${this.formatSectionName(sectionType)}`, 20, yPos);
    if (userName) {
      doc.text(`User: ${userName}`, pageWidth - 20, yPos, { align: "right" });
    }
    yPos += 8;
    if (userEmail) {
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Email: ${userEmail}`, 20, yPos);
      yPos += 8;
    }

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(`Overall Total: Rs. ${overallTotal.toLocaleString("en-IN")}`, 20, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(`Accounts: ${totalAccounts}`, pageWidth - 20, yPos, { align: "right" });
    yPos += 10;

    // For each group, render a small table
    groups.forEach((g, idx) => {
      const groupTotal = g.accounts.reduce(
        (sum, account) => sum + (Number(account.balance) || 0),
        0,
      );
      doc.setFontSize(12);
      doc.setTextColor(79, 70, 229);
      doc.text(g.title, 20, yPos);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Total: Rs. ${groupTotal.toLocaleString("en-IN")}`,
        pageWidth - 20,
        yPos,
        { align: "right" },
      );
      yPos += 6;

      const tableBody = g.accounts.map((a, index) => [
        String(index + 1),
        a.name || "-",
        `Rs. ${Number(a.balance || 0).toLocaleString("en-IN")}`,
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["No.", "Account Name", "Amount"]],
        body: tableBody,
        theme: "grid",
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
        bodyStyles: { fontSize: 10 },
        margin: { left: 20, right: 20 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;

      // Add page if near bottom
      const pageHeight = doc.internal.pageSize.getHeight();
      if (yPos > pageHeight - 40 && idx < groups.length - 1) {
        doc.addPage();
        yPos = 20;
      }
    });

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Generated on: ${new Date().toLocaleString("en-IN")}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" },
    );

    const filename = `FinTrack_${sectionType}_Others_${Date.now()}.pdf`;
    doc.save(filename);
  }

  private formatSectionName(section: string): string {
    return section.charAt(0).toUpperCase() + section.slice(1);
  }
}
