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

  describe("calculatePersonStats with Dedicated Partial Section", () => {
    it("handles zero transactions and empty arrays gracefully", () => {
      const result = calculatePersonStats([]);
      expect(result).toEqual({
        transactionCount: 0,
        total: 0,
        completed: 0,
        partial: 0,
        pending: 0,
      });
    });

    it("keeps partial transactions strictly separated from returned transactions", () => {
      // In Lent Section: Don't add partial payments into returned; keep a separate section for partial
      const txs: Transaction[] = [
        {
          _id: "1",
          personId: "p1",
          userId: "u1",
          date: new Date(),
          amount: 1540,
          remarks: "pending loan",
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
      expect(result.completed).toBe(0);    // Only fully returned
      expect(result.partial).toBe(1110);   // Dedicated partial section
      expect(result.pending).toBe(1540);
      expect(result.total).toBe(result.completed + result.partial + result.pending);
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
      expect(result.partial).toBe(0);
    });
  });

  describe("reconcilePersonStats & aggregatePersons", () => {
    it("aggregates persons while keeping partial separated", () => {
      const persons: Partial<Person>[] = [
        {
          _id: "p1",
          name: "Person 1",
          stats: { transactionCount: 2, total: 2650, pending: 1540, completed: 0, partial: 1110 },
        },
        {
          _id: "p2",
          name: "Person 2",
          stats: { transactionCount: 5, total: 99109, pending: 94609, completed: 4500, partial: 0 },
        },
      ];
      const agg = aggregatePersons(persons as Person[]);
      expect(agg.total).toBe(101759);
      expect(agg.completed).toBe(4500); // strictly returned
      expect(agg.partial).toBe(1110);   // strictly partial
      expect(agg.pending).toBe(96149);   // strictly pending
      expect(agg.total).toBe(agg.completed + agg.partial + agg.pending);
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
      // Net Balance = 95,723 - 426 = 95,297
      expect(metrics.netBalance).toBe(95297);
    });
  });
});
