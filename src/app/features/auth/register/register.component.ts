import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";

@Component({
  selector: "app-register",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./register.component.html",
  styleUrl: "./register.component.css",
})
export class RegisterComponent {
  displayName = "";
  email = "";
  password = "";
  confirmPassword = "";
  loading = false;
  error = "";

  constructor(private authService: AuthService, private router: Router) {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(["/dashboard"]);
    }
  }

  async registerWithEmail(): Promise<void> {
    if (
      !this.displayName ||
      !this.email ||
      !this.password ||
      !this.confirmPassword
    ) {
      this.error = "Please fill in all fields";
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = "Passwords do not match";
      return;
    }

    if (this.password.length < 6) {
      this.error = "Password must be at least 6 characters";
      return;
    }

    this.loading = true;
    this.error = "";

    try {
      await this.authService.registerWithEmail(
        this.email,
        this.password,
        this.displayName
      );
    } catch (error: any) {
      this.error = error.message || "Registration failed";
    } finally {
      this.loading = false;
    }
  }
}
