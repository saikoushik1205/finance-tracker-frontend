import {
  toPaise,
  fromPaise,
  formatCurrency,
  calculatePersonStats,
  reconcilePersonStats,
  aggregatePersons,
  calculateFinancialMetrics,
} from "./money-calculator";
import { Transaction, Person, DashboardStats } from "../../models/app.models";

describe("Money Calculator Utility (Frontend)", () => {
  describe("Paise Conversions & Floating Point Integrity", () => {
    it("converts rupees to paise accurately", () => {
      expect(toPaise(100)).toBe(10000);
      expect(toPaise(0.5)).toBe(50);
      expect(toPaise(1234.56)).toBe(123456);
      expect(toPaise(null)).toBe(0);
      expect(toPaise(undefined)).toBe(0);
      expect(toPaise(NaN)).toBe(0);
    });

    it("avoids standard IEEE 754 floating point errors (e.g. 0.1 + 0.2)", () => {
      const sum = 0.1 + 0.2;
      expect(toPaise(sum)).toBe(30);
      expect(fromPaise(30)).toBe(0.3);
    });

    it("converts paise to rupees accurately", () => {
      expect(fromPaise(10000)).toBe(100);
      expect(fromPaise(50)).toBe(0.5);
      expect(fromPaise(123456)).toBe(1234.56);
      expect(fromPaise(0)).toBe(0);
    });

    it("formats currency using Indian grouping", () => {
      const formatted = formatCurrency(101759);
      expect(formatted).toContain("1,01,759");
    });
  });

  describe("calculatePersonStats & Invariant Checking", () => {
    it("handles zero transactions and empty arrays gracefully", () => {
      const result = calculatePersonStats([]);
      expect(result).toEqual({
        transactionCount: 0,
        total: 0,
        completed: 0,
        pending: 0,
      });
      expect(result.pending).toBe(result.total - result.completed);
    });

    it("handles single pending transaction", () => {
      const txs: Transaction[] = [
        {
          _id: "1",
          personId: "p1",
          userId: "u1",
          date: new Date(),
          amount: 5000,
          remarks: "loan",
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const result = calculatePersonStats(txs);
      expect(result.total).toBe(5000);
      expect(result.completed).toBe(0);
      expect(result.pending).toBe(5000);
      expect(result.pending).toBe(result.total - result.completed);
    });

    it("reconciles user's reported bug (Total 2650, Pending 1540)", () => {
      // In user's system: 2650 total, 1540 pending, 1110 partial
      const txs: Transaction[] = [
        {
          _id: "1",
          personId: "p1",
          userId: "u1",
          date: new Date(),
          amount: 1540,
          remarks: "pending portion",
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: "2",
          personId: "p1",
          userId: "u1",
          date: new Date(),
          amount: 1110,
          remarks: "partial return",
          status: "partial",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const result = calculatePersonStats(txs);
      expect(result.total).toBe(2650);
      expect(result.completed).toBe(1110);
      expect(result.pending).toBe(1540);
      expect(result.pending).toBe(result.total - result.completed);
    });

    it("ignores cancelled transactions", () => {
      const txs: Transaction[] = [
        {
          _id: "1",
          personId: "p1",
          userId: "u1",
          date: new Date(),
          amount: 2000,
          remarks: "valid",
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: "2",
          personId: "p1",
          userId: "u1",
          date: new Date(),
          amount: 9000,
          remarks: "cancelled",
          status: "cancelled",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const result = calculatePersonStats(txs);
      expect(result.transactionCount).toBe(1);
      expect(result.total).toBe(2000);
      expect(result.pending).toBe(2000);
      expect(result.completed).toBe(0);
    });

    it("accurately handles decimal paise amounts", () => {
      const txs: Transaction[] = [
        {
          _id: "1",
          personId: "p1",
          userId: "u1",
          date: new Date(),
          amount: 1500.5,
          remarks: "cents",
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: "2",
          personId: "p1",
          userId: "u1",
          date: new Date(),
          amount: 499.5,
          remarks: "cents return",
          status: "completed",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const result = calculatePersonStats(txs);
      expect(result.total).toBe(2000);
      expect(result.completed).toBe(499.5);
      expect(result.pending).toBe(1500.5);
      expect(result.pending).toBe(result.total - result.completed);
    });
  });

  describe("reconcilePersonStats & aggregatePersons", () => {
    it("reconciles legacy stats object where returned was omitted", () => {
      const legacyStats = {
        transactionCount: 2,
        total: 2650,
        pending: 1540,
        completed: 0,
      };
      const reconciled = reconcilePersonStats(legacyStats);
      expect(reconciled.total).toBe(2650);
      expect(reconciled.completed).toBe(1110);
      expect(reconciled.pending).toBe(1540);
      expect(reconciled.pending).toBe(reconciled.total - reconciled.completed);
    });

    it("aggregates persons while strictly enforcing aggregate invariant", () => {
      const persons: Partial<Person>[] = [
        {
          _id: "p1",
          name: "Person 1",
          stats: { transactionCount: 2, total: 2650, pending: 1540, completed: 1110 },
        },
        {
          _id: "p2",
          name: "Person 2",
          stats: { transactionCount: 5, total: 99109, pending: 94609, completed: 4500 },
        },
      ];
      const agg = aggregatePersons(persons as Person[]);
      expect(agg.total).toBe(101759);
      expect(agg.completed).toBe(5610);
      expect(agg.pending).toBe(96149);
      expect(agg.pending).toBe(agg.total - agg.completed);
    });
  });

  describe("calculateFinancialMetrics", () => {
    it("computes Net Receivable, Cash Position and Net Worth accurately", () => {
      const mockDashboard: Partial<DashboardStats> = {
        lending: { total: 100000, completed: 10000, pending: 90000 },
        borrowing: { total: 40000, completed: 10000, pending: 30000 },
        earnings: { total: 50000, completed: 50000, pending: 0 },
        expenses: { total: 20000, completed: 20000, pending: 0 },
        cashBank: { cash: 15000, bank: 35000, total: 50000 },
      };

      const metrics = calculateFinancialMetrics(mockDashboard as DashboardStats);
      // Net Receivable = 90,000 - 30,000 = 60,000
      expect(metrics.netReceivable).toBe(60000);
      // Cash Position = 15,000 + 35,000 = 50,000
      expect(metrics.cashPosition).toBe(50000);
      // Net Worth = 50,000 (cash) + 50,000 (earnings) - 20,000 (expenses) + 60,000 (receivable) = 140,000
      expect(metrics.netWorth).toBe(140000);
    });
  });
});
