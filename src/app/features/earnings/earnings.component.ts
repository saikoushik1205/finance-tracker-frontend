import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { NavbarComponent } from "../../shared/components/navbar/navbar.component";
import { ApiService } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";
import { PdfService } from "../../core/services/pdf.service";
import { Person, Transaction } from "../../models/app.models";

@Component({
  selector: "app-earnings",
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: "./earnings.component.html",
  styleUrl: "./earnings.component.css",
})
export class EarningsComponent implements OnInit {
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

  personForm = {
    name: "",
    email: "",
    phone: "",
    category: "",
  };

  transactionForm = {
    date: new Date().toISOString().split("T")[0],
    amount: 0,
    remarks: "",
    status: "completed" as any,
    type: "",
  };

  userName = "";
  userEmail = "";

  categories = [
    "Salary",
    "Freelance",
    "Investment",
    "Business",
    "Other Income",
  ];

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
    this.apiService.getPersonsBySection("earnings").subscribe({
      next: (response: any) => {
        if (response.success) {
          this.persons = response.persons;
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
    this.personForm = { name: "", email: "", phone: "", category: "" };
    this.showAddPersonModal = true;
  }

  closeAddPersonModal(): void {
    this.showAddPersonModal = false;
  }

  openEditPersonModal(person: Person): void {
    this.editingPersonId = person._id;
    this.personForm = {
      name: person.name,
      email: person.email || "",
      phone: person.phone || "",
      category: person.metadata?.category || "",
    };
    this.showEditPersonModal = true;
  }

  closeEditPersonModal(): void {
    this.showEditPersonModal = false;
    this.editingPersonId = null;
    this.personForm = { name: "", email: "", phone: "", category: "" };
  }

  updatePerson(): void {
    if (!this.editingPersonId || !this.personForm.name.trim()) {
      alert("Please enter a source name");
      return;
    }

    const personData = {
      name: this.personForm.name,
      email: this.personForm.email,
      phone: this.personForm.phone,
      metadata: { category: this.personForm.category },
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
        alert(error.error?.message || "Failed to update income source");
      },
    });
  }

  addPerson(): void {
    if (!this.personForm.name.trim()) {
      alert("Please enter a source/person name");
      return;
    }

    const personData = {
      ...this.personForm,
      sectionType: "earnings" as const,
      metadata: { category: this.personForm.category },
    };

    this.apiService.createPerson(personData).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.loadPersons();
          this.closeAddPersonModal();
        }
      },
      error: (error) => {
        alert(error.error?.message || "Failed to add income source");
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
      type: person.metadata?.category || "",
    };
    this.showAddTransactionModal = true;
  }

  closeAddTransactionModal(): void {
    this.showAddTransactionModal = false;
    this.selectedPerson = null;
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
      type: this.transactionForm.type,
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
        alert(error.error?.message || "Failed to add earning");
      },
    });
  }

  editTransaction(transaction: Transaction): void {
    this.isEditMode = true;
    this.editingTransactionId = transaction._id;
    this.transactionForm = {
      date: new Date(transaction.date).toISOString().split("T")[0],
      amount: transaction.amount,
      type: transaction.type || "",
      remarks: transaction.remarks || "",
      status: transaction.status || "completed",
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
      type: this.transactionForm.type,
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
          alert(error.error?.message || "Failed to update earning");
        },
      });
  }

  deleteTransaction(transactionId: string): void {
    if (!confirm("Delete this earning?")) return;

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
        alert("Failed to delete earning");
      },
    });
  }

  deletePerson(personId: string): void {
    if (!confirm("Delete this income source and all earnings?")) return;

    this.apiService.deletePerson(personId).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.loadPersons();
          this.closePersonDetailsModal();
        }
      },
      error: (error) => {
        alert("Failed to delete income source");
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
            "earnings",
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
    return "₹" + amount.toLocaleString("en-IN");
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("en-IN");
  }

  getTotalAmount(): number {
    return this.persons.reduce((sum, p) => sum + (p.stats?.total || 0), 0);
  }

  getTotalByCategory(category: string): number {
    return this.persons
      .filter((p) => p.metadata?.category === category)
      .reduce((sum, p) => sum + (p.stats?.total || 0), 0);
  }
}
