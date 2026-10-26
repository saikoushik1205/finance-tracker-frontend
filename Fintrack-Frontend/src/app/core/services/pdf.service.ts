import { Injectable } from "@angular/core";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Person, Transaction } from "../../models/app.models";
import {
  toPaise,
  fromPaise,
  isRepayment,
  isLegacyCompletedLoan,
  calculatePersonStats,
} from "../utils/money-calculator";

@Injectable({
  providedIn: "root",
})
export class PdfService {
  /**
   * Formats money consistently using Indian number grouping with 2 decimal places.
   * e.g., Rs. 1,01,759.00
   * Avoids Unicode font glyph issues in default jsPDF fonts.
   */
  private formatINR(amount: number | null | undefined): string {
    const val = Number(amount) || 0;
    return `Rs. ${val.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  generatePersonPDF(
    person: Person,
    transactions: Transaction[],
    sectionType: string,
    userName: string,
    userEmail: string
  ): void {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 16;

    const isLending = sectionType === "lending";
    const activeTransactions = (transactions || []).filter(
      (t) => t.status !== "cancelled"
    );

    // Rule 2 & PDF Rule: Uses the EXACT same calculation function as the UI
    const stats = calculatePersonStats(activeTransactions);

    // =========================================================================
    // 1. HEADER & BRANDING
    // =========================================================================
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // FinTrack Indigo
    doc.text("FinTrack", 16, yPos);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(
      isLending ? "Lending Ledger Statement" : "Borrowing Ledger Statement",
      pageWidth - 16,
      yPos,
      { align: "right" }
    );

    yPos += 5;
    doc.setFontSize(9);
    doc.text("Advanced Personal Financial Tracker", 16, yPos);

    const generatedDateStr = new Date().toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    doc.text(`Generated: ${generatedDateStr}`, pageWidth - 16, yPos, {
      align: "right",
    });

    // Divider
    yPos += 5;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(16, yPos, pageWidth - 16, yPos);
    yPos += 7;

    // =========================================================================
    // 2. PERSON & ACCOUNT HOLDER DETAILS
    // =========================================================================
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text(person.name, 16, yPos);

    if (userName) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Account Holder: ${userName}`, pageWidth - 16, yPos, {
        align: "right",
      });
    }

    yPos += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);

    const contactParts = [];
    if (person.email) contactParts.push(`Email: ${person.email}`);
    if (person.phone) contactParts.push(`Phone: ${person.phone}`);
    const contactLine = contactParts.length > 0 ? contactParts.join("   |   ") : "No contact details on file";
    doc.text(contactLine, 16, yPos);

    if (userEmail) {
      doc.text(`Email: ${userEmail}`, pageWidth - 16, yPos, { align: "right" });
    }

    yPos += 8;

    // =========================================================================
    // 3. FINANCIAL SUMMARY BOX
    // =========================================================================
    const boxWidth = pageWidth - 32;
    const boxHeight = stats.advance && stats.advance > 0 ? 30 : 25;

    // Light neutral background with indigo border
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(16, yPos, boxWidth, boxHeight, 2, 2, "FD");

    const colWidth = boxWidth / (stats.advance && stats.advance > 0 ? 4 : 3);
    const boxTextY = yPos + 7;

    // Column 1: Total Lent / Borrowed
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(isLending ? "TOTAL LENT" : "TOTAL BORROWED", 16 + 6, boxTextY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(this.formatINR(stats.total), 16 + 6, boxTextY + 7);

    // Column 2: Total Returned / Repaid
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(isLending ? "TOTAL RECEIVED" : "TOTAL REPAID", 16 + colWidth + 4, boxTextY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(16, 185, 129); // Emerald 500
    doc.text(this.formatINR(stats.completed), 16 + colWidth + 4, boxTextY + 7);

    // Column 3: Pending Balance (Current Balance)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(isLending ? "PENDING RECEIVABLE" : "PENDING PAYABLE", 16 + colWidth * 2 + 4, boxTextY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    if (stats.pending > 0) {
      doc.setTextColor(234, 88, 12); // Orange / Amber
    } else {
      doc.setTextColor(16, 185, 129); // Green (Fully settled)
    }
    doc.text(this.formatINR(stats.pending), 16 + colWidth * 2 + 4, boxTextY + 7);

    // Column 4 (Optional): Advance if excess payment exists
    if (stats.advance && stats.advance > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text("ADVANCE HELD", 16 + colWidth * 3 + 4, boxTextY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(217, 119, 6);
      doc.text(this.formatINR(stats.advance), 16 + colWidth * 3 + 4, boxTextY + 7);
    }

    // Account Status Line at bottom of box
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    if (stats.pending === 0 && stats.total > 0) {
      doc.setTextColor(16, 185, 129);
      doc.text("● ACCOUNT STATUS: FULLY SETTLED (NO PENDING DUES)", 16 + 6, yPos + boxHeight - 4);
    } else if (stats.advance && stats.advance > 0) {
      doc.setTextColor(217, 119, 6);
      doc.text(`● ACCOUNT STATUS: OVERPAYMENT - ADVANCE OF ${this.formatINR(stats.advance)} HELD`, 16 + 6, yPos + boxHeight - 4);
    } else {
      doc.setTextColor(234, 88, 12);
      doc.text(`● ACCOUNT STATUS: ACTIVE PENDING BALANCE OF ${this.formatINR(stats.pending)}`, 16 + 6, yPos + boxHeight - 4);
    }

    yPos += boxHeight + 8;

    // =========================================================================
    // 4. CHRONOLOGICAL LEDGER TABLE
    // Columns: Date, Description, Lent, Received, Running Balance
    // =========================================================================
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Chronological Ledger Statement", 16, yPos);
    yPos += 4;

    if (activeTransactions.length > 0) {
      // Sort chronologically (oldest to newest)
      const sortedTransactions = [...activeTransactions].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      let runningPaise = 0;

      const tableBody = sortedTransactions.map((t) => {
        const amtPaise = toPaise(t.amount);
        const dateStr = new Date(t.date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        const isRepay = isRepayment(t);
        const isLegacyCompleted = isLegacyCompletedLoan(t);

        let lentPaise = 0;
        let receivedPaise = 0;
        let desc = (t.remarks || "").trim();

        if (isLending) {
          if (isRepay) {
            receivedPaise = amtPaise;
            runningPaise = Math.max(0, runningPaise - receivedPaise);
            if (!desc) {
              desc = t.metadata?.paymentMethod
                ? `Repayment via ${t.metadata.paymentMethod}`
                : "Repayment Received";
            }
          } else if (isLegacyCompleted) {
            lentPaise = amtPaise;
            receivedPaise = amtPaise;
            if (!desc) desc = "Loan (Settled)";
          } else {
            lentPaise = amtPaise;
            runningPaise += lentPaise;
            if (!desc) desc = "Loan Given";
          }
        } else {
          // Borrowing
          if (isRepay) {
            receivedPaise = amtPaise;
            runningPaise = Math.max(0, runningPaise - receivedPaise);
            if (!desc) desc = "Repayment Made";
          } else if (isLegacyCompleted) {
            lentPaise = amtPaise;
            receivedPaise = amtPaise;
            if (!desc) desc = "Borrowed (Settled)";
          } else {
            lentPaise = amtPaise;
            runningPaise += lentPaise;
            if (!desc) desc = "Loan Received";
          }
        }

        const lentDisplay =
          lentPaise > 0 ? this.formatINR(fromPaise(lentPaise)) : "-";
        const receivedDisplay =
          receivedPaise > 0 ? this.formatINR(fromPaise(receivedPaise)) : "-";
        const balanceDisplay = this.formatINR(fromPaise(runningPaise));

        return [dateStr, desc, lentDisplay, receivedDisplay, balanceDisplay];
      });

      autoTable(doc, {
        startY: yPos,
        head: [
          [
            "Date",
            "Description / Remarks",
            isLending ? "Lent (Rs.)" : "Repaid (Rs.)",
            isLending ? "Received (Rs.)" : "Borrowed (Rs.)",
            "Running Balance",
          ],
        ],
        body: tableBody,
        foot: [
          [
            "Closing Totals",
            "",
            this.formatINR(stats.total),
            this.formatINR(stats.completed),
            this.formatINR(stats.pending),
          ],
        ],
        theme: "striped",
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: "bold",
          halign: "left",
        },
        columnStyles: {
          0: { cellWidth: 26, halign: "center" },
          1: { cellWidth: "auto", halign: "left" },
          2: { cellWidth: 32, halign: "right" },
          3: { cellWidth: 32, halign: "right" },
          4: { cellWidth: 34, halign: "right" },
        },
        footStyles: {
          fillColor: [240, 243, 255],
          textColor: [79, 70, 229],
          fontStyle: "bold",
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 8.5,
          textColor: [30, 41, 59],
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        margin: { left: 16, right: 16 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;
    } else {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9.5);
      doc.setTextColor(148, 163, 184);
      doc.text("No transactions recorded for this ledger.", 16, yPos + 6);
      yPos += 14;
    }

    // =========================================================================
    // 5. FOOTER & CLOSING STATEMENT
    // =========================================================================
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);

    doc.text(
      "This is a computer-generated financial statement from FinTrack. All calculations follow integer paise accuracy.",
      pageWidth / 2,
      pageHeight - 12,
      { align: "center" }
    );
    doc.text(
      `Statement Date: ${new Date().toLocaleDateString("en-IN")}   |   Total Ledger Records: ${activeTransactions.length}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );

    // Save PDF
    const safeName = person.name.replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `FinTrack_${sectionType}_${safeName}_${Date.now()}.pdf`;
    doc.save(filename);
  }

  generateOthersPDF(
    groups: { title: string; accounts: { name: string; balance: number }[] }[],
    sectionType: string,
    userName: string,
    userEmail: string
  ): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;
    const overallTotal = groups.reduce(
      (sum, group) =>
        sum +
        group.accounts.reduce(
          (groupSum, account) => groupSum + (Number(account.balance) || 0),
          0
        ),
      0
    );
    const totalAccounts = groups.reduce(
      (sum, group) => sum + group.accounts.length,
      0
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
        0
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
        { align: "right" }
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
      { align: "center" }
    );

    const filename = `FinTrack_${sectionType}_Others_${Date.now()}.pdf`;
    doc.save(filename);
  }

  private formatSectionName(section: string): string {
    return section.charAt(0).toUpperCase() + section.slice(1);
  }
}
