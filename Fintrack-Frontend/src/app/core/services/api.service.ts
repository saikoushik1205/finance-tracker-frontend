import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import {
  Person,
  Transaction,
  CashBank,
  DashboardStats,
} from "../../models/app.models";

@Injectable({
  providedIn: "root",
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Person APIs
  getPersonsBySection(sectionType: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/persons/section/${sectionType}`);
  }

  getPersonById(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/persons/${id}`);
  }

  createPerson(person: Partial<Person>): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/persons`, person);
  }

  updatePerson(id: string, person: Partial<Person>): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/persons/${id}`, person);
  }

  deletePerson(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/persons/${id}`);
  }

  // Transaction APIs
  getTransactionsByPerson(personId: string): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/transactions/person/${personId}`
    );
  }

  createTransaction(transaction: Partial<Transaction>): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/transactions`, transaction);
  }

  updateTransaction(
    id: string,
    transaction: Partial<Transaction>
  ): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}/transactions/${id}`,
      transaction
    );
  }

  deleteTransaction(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/transactions/${id}`);
  }

  // Cash & Bank APIs
  getCashBank(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/cash-bank`);
  }

  updateCashBank(data: Partial<CashBank>): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/cash-bank`, data);
  }

  // Dashboard APIs
  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/dashboard/stats`);
  }

  getRecentTransactions(limit: number = 10): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/dashboard/recent-transactions?limit=${limit}`
    );
  }
}
