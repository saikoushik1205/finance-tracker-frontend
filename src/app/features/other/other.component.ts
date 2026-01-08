import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { NavbarComponent } from "../../shared/components/navbar/navbar.component";
import { ApiService } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";

@Component({
  selector: "app-other",
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: "./other.component.html",
  styleUrl: "./other.component.css",
})
export class OtherComponent implements OnInit {
  cashBalance = 0;
  bankBalance = 0;
  loading = true;
  saving = false;

  tempCash = 0;
  tempBank = 0;

  editingCash = false;
  editingBank = false;

  userName = "";
  lastUpdated: Date | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.userName = user.displayName || user.email || "User";
      }
    });
    this.loadBalances();
  }

  loadBalances(): void {
    this.loading = true;
    this.apiService.getCashBank().subscribe({
      next: (response: any) => {
        console.log("Cash Bank Response:", response);
        if (response.success) {
          if (response.data) {
            this.cashBalance = response.data.cash || 0;
            this.bankBalance = response.data.bank || 0;
            this.lastUpdated = response.data.updatedAt;
          } else {
            // Initialize with 0 if no data exists
            this.cashBalance = 0;
            this.bankBalance = 0;
          }
          this.tempCash = this.cashBalance;
          this.tempBank = this.bankBalance;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error("Error loading balances:", error);
        this.loading = false;
      },
    });
  }

  startEditCash(): void {
    this.editingCash = true;
    this.tempCash = this.cashBalance;
  }

  cancelEditCash(): void {
    this.editingCash = false;
    this.tempCash = this.cashBalance;
  }

  saveCash(): void {
    if (this.tempCash < 0) {
      alert("Cash balance cannot be negative");
      return;
    }

    this.saving = true;
    this.apiService.updateCashBank({ cash: this.tempCash }).subscribe({
      next: (response: any) => {
        console.log("Update Cash Response:", response);
        if (response.success && response.data) {
          this.cashBalance = response.data.cash || 0;
          this.bankBalance = response.data.bank || 0;
          this.tempCash = this.cashBalance;
          this.tempBank = this.bankBalance;
          this.editingCash = false;
        } else {
          alert("Update succeeded but no data returned");
        }
        this.saving = false;
      },
      error: (error) => {
        console.error("Update cash error:", error);
        alert("Failed to update cash balance");
        this.saving = false;
      },
    });
  }

  startEditBank(): void {
    this.editingBank = true;
    this.tempBank = this.bankBalance;
  }

  cancelEditBank(): void {
    this.editingBank = false;
    this.tempBank = this.bankBalance;
  }

  saveBank(): void {
    if (this.tempBank < 0) {
      alert("Bank balance cannot be negative");
      return;
    }

    this.saving = true;
    this.apiService.updateCashBank({ bank: this.tempBank }).subscribe({
      next: (response: any) => {
        console.log("Update Bank Response:", response);
        if (response.success && response.data) {
          this.cashBalance = response.data.cash || 0;
          this.bankBalance = response.data.bank || 0;
          this.tempCash = this.cashBalance;
          this.tempBank = this.bankBalance;
          this.editingBank = false;
        } else {
          alert("Update succeeded but no data returned");
        }
        this.saving = false;
      },
      error: (error) => {
        console.error("Update bank error:", error);
        alert("Failed to update bank balance");
        this.saving = false;
      },
    });
  }

  getTotalBalance(): number {
    return this.cashBalance + this.bankBalance;
  }

  getCashPercentage(): number {
    const total = this.getTotalBalance();
    return total > 0 ? (this.cashBalance / total) * 100 : 0;
  }

  getBankPercentage(): number {
    const total = this.getTotalBalance();
    return total > 0 ? (this.bankBalance / total) * 100 : 0;
  }

  formatCurrency(amount: number): string {
    return "₹" + amount.toLocaleString("en-IN");
  }

  formatDate(date: Date | null): string {
    if (!date) return "Never";
    return new Date(date).toLocaleString("en-IN");
  }

  getPercentageColor(percentage: number): string {
    if (percentage >= 60) return "#48bb78";
    if (percentage >= 40) return "#ed8936";
    return "#f56565";
  }
}
