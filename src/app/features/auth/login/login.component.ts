import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./login.component.html",
  styleUrl: "./login.component.css",
})
export class LoginComponent {
  email = "";
  password = "";
  loading = false;
  error = "";

  constructor(private authService: AuthService, private router: Router) {
    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(["/dashboard"]);
    }
  }

  async loginWithEmail(): Promise<void> {
    if (!this.email || !this.password) {
      this.error = "Please enter email and password";
      return;
    }

    this.loading = true;
    this.error = "";

    try {
      await this.authService.loginWithEmail(this.email, this.password);
    } catch (error: any) {
      this.error = error.message || "Login failed";
    } finally {
      this.loading = false;
    }
  }
}
