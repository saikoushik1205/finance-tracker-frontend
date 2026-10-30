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

  describe("calculatePersonStats with Pending and Completed", () => {
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
          remarks: "pending loan",
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

    it("handles single completed transaction", () => {
      const txs: Transaction[] = [
        {
          _id: "1",
          personId: "p1",
          userId: "u1",
          date: new Date(),
          amount: 2500,
          remarks: "returned",
          status: "completed",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const result = calculatePersonStats(txs);
      expect(result.total).toBe(2500);
      expect(result.completed).toBe(2500);
      expect(result.pending).toBe(0);
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

    it("accurately calculates settlements without misclassifying pending loans that mention settled via", () => {
      const txs: Transaction[] = [
        {
          _id: "1",
          personId: "p1",
          userId: "u1",
          date: new Date(),
          amount: 426,
          status: "completed",
          type: "repayment",
          remarks: "Settlement received: ₹426 via UPI / Online - PAY-PAL TRANSFER",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: "2",
          personId: "p1",
          userId: "u1",
          date: new Date(),
          amount: 604,
          status: "pending",
          remarks: "Nothing Charger Order",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: "3",
          personId: "p1",
          userId: "u1",
          date: new Date(),
          amount: 5385,
          status: "pending",
          remarks: "Mobile Order (Remaining pending after partial settlement)",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: "4",
          personId: "p1",
          userId: "u1",
          date: new Date(),
          amount: 300,
          status: "pending",
          remarks: "Transfer | Settled via UPI / Online",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const result = calculatePersonStats(txs);
      expect(result.total).toBe(6289);
      expect(result.completed).toBe(426);
      expect(result.pending).toBe(5863);
      expect(result.transactionCount).toBe(4);
    });
  });

  describe("reconcilePersonStats & aggregatePersons", () => {
    it("aggregates persons strictly using Total = Completed + Pending", () => {
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
    it("computes Net Balance accurately as Pending Lent minus Pending Borrowed", () => {
      const mockDashboard: Partial<DashboardStats> = {
        lending: { total: 100000, completed: 4277, pending: 95723 },
        borrowing: { total: 1000, completed: 574, pending: 426 },
        earnings: { total: 50000, completed: 50000, pending: 0 },
        expenses: { total: 20000, completed: 20000, pending: 0 },
        cashBank: { cash: 10000, bank: 10000, total: 20000 },
      };

      const metrics = calculateFinancialMetrics(mockDashboard as DashboardStats);
      expect(metrics.netBalance).toBe(95297);
    });
  });
});
