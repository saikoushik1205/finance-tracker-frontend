import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink, Router, NavigationEnd } from "@angular/router";
import { NavbarComponent } from "../../shared/components/navbar/navbar.component";
import { ApiService } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";
import { DashboardStats } from "../../models/app.models";
import { formatCurrency as formatMoney, calculateFinancialMetrics } from "../../core/utils/money-calculator";
import { filter } from "rxjs/operators";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: "./dashboard.component.html",
  styleUrl: "./dashboard.component.css",
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  loading = true;
  error = "";
  userName = "";
  hasInterestAccess = false;
  financialMetrics = { netReceivable: 0, cashPosition: 0, netWorth: 0 };

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.userName = user.displayName || user.email || "User";
        this.checkInterestAccess();
      }
    });
    this.loadDashboardStats();

    // Reload data when navigating to dashboard
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.url === "/dashboard") {
          this.loadDashboardStats();
        }
      });
  }

  checkInterestAccess(): void {
    this.authService.checkInterestAccess().subscribe({
      next: (response: any) => {
        this.hasInterestAccess = response.success && response.hasAccess;
      },
    });
  }

  loadDashboardStats(): void {
    this.loading = true;
    this.error = "";

    this.apiService.getDashboardStats().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.stats = response.stats;
          this.financialMetrics = calculateFinancialMetrics(this.stats);
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = "Failed to load dashboard statistics";
        this.loading = false;
        console.error("Dashboard error:", error);
      },
    });
  }

  formatCurrency(amount: number): string {
    return formatMoney(amount);
  }

  getNetReceivableClass(): string {
    return this.financialMetrics.netReceivable >= 0 ? "text-success" : "text-danger";
  }

  getNetWorthClass(): string {
    return this.financialMetrics.netWorth >= 0 ? "text-success" : "text-danger";
  }

  getNetBalanceClass(): string {
    if (!this.stats) return "";
    return this.getNetReceivableClass();
  }

  getActivePeopleCount(): number {
    if (!this.stats) return 0;
    // Count people from lending and borrowing sections
    return 0; // This would need to be calculated from the actual data
  }
}
