import {
  toPaise,
  fromPaise,
  formatCurrency,
  isRepayment,
  isLegacySplitLoan,
  isLegacyCompletedLoan,
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

  describe("Classification Helpers", () => {
    it("identifies new clean repayment by type", () => {
      expect(isRepayment({ type: "repayment", amount: 500 } as any)).toBe(true);
      expect(isRepayment({ type: "REPAYMENT", amount: 500 } as any)).toBe(true);
    });

    it("identifies legacy settlement by remarks", () => {
      expect(isRepayment({ remarks: "Settlement received: ₹500 via Cash" } as any)).toBe(true);
      expect(isRepayment({ remarks: "Normal loan to friend" } as any)).toBe(false);
    });

    it("identifies legacy split loan", () => {
      expect(
        isLegacySplitLoan({
          remarks: "Grocery loan (Remaining pending after partial settlement)",
        } as any)
      ).toBe(true);
      expect(isLegacySplitLoan({ remarks: "Grocery loan" } as any)).toBe(false);
    });

    it("identifies legacy completed loan", () => {
      expect(isLegacyCompletedLoan({ status: "completed", type: "" } as any)).toBe(true);
      expect(isLegacyCompletedLoan({ status: "pending", type: "" } as any)).toBe(false);
      expect(isLegacyCompletedLoan({ status: "completed", type: "repayment" } as any)).toBe(false);
    });
  });

  describe("calculatePersonStats - Clean Ledger & Legacy Scenarios", () => {
    it("handles zero transactions and empty arrays gracefully", () => {
      const result = calculatePersonStats([]);
      expect(result).toEqual({
        transactionCount: 0,
        total: 0,
        completed: 0,
        pending: 0,
        advance: 0,
      });
      expect(result.pending).toBe(result.total - result.completed);
    });

    it("handles single clean pending loan", () => {
      const txs = [
        {
          _id: "1",
          personId: "p1",
          userId: "u1",
          date: new Date(),
          amount: 5000,
          remarks: "pending loan",
          status: "pending",
          type: "",
        },
      ];
      const result = calculatePersonStats(txs as any);
      expect(result.total).toBe(5000);
      expect(result.completed).toBe(0);
      expect(result.pending).toBe(5000);
      expect(result.advance).toBe(0);
      expect(result.pending).toBe(result.total - result.completed);
    });

    it("scenario 1: partial settlement (1 loan, 1 repayment)", () => {
      const txs = [
        { amount: 10000, status: "pending", type: "" },
        { amount: 3000, status: "completed", type: "repayment" },
      ];
      const res = calculatePersonStats(txs as any);
      expect(res.total).toBe(10000);
      expect(res.completed).toBe(3000);
      expect(res.pending).toBe(7000);
      expect(res.advance).toBe(0);
      expect(res.pending).toBe(res.total - res.completed);
    });

    it("scenario 2: full settlement (1 loan, 1 full repayment)", () => {
      const txs = [
        { amount: 5000, status: "pending", type: "" },
        { amount: 5000, status: "completed", type: "repayment" },
      ];
      const res = calculatePersonStats(txs as any);
      expect(res.total).toBe(5000);
      expect(res.completed).toBe(5000);
      expect(res.pending).toBe(0);
      expect(res.advance).toBe(0);
    });

    it("scenario 3: multiple partial settlements (1 loan, 3 repayments)", () => {
      const txs = [
        { amount: 10000, status: "pending", type: "" },
        { amount: 2000, status: "completed", type: "repayment" },
        { amount: 3000, status: "completed", type: "repayment" },
        { amount: 1500, status: "completed", type: "repayment" },
      ];
      const res = calculatePersonStats(txs as any);
      expect(res.total).toBe(10000);
      expect(res.completed).toBe(6500);
      expect(res.pending).toBe(3500);
      expect(res.advance).toBe(0);
      expect(res.pending).toBe(res.total - res.completed);
    });

    it("scenario 4: overpayment / advance (repayments > loan)", () => {
      const txs = [
        { amount: 5000, status: "pending", type: "" },
        { amount: 6000, status: "completed", type: "repayment" },
      ];
      const res = calculatePersonStats(txs as any);
      expect(res.total).toBe(5000);
      expect(res.completed).toBe(6000);
      expect(res.pending).toBe(0);
      expect(res.advance).toBe(1000);
    });

    it("scenario 5: legacy rows with remarks 'Settlement received'", () => {
      const txs = [
        { amount: 1540, status: "pending", remarks: "Dinner share", type: "" },
        {
          amount: 540,
          status: "completed",
          remarks: "Settlement received: ₹540.00 via GPay",
          type: "",
        },
      ];
      const res = calculatePersonStats(txs as any);
      expect(res.total).toBe(1540);
      expect(res.completed).toBe(540);
      expect(res.pending).toBe(1000);
      expect(res.advance).toBe(0);
    });

    it("scenario 6: legacy completed loan without repayment is not counted as pending", () => {
      const txs = [
        { amount: 2500, status: "completed", remarks: "Old loan settled years ago", type: "" },
      ];
      const res = calculatePersonStats(txs as any);
      expect(res.total).toBe(2500);
      expect(res.completed).toBe(2500);
      expect(res.pending).toBe(0);
      expect(res.advance).toBe(0);
    });

    it("scenario 7: deleting or editing a repayment cleanly recomputes totals", () => {
      const initialTxs = [
        { amount: 8000, status: "pending", type: "" },
        { amount: 3000, status: "completed", type: "repayment" },
      ];
      let res = calculatePersonStats(initialTxs as any);
      expect(res.pending).toBe(5000);

      // Edit repayment from 3000 to 4000
      const editedTxs = [
        { amount: 8000, status: "pending", type: "" },
        { amount: 4000, status: "completed", type: "repayment" },
      ];
      res = calculatePersonStats(editedTxs as any);
      expect(res.pending).toBe(4000);
      expect(res.completed).toBe(4000);

      // Delete repayment
      const afterDelete = [{ amount: 8000, status: "pending", type: "" }];
      res = calculatePersonStats(afterDelete as any);
      expect(res.pending).toBe(8000);
      expect(res.completed).toBe(0);
    });

    it("ignores cancelled transactions", () => {
      const txs = [
        {
          _id: "1",
          amount: 2000,
          remarks: "valid",
          status: "pending",
          type: "",
        },
        {
          _id: "2",
          amount: 9000,
          remarks: "cancelled",
          status: "cancelled",
          type: "",
        },
      ];
      const result = calculatePersonStats(txs as any);
      expect(result.transactionCount).toBe(1);
      expect(result.total).toBe(2000);
      expect(result.pending).toBe(2000);
      expect(result.completed).toBe(0);
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
