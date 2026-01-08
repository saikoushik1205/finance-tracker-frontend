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

  constructor(private http: HttpClient, private router: Router) {
    // Load token and user from localStorage on init
    this.loadStoredAuth();
  }

  private loadStoredAuth(): void {
    const token = localStorage.getItem("auth_token");
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.tokenSubject.next(token);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error("Error loading stored auth:", error);
        this.clearAuth();
      }
    }
  }

  private storeAuth(token: string, user: User): void {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("user", JSON.stringify(user));
    this.tokenSubject.next(token);
    this.currentUserSubject.next(user);
  }

  private clearAuth(): void {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
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
    displayName: string
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
        error.error?.message || error.message || "Registration failed"
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
