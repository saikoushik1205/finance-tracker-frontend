import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { firstValueFrom } from "rxjs";
import { NavbarComponent } from "../../shared/components/navbar/navbar.component";
import { ApiService } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";
import { PdfService } from "../../core/services/pdf.service";
import { BalanceAccount, CashBank } from "../../models/app.models";

type AccountGroupKey = "amazonPayAccounts" | "bankAccounts" | "tideAccounts";

interface AccountGroup {
  key: AccountGroupKey;
  title: string;
  subtitle: string;
  nameLabel: string;
  placeholder: string;
  addLabel: string;
  className: string;
}

@Component({
  selector: "app-other",
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: "./other.component.html",
  styleUrl: "./other.component.css",
})
export class OtherComponent implements OnInit {
  amazonPayAccounts: BalanceAccount[] = [];
  bankAccounts: BalanceAccount[] = [];
  tideAccounts: BalanceAccount[] = [];

  readonly groups: AccountGroup[] = [
    {
      key: "amazonPayAccounts",
      title: "Amazon Pay Balance",
      subtitle: "Multiple Amazon Pay wallets or profiles",
      nameLabel: "Amazon account",
      placeholder: "Personal Amazon Pay",
      addLabel: "Add Amazon Account",
      className: "amazon",
    },
    {
      key: "bankAccounts",
      title: "Bank Accounts",
      subtitle: "Maintain balances across multiple banks",
      nameLabel: "Bank name",
      placeholder: "HDFC Bank",
      addLabel: "Add Bank Account",
      className: "bank",
    },
    {
      key: "tideAccounts",
      title: "Tide Prepaid Cards",
      subtitle: "Track Tide card balances separately",
      nameLabel: "Tide account",
      placeholder: "Tide prepaid card",
      addLabel: "Add Tide Account",
      className: "tide",
    },
  ];

  newAccounts: Record<AccountGroupKey, BalanceAccount> = {
    amazonPayAccounts: { name: "", balance: 0 },
    bankAccounts: { name: "", balance: 0 },
    tideAccounts: { name: "", balance: 0 },
  };

  loading = true;
  savingKey: AccountGroupKey | null = null;
  userName = "";
  userEmail = "";
  lastUpdated: Date | null = null;
  editingIndex: Record<AccountGroupKey, number | null> = {
    amazonPayAccounts: null,
    bankAccounts: null,
    tideAccounts: null,
  };
  private saveQueue: Promise<void> = Promise.resolve();
  private saveRequestId = 0;

  editDraft: Record<AccountGroupKey, BalanceAccount> = {
    amazonPayAccounts: { name: "", balance: 0 },
    bankAccounts: { name: "", balance: 0 },
    tideAccounts: { name: "", balance: 0 },
  };

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private pdfService: PdfService,
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.userName = user.displayName || user.email || "User";
        this.userEmail = user.email || "";
      }
    });
    this.loadBalances();
  }

  startEdit(group: AccountGroup, index: number): void {
    const list: BalanceAccount[] = this[group.key];
    const acct = list[index];
    if (!acct) return;
    // clone into draft
    this.editDraft[group.key] = { ...acct };
    this.editingIndex[group.key] = index;
  }

  saveEdit(group: AccountGroup): void {
    const idx = this.editingIndex[group.key];
    const draft = this.editDraft[group.key];
    if (idx == null || !draft) return;
    const name = (draft.name || "").trim();
    if (!name) {
      alert("Account name is required");
      return;
    }
    if (draft.balance < 0) {
      alert("Balance cannot be negative");
      return;
    }
    // apply draft
    const arr = [...this[group.key]];
    arr[idx] = { ...arr[idx], name, balance: Number(draft.balance) || 0 };
    this[group.key] = arr;
    this.editingIndex[group.key] = null;
    this.editDraft[group.key] = { name: "", balance: 0 };
    this.saveGroup(group.key);
  }

  cancelEdit(group: AccountGroup): void {
    this.editingIndex[group.key] = null;
    this.editDraft[group.key] = { name: "", balance: 0 };
  }

  loadBalances(): void {
    this.loading = true;
    this.apiService.getCashBank().subscribe({
      next: (response: any) => {
        if (response.success) {
          const data = response.data || {};
          this.amazonPayAccounts = this.cloneAccounts(data.amazonPayAccounts);
          this.bankAccounts = this.cloneAccounts(data.bankAccounts);
          this.tideAccounts = this.cloneAccounts(data.tideAccounts);

          this.lastUpdated = data.updatedAt || null;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error("Error loading other balances:", error);
        this.loading = false;
      },
    });
  }

  addAccount(group: AccountGroup): void {
    const draft = this.newAccounts[group.key];
    const name = draft.name.trim();

    if (!name) {
      alert(`${group.nameLabel} is required`);
      return;
    }

    if (draft.balance < 0) {
      alert("Balance cannot be negative");
      return;
    }

    this[group.key] = [
      ...this[group.key],
      { name, balance: draft.balance || 0 },
    ];
    this.newAccounts[group.key] = { name: "", balance: 0 };
    this.saveGroup(group.key);
  }

  updateAccount(group: AccountGroup): void {
    const invalidAccount = this[group.key].find(
      (account) => !account.name.trim() || account.balance < 0,
    );

    if (invalidAccount) {
      alert("Account name is required and balance cannot be negative");
      return;
    }

    this[group.key] = this[group.key].map((account) => ({
      ...account,
      name: account.name.trim(),
      balance: Number(account.balance) || 0,
    }));
    this.saveGroup(group.key);
  }

  deleteAccount(group: AccountGroup, index: number): void {
    this[group.key] = this[group.key].filter(
      (_, accountIndex) => accountIndex !== index,
    );
    this.saveGroup(group.key);
  }

  saveGroup(key: AccountGroupKey): void {
    const payload: Partial<CashBank> = {
      amazonPayAccounts: this.cloneAccounts(this.amazonPayAccounts),
      bankAccounts: this.cloneAccounts(this.bankAccounts),
      tideAccounts: this.cloneAccounts(this.tideAccounts),
    };
    const requestId = ++this.saveRequestId;

    this.savingKey = key;
    this.saveQueue = this.saveQueue
      .then(() => this.performSave(payload, requestId))
      .catch((error) => {
        console.error("Queued other balances save failed:", error);
      });
  }

  private async performSave(
    payload: Partial<CashBank>,
    requestId: number,
  ): Promise<void> {
    try {
      const response: any = await firstValueFrom(
        this.apiService.updateCashBank(payload),
      );

      if (response.success && response.data) {
        // Only apply the response if this is still the latest save request.
        if (requestId === this.saveRequestId) {
          this.amazonPayAccounts = this.cloneAccounts(
            response.data.amazonPayAccounts,
          );
          this.bankAccounts = this.cloneAccounts(response.data.bankAccounts);
          this.tideAccounts = this.cloneAccounts(response.data.tideAccounts);
          this.lastUpdated = response.data.updatedAt || new Date();
        }
      }
    } catch (error) {
      if (requestId === this.saveRequestId) {
        console.error("Update other balances error:", error);
        alert("Failed to update balances");
        this.loadBalances();
      }
    } finally {
      if (requestId === this.saveRequestId) {
        this.savingKey = null;
      }
    }
  }

  getAccounts(key: AccountGroupKey): BalanceAccount[] {
    return this[key];
  }

  getGroupTotal(key: AccountGroupKey): number {
    return this[key].reduce(
      (sum, account) => sum + (Number(account.balance) || 0),
      0,
    );
  }

  getTotalBalance(): number {
    return this.groups.reduce(
      (sum, group) => sum + this.getGroupTotal(group.key),
      0,
    );
  }

  getGroupPercentage(key: AccountGroupKey): number {
    const total = this.getTotalBalance();
    return total > 0 ? (this.getGroupTotal(key) / total) * 100 : 0;
  }

  getLargestGroup(): AccountGroup {
    return this.groups.reduce((largest, group) =>
      this.getGroupTotal(group.key) > this.getGroupTotal(largest.key)
        ? group
        : largest,
    );
  }

  formatCurrency(amount: number): string {
    return "Rs. " + (Number(amount) || 0).toLocaleString("en-IN");
  }

  formatDate(date: Date | null): string {
    if (!date) return "Never";
    return new Date(date).toLocaleString("en-IN");
  }

  private cloneAccounts(accounts: BalanceAccount[] = []): BalanceAccount[] {
    return accounts.map((account) => ({
      _id: account._id,
      name: account.name,
      balance: Number(account.balance) || 0,
    }));
  }

  exportGroupAsPDF(groupKey: AccountGroupKey): void {
    const group = this.groups.find((g) => g.key === groupKey);
    if (!group) return;
    const accounts = this.getAccounts(groupKey).map((a) => ({
      name: a.name,
      balance: Number(a.balance) || 0,
    }));
    this.pdfService.generateOthersPDF(
      [{ title: group.title, accounts }],
      group.key,
      this.userName,
      this.userEmail,
    );
  }

  exportAllAsPDF(): void {
    const groupsData = this.groups.map((g) => ({
      title: g.title,
      accounts: this.getAccounts(g.key).map((a) => ({
        name: a.name,
        balance: Number(a.balance) || 0,
      })),
    }));
    this.pdfService.generateOthersPDF(
      groupsData,
      "others",
      this.userName,
      this.userEmail,
    );
  }
}
