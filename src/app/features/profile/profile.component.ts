import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { NavbarComponent } from "../../shared/components/navbar/navbar.component";
import { AuthService } from "../../core/services/auth.service";
import { ApiService } from "../../core/services/api.service";

@Component({
  selector: "app-profile",
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: "./profile.component.html",
  styleUrl: "./profile.component.css",
})
export class ProfileComponent implements OnInit {
  user: any = null;
  userStats: any = null;
  loading = true;
  editingProfile = false;

  profileForm = {
    displayName: "",
    email: "",
    phone: "",
  };

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadUserStats();
  }

  loadUserData(): void {
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.user = user;
        this.profileForm = {
          displayName: user.displayName || "",
          email: user.email || "",
          phone: "",
        };
        this.loading = false;
      } else {
        this.router.navigate(["/auth/login"]);
      }
    });
  }

  loadUserStats(): void {
    this.apiService.getDashboardStats().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.userStats = response.stats;
        }
      },
      error: (error) => {
        console.error("Error loading stats:", error);
      },
    });
  }

  startEditProfile(): void {
    this.editingProfile = true;
  }

  cancelEditProfile(): void {
    this.editingProfile = false;
    if (this.user) {
      this.profileForm = {
        displayName: this.user.displayName || "",
        email: this.user.email || "",
        phone: this.user.phoneNumber || "",
      };
    }
  }

  saveProfile(): void {
    // Profile update via backend API
    alert("Profile update feature coming soon!");
    this.editingProfile = false;
  }

  logout(): void {
    if (confirm("Are you sure you want to logout?")) {
      this.authService
        .logout()
        .then(() => {
          this.router.navigate(["/auth/login"]);
        })
        .catch((error: any) => {
          console.error("Logout error:", error);
        });
    }
  }

  getInitials(): string {
    if (this.user?.displayName) {
      return this.user.displayName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return this.user?.email?.charAt(0).toUpperCase() || "?";
  }

  getMemberSince(): string {
    if (this.user?.memberSince) {
      return new Date(this.user.memberSince).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    return "Unknown";
  }

  formatCurrency(amount: number): string {
    return "₹" + (amount || 0).toLocaleString("en-IN");
  }

  hasInterestAccess(): boolean {
    return this.user?.email === "koushiksai242@gmail.com";
  }
}
