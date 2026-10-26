import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { NavbarComponent } from "../../shared/components/navbar/navbar.component";
import { ApiService } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";
import { PdfService } from "../../core/services/pdf.service";
import { Person, Transaction, TransactionStatus } from "../../models/app.models";
import {
  formatCurrency as formatMoney,
  reconcilePersonStats,
  aggregatePersons,
  calculatePersonStats,
} from "../../core/utils/money-calculator";

@Component({
  selector: "app-lending",
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: "./lending.component.html",
  styleUrl: "./lending.component.css",
})
export class LendingComponent implements OnInit {
  persons: Person[] = [];
  selectedPerson: Person | null = null;
  transactions: Transaction[] = [];
  loading = true;
  showAddPersonModal = false;
  showAddTransactionModal = false;
  showEditTransactionModal = false;
  showEditPersonModal = false;
  showPersonDetailsModal = false;
  isEditMode = false;
  editingTransactionId: string | null = null;
  editingPersonId: string | null = null;

  // Settlement State
  showSettleModal = false;
  settleTargetPerson: Person | null = null;
  settling = false;
  settleForm = {
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "UPI / Online",
    remarks: "",
    isFull: true,
  };

  // Overpayment / Advance Confirmation State
  showOverpaymentModal = false;
  overpaymentDetails: { amount: number; pending: number; excess: number } | null = null;

  // Form models
  personForm = {
    name: "",
    email: "",
    phone: "",
  };

  transactionForm = {
    date: new Date().toISOString().split("T")[0],
    amount: 0,
    remarks: "",
    status: "pending" as TransactionStatus,
  };

  userName = "";
  userEmail = "";

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private pdfService: PdfService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.userName = user.displayName || user.email || "User";
        this.userEmail = user.email;
      }
    });
    this.loadPersons();
  }

  loadPersons(): void {
    this.loading = true;
    this.apiService.getPersonsBySection("lending").subscribe({
      next: (response: any) => {
        if (response.success) {
          this.persons = (response.persons || []).map((p: Person) => ({
            ...p,
            stats: reconcilePersonStats(p.stats),
          }));
        }
        this.loading = false;
      },
      error: (error) => {
        console.error("Error loading persons:", error);
        this.loading = false;
      },
    });
  }

  openAddPersonModal(): void {
    this.personForm = { name: "", email: "", phone: "" };
    this.showAddPersonModal = true;
  }

  closeAddPersonModal(): void {
    this.showAddPersonModal = false;
    this.personForm = { name: "", email: "", phone: "" };
  }

  openEditPersonModal(person: Person, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.editingPersonId = person._id;
    this.personForm = {
      name: person.name,
      email: person.email || "",
      phone: person.phone || "",
    };
    this.showEditPersonModal = true;
  }

  closeEditPersonModal(): void {
    this.showEditPersonModal = false;
    this.editingPersonId = null;
    this.personForm = { name: "", email: "", phone: "" };
  }

  updatePerson(): void {
    if (!this.editingPersonId || !this.personForm.name.trim()) {
      alert("Please enter a person name");
      return;
    }

    const payload = {
      name: this.personForm.name.trim(),
      email: this.personForm.email.trim(),
      phone: this.personForm.phone.trim(),
    };

    this.apiService.updatePerson(this.editingPersonId, payload).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.loadPersons();
          this.closeEditPersonModal();
          if (this.selectedPerson && this.selectedPerson._id === this.editingPersonId) {
            this.selectedPerson.name = payload.name;
            this.selectedPerson.email = payload.email;
            this.selectedPerson.phone = payload.phone;
          }
        }
      },
      error: (error) => {
        const errorMessage = error.error?.errors
          ? error.error.errors.map((e: any) => e.msg).join(", ")
          : error.error?.message || "Failed to update person";
        alert(errorMessage);
      },
    });
  }

  addPerson(): void {
    if (!this.personForm.name.trim()) {
      alert("Please enter a person name");
      return;
    }

    const newPerson = {
      name: this.personForm.name.trim(),
      email: this.personForm.email.trim(),
      phone: this.personForm.phone.trim(),
      sectionType: "lending" as const,
    };

    this.apiService.createPerson(newPerson).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.loadPersons();
          this.closeAddPersonModal();
        }
      },
      error: (error) => {
        const errorMessage = error.error?.errors
          ? error.error.errors.map((e: any) => e.msg).join(", ")
          : error.error?.message || "Failed to add person";
        alert(errorMessage);
      },
    });
  }

  viewPersonDetails(person: Person): void {
    this.selectedPerson = person;
    this.loadPersonTransactions(person._id);
    this.showPersonDetailsModal = true;
  }

  closePersonDetailsModal(): void {
    this.showPersonDetailsModal = false;
    this.selectedPerson = null;
    this.transactions = [];
  }

  loadPersonTransactions(personId: string): void {
    this.apiService.getTransactionsByPerson(personId).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.transactions = response.transactions || [];
          if (this.selectedPerson) {
            this.selectedPerson.stats = calculatePersonStats(this.transactions);
          }
        }
      },
      error: (error) => {
        console.error("Error loading transactions:", error);
      },
    });
  }

  openAddTransactionModal(person: Person): void {
    this.selectedPerson = person;
    this.transactionForm = {
      date: new Date().toISOString().split("T")[0],
      amount: 0,
      remarks: "",
      status: "pending",
    };
    this.showAddTransactionModal = true;
  }

  closeAddTransactionModal(): void {
    this.showAddTransactionModal = false;
    this.selectedPerson = null;
    this.transactionForm = {
      date: new Date().toISOString().split("T")[0],
      amount: 0,
      remarks: "",
      status: "pending",
    };
  }

  addTransaction(): void {
    if (!this.selectedPerson || this.transactionForm.amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const transactionData = {
      personId: this.selectedPerson._id,
      date: new Date(this.transactionForm.date),
      amount: this.transactionForm.amount,
      remarks: this.transactionForm.remarks,
      status: "pending" as TransactionStatus,
      type: "loan",
    };

    this.apiService.createTransaction(transactionData).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.loadPersons();
          this.closeAddTransactionModal();
          if (this.showPersonDetailsModal && this.selectedPerson) {
            this.loadPersonTransactions(this.selectedPerson._id);
          }
        }
      },
      error: (error) => {
        alert(error.error?.message || "Failed to add transaction");
      },
    });
  }

  editTransaction(transaction: Transaction): void {
    this.isEditMode = true;
    this.editingTransactionId = transaction._id;
    this.transactionForm = {
      date: new Date(transaction.date).toISOString().split("T")[0],
      amount: transaction.amount,
      remarks: transaction.remarks || "",
      status: transaction.status,
    };
    this.showEditTransactionModal = true;
  }

  closeEditTransactionModal(): void {
    this.showEditTransactionModal = false;
    this.isEditMode = false;
    this.editingTransactionId = null;
  }

  updateTransaction(): void {
    if (!this.editingTransactionId || this.transactionForm.amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    // Status is NOT manually overridden — loan status is derived from repayments.
    const transactionData = {
      date: new Date(this.transactionForm.date),
      amount: this.transactionForm.amount,
      remarks: this.transactionForm.remarks,
    };

    this.apiService
      .updateTransaction(this.editingTransactionId, transactionData)
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.loadPersons();
            this.closeEditTransactionModal();
            if (this.showPersonDetailsModal && this.selectedPerson) {
              this.loadPersonTransactions(this.selectedPerson._id);
            }
          }
        },
        error: (error) => {
          alert(error.error?.message || "Failed to update transaction");
        },
      });
  }

  deleteTransaction(transactionId: string): void {
    if (!confirm("Are you sure you want to delete this transaction?")) {
      return;
    }

    this.apiService.deleteTransaction(transactionId).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.loadPersons();
          if (this.selectedPerson) {
            this.loadPersonTransactions(this.selectedPerson._id);
          }
        }
      },
      error: (error) => {
        alert("Failed to delete transaction");
      },
    });
  }

  deletePerson(personId: string): void {
    if (
      !confirm(
        "Are you sure you want to delete this person? This action cannot be undone."
      )
    ) {
      return;
    }

    this.apiService.deletePerson(personId).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.loadPersons();
          this.closePersonDetailsModal();
        }
      },
      error: (error) => {
        alert("Failed to delete person");
      },
    });
  }

  // =========================================================================
  // Settlement Handlers (Non-destructive, creates Repayment records only)
  // =========================================================================
  openSettleModal(person: Person): void {
    this.settleTargetPerson = person;
    const pending = person.stats?.pending || 0;
    this.settleForm = {
      amount: pending,
      date: new Date().toISOString().split("T")[0],
      paymentMethod: "UPI / Online",
      remarks: "",
      isFull: true,
    };
    this.showOverpaymentModal = false;
    this.overpaymentDetails = null;
    this.showSettleModal = true;
  }

  closeSettleModal(): void {
    this.showSettleModal = false;
    this.settleTargetPerson = null;
    this.showOverpaymentModal = false;
    this.overpaymentDetails = null;
    this.settling = false;
  }

  setFullSettlement(): void {
    if (!this.settleTargetPerson) return;
    this.settleForm.isFull = true;
    this.settleForm.amount = this.settleTargetPerson.stats?.pending || 0;
  }

  setCustomSettlement(): void {
    this.settleForm.isFull = false;
  }

  setPartialSettlement(): void {
    this.setCustomSettlement();
  }

  mathMax(a: number, b: number): number {
    return Math.max(a, b);
  }

  confirmSettlement(): void {
    if (!this.settleTargetPerson) return;
    const pending = this.settleTargetPerson.stats?.pending || 0;
    const amountToSettle = Number(this.settleForm.amount);

    if (amountToSettle <= 0) {
      alert("Please enter a valid settlement amount greater than 0");
      return;
    }

    // Check for overpayment / advance
    if (amountToSettle > pending) {
      const excess = Number((amountToSettle - pending).toFixed(2));
      this.overpaymentDetails = {
        amount: amountToSettle,
        pending,
        excess,
      };
      this.showOverpaymentModal = true;
      return;
    }

    // Normal settlement
    this.executeSettlement(amountToSettle, false, 0);
  }

  confirmOverpaymentAndExecute(): void {
    if (!this.overpaymentDetails) return;
    const { amount, excess } = this.overpaymentDetails;
    this.showOverpaymentModal = false;
    this.executeSettlement(amount, true, excess);
  }

  cancelOverpayment(): void {
    this.showOverpaymentModal = false;
    this.overpaymentDetails = null;
  }

  private executeSettlement(
    amountToSettle: number,
    isAdvance: boolean,
    excessAmount: number
  ): void {
    if (!this.settleTargetPerson) return;
    this.settling = true;
    const personId = this.settleTargetPerson._id;

    const defaultNote = `Settlement received: ${this.formatCurrency(amountToSettle)} via ${this.settleForm.paymentMethod}${isAdvance ? ` (Includes ${this.formatCurrency(excessAmount)} advance)` : ""}`;
    const finalRemarks = this.settleForm.remarks.trim()
      ? `${defaultNote} - ${this.settleForm.remarks.trim()}`
      : defaultNote;

    const repaymentPayload = {
      personId,
      date: new Date(this.settleForm.date),
      amount: amountToSettle,
      type: "repayment",
      status: "completed" as TransactionStatus,
      remarks: finalRemarks,
      metadata: {
        paymentMethod: this.settleForm.paymentMethod,
        note: this.settleForm.remarks.trim(),
        ...(isAdvance ? { advanceAmount: excessAmount } : {}),
      },
    };

    // Rule 1: Non-destructive Settle Up.
    // Creates a separate Repayment record, NEVER edits, splits or mutates loans.
    this.apiService.createTransaction(repaymentPayload).subscribe({
      next: (response: any) => {
        this.settling = false;
        this.closeSettleModal();
        this.loadPersons();
        if (this.showPersonDetailsModal && this.selectedPerson?._id === personId) {
          this.loadPersonTransactions(personId);
        }
      },
      error: (error) => {
        this.settling = false;
        console.error("Settlement error:", error);
        alert(error.error?.message || "Failed to process settlement");
      },
    });
  }

  generatePDF(person: Person): void {
    this.apiService.getTransactionsByPerson(person._id).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.pdfService.generatePersonPDF(
            person,
            response.transactions || [],
            "lending",
            this.userName,
            this.userEmail
          );
        }
      },
      error: (error) => {
        console.error("Error generating PDF:", error);
        alert("Failed to generate PDF");
      },
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("en-IN");
  }

  getTotalAmount(): number {
    return aggregatePersons(this.persons).total;
  }

  getTotalLent(): number {
    return aggregatePersons(this.persons).total;
  }

  getTotalPending(): number {
    return aggregatePersons(this.persons).pending;
  }

  getTotalCompleted(): number {
    return aggregatePersons(this.persons).completed;
  }

  getTotalReturned(): number {
    return aggregatePersons(this.persons).completed;
  }

  formatCurrency(amount: number): string {
    return formatMoney(amount);
  }
}
