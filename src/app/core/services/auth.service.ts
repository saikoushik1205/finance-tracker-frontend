import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, BehaviorSubject, throwError } from "rxjs";
import { tap, catchError } from "rxjs/operators";
import { Router } from "@angular/router";
import { environment } from "../../../environments/environment";
import { User } from "../../models/app.models";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token$ = this.tokenSubject.asObservable();

  private tokenExpiryTimer: any = null;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    // Load token and user from localStorage on init
    this.loadStoredAuth();
    // Check token expiry on init
    this.checkTokenExpiry();
  }

  private loadStoredAuth(): void {
    const token = localStorage.getItem("auth_token");
    const userStr = localStorage.getItem("user");
    const expiryStr = localStorage.getItem("token_expiry");

    if (token && userStr && expiryStr) {
      try {
        const expiry = parseInt(expiryStr, 10);
        const now = Date.now();

        // Check if token has expired
        if (now >= expiry) {
          console.log("Token has expired. Auto-logout triggered.");
          this.clearAuth();
          this.router.navigate(["/auth/login"]);
          return;
        }

        const user = JSON.parse(userStr);
        this.tokenSubject.next(token);
        this.currentUserSubject.next(user);

        // Set up auto-logout timer
        this.setTokenExpiryTimer(expiry);
      } catch (error) {
        console.error("Error loading stored auth:", error);
        this.clearAuth();
      }
    }
  }

  private storeAuth(token: string, user: User): void {
    // JWT expires in 12 hours (as configured in backend)
    const expiryTime = Date.now() + 12 * 60 * 60 * 1000; // 12 hours in milliseconds

    localStorage.setItem("auth_token", token);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token_expiry", expiryTime.toString());

    this.tokenSubject.next(token);
    this.currentUserSubject.next(user);

    // Set up auto-logout timer
    this.setTokenExpiryTimer(expiryTime);
  }

  private setTokenExpiryTimer(expiryTime: number): void {
    // Clear any existing timer
    if (this.tokenExpiryTimer) {
      clearTimeout(this.tokenExpiryTimer);
    }

    const timeUntilExpiry = expiryTime - Date.now();

    if (timeUntilExpiry > 0) {
      console.log(
        `Token will expire in ${Math.round(timeUntilExpiry / 1000 / 60)} minutes`,
      );

      this.tokenExpiryTimer = setTimeout(() => {
        console.log("Token expired. Logging out...");
        this.logout();
      }, timeUntilExpiry);
    }
  }

  private checkTokenExpiry(): void {
    // Check token expiry every minute
    setInterval(() => {
      const expiryStr = localStorage.getItem("token_expiry");
      if (expiryStr) {
        const expiry = parseInt(expiryStr, 10);
        const now = Date.now();

        if (now >= expiry && this.isAuthenticated()) {
          console.log("Token expired during session. Auto-logout triggered.");
          this.logout();
        }
      }
    }, 60000); // Check every minute
  }

  private clearAuth(): void {
    // Clear the expiry timer
    if (this.tokenExpiryTimer) {
      clearTimeout(this.tokenExpiryTimer);
      this.tokenExpiryTimer = null;
    }

    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    localStorage.removeItem("token_expiry");
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
  }

  async loginWithEmail(email: string, password: string): Promise<void> {
    try {
      const response = await this.http
        .post<any>(`${environment.apiUrl}/auth/login`, { email, password })
        .toPromise();

      if (response.success && response.token) {
        this.storeAuth(response.token, response.user);
        this.router.navigate(["/dashboard"]);
      } else {
        throw new Error(response.message || "Login failed");
      }
    } catch (error: any) {
      console.error("Email sign-in error:", error);
      throw new Error(error.error?.message || error.message || "Login failed");
    }
  }

  async registerWithEmail(
    email: string,
    password: string,
    displayName: string,
  ): Promise<void> {
    try {
      const response = await this.http
        .post<any>(`${environment.apiUrl}/auth/register`, {
          email,
          password,
          displayName,
        })
        .toPromise();

      if (response.success && response.token) {
        this.storeAuth(response.token, response.user);
        this.router.navigate(["/dashboard"]);
      } else {
        throw new Error(response.message || "Registration failed");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      throw new Error(
        error.error?.message || error.message || "Registration failed",
      );
    }
  }

  async logout(): Promise<void> {
    try {
      this.clearAuth();
      this.router.navigate(["/auth/login"]);
    } catch (error: any) {
      console.error("Logout error:", error);
      throw new Error(error.message || "Logout failed");
    }
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value && !!this.tokenSubject.value;
  }

  checkInterestAccess(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/auth/check-interest-access`);
  }

  updateProfile(data: Partial<User>): Observable<any> {
    return this.http.put(`${environment.apiUrl}/auth/profile`, data);
  }
}
