import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { lastValueFrom } from "rxjs";
import { NavbarComponent } from "../../shared/components/navbar/navbar.component";
import { ApiService } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";
import { PdfService } from "../../core/services/pdf.service";
import { Person, Transaction } from "../../models/app.models";
import { formatCurrency as formatMoney, reconcilePersonStats, aggregatePersons } from "../../core/utils/money-calculator";

@Component({
  selector: "app-borrowing",
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: "./borrowing.component.html",
  styleUrl: "./borrowing.component.css",
})
export class BorrowingComponent implements OnInit {
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
    status: "completed" as any,
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
    this.apiService.getPersonsBySection("borrowing").subscribe({
      next: (response: any) => {
        if (response.success) {
          this.persons = (response.persons || []).map((p: Person) => ({ ...p, stats: reconcilePersonStats(p.stats) }));
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

  openEditPersonModal(person: Person): void {
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
      alert("Please enter a name");
      return;
    }

    const personData = {
      name: this.personForm.name,
      email: this.personForm.email,
      phone: this.personForm.phone,
    };

    this.apiService.updatePerson(this.editingPersonId, personData).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.loadPersons();
          this.closeEditPersonModal();
          if (this.showPersonDetailsModal && this.selectedPerson) {
            this.selectedPerson = response.person;
          }
        }
      },
      error: (error) => {
        alert(error.error?.message || "Failed to update person");
      },
    });
  }

  addPerson(): void {
    if (!this.personForm.name.trim()) {
      alert("Please enter a name");
      return;
    }

    const personData = {
      ...this.personForm,
      sectionType: "borrowing" as const,
    };

    this.apiService.createPerson(personData).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.loadPersons();
          this.closeAddPersonModal();
        }
      },
      error: (error) => {
        alert(error.error?.message || "Failed to add person");
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
          this.transactions = response.transactions;
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
      status: "completed",
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
      status: "completed",
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
      status: this.transactionForm.status,
    };

    this.apiService.createTransaction(transactionData).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.loadPersons();
          this.closeAddTransactionModal();
          if (this.showPersonDetailsModal) {
            this.loadPersonTransactions(this.selectedPerson!._id);
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

    const transactionData = {
      date: new Date(this.transactionForm.date),
      amount: this.transactionForm.amount,
      remarks: this.transactionForm.remarks,
      status: this.transactionForm.status,
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

  // Settlement Handlers
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
    this.showSettleModal = true;
  }

  closeSettleModal(): void {
    this.showSettleModal = false;
    this.settleTargetPerson = null;
    this.settling = false;
  }

  setFullSettlement(): void {
    if (!this.settleTargetPerson) return;
    this.settleForm.isFull = true;
    this.settleForm.amount = this.settleTargetPerson.stats?.pending || 0;
  }

  setPartialSettlement(): void {
    this.settleForm.isFull = false;
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
    if (amountToSettle > pending) {
      alert(
        `Settlement amount (${this.formatCurrency(amountToSettle)}) cannot exceed current pending balance (${this.formatCurrency(pending)})`
      );
      return;
    }

    this.settling = true;
    const personId = this.settleTargetPerson._id;
    const defaultNote = `Settlement repaid: ${this.formatCurrency(amountToSettle)} via ${this.settleForm.paymentMethod}`;
    const finalRemarks = this.settleForm.remarks.trim()
      ? `${defaultNote} - ${this.settleForm.remarks.trim()}`
      : defaultNote;

    this.apiService.getTransactionsByPerson(personId).subscribe({
      next: async (response: any) => {
        if (!response.success) {
          alert("Failed to retrieve transactions for settlement");
          this.settling = false;
          return;
        }

        const allTx: Transaction[] = response.transactions || [];
        const pendingTx = allTx
          .filter((t) => t.status === "pending")
          .sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );

        let remainingToAllocate = amountToSettle;
        const updatePromises: Promise<any>[] = [];

        for (const tx of pendingTx) {
          if (remainingToAllocate <= 0) break;

          if (remainingToAllocate >= tx.amount) {
            remainingToAllocate -= tx.amount;
            const updatedRemarks = tx.remarks
              ? `${tx.remarks} | Repaid via ${this.settleForm.paymentMethod}`
              : `Repaid via ${this.settleForm.paymentMethod}`;

            updatePromises.push(
              lastValueFrom(
                this.apiService.updateTransaction(tx._id, {
                  status: "completed",
                  remarks: updatedRemarks,
                })
              )
            );
          } else {
            const partialSettleAmount = remainingToAllocate;
            const remainingTxAmount = tx.amount - partialSettleAmount;
            remainingToAllocate = 0;

            updatePromises.push(
              lastValueFrom(
                this.apiService.updateTransaction(tx._id, {
                  amount: remainingTxAmount,
                  status: "pending",
                  remarks: tx.remarks
                    ? `${tx.remarks} (Remaining borrowed balance)`
                    : "Remaining borrowed balance after repayment",
                })
              )
            );

            updatePromises.push(
              lastValueFrom(
                this.apiService.createTransaction({
                  personId: personId,
                  date: new Date(this.settleForm.date),
                  amount: partialSettleAmount,
                  status: "completed",
                  remarks: finalRemarks,
                })
              )
            );
          }
        }

        if (pendingTx.length === 0 && remainingToAllocate > 0) {
          updatePromises.push(
            lastValueFrom(
              this.apiService.createTransaction({
                personId: personId,
                date: new Date(this.settleForm.date),
                amount: remainingToAllocate,
                status: "completed",
                remarks: finalRemarks,
              })
            )
          );
        }

        try {
          await Promise.all(updatePromises);
          this.settling = false;
          this.closeSettleModal();
          this.loadPersons();
          if (
            this.showPersonDetailsModal &&
            this.selectedPerson?._id === personId
          ) {
            this.loadPersonTransactions(personId);
          }
        } catch (err: any) {
          console.error("Settlement error:", err);
          alert(err.message || "Failed to complete settlement");
          this.settling = false;
          this.loadPersons();
        }
      },
      error: (err) => {
        console.error("Error in settlement:", err);
        alert("Failed to process settlement");
        this.settling = false;
      },
    });
  }

  generatePDF(person: Person): void {
    this.apiService.getTransactionsByPerson(person._id).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.pdfService.generatePersonPDF(
            person,
            response.transactions,
            "borrowing",
            this.userName,
            this.userEmail
          );
        }
      },
      error: (error) => {
        alert("Failed to generate PDF");
      },
    });
  }

  formatCurrency(amount: number): string {
    return formatMoney(amount);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("en-IN");
  }

  getTotalAmount(): number {
    return aggregatePersons(this.persons).total;
  }

  getTotalPending(): number {
    return aggregatePersons(this.persons).pending;
  }

  getTotalCompleted(): number {
    return aggregatePersons(this.persons).completed;
  }
}
