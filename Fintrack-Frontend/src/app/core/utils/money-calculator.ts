import { Person, PersonStats, Transaction, DashboardStats } from "../../models/app.models";

/**
 * Centralized Money Calculation Utility for FinTrack
 * All arithmetic uses integer paise (1 Rupee = 100 Paise) to avoid floating-point errors.
 * Supported transaction statuses: Pending and Completed (Returned).
 */

/**
 * Converts a rupee amount (or float) to integer paise.
 */
export function toPaise(amount: number | null | undefined): number {
  if (amount === null || amount === undefined || isNaN(amount)) return 0;
  return Math.round(Number(amount) * 100);
}

/**
 * Converts integer paise back to rupees with 2 decimal precision.
 */
export function fromPaise(paise: number | null | undefined): number {
  if (paise === null || paise === undefined || isNaN(paise)) return 0;
  return Number((paise / 100).toFixed(2));
}

/**
 * Single source of truth currency formatter with Indian number formatting (e.g., ₹1,01,759.00 or ₹1,01,759)
 */
export function formatCurrency(
  amount: number | null | undefined,
  includeDecimals: boolean = false
): string {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(value);
}

/**
 * Checks whether a transaction is a settlement / repayment
 */
export function isSettlementTransaction(t: Transaction | any): boolean {
  if (!t) return false;
  const type = (t.type || "").trim().toLowerCase();
  if (type === "repayment") return true;
  const remarks = (t.remarks || "").trim();
  if (
    remarks.startsWith("Settlement received") ||
    remarks.startsWith("Settlement repaid") ||
    remarks.startsWith("Settlement paid") ||
    remarks.includes("Settled via") ||
    remarks.includes("Repaid via")
  ) {
    return true;
  }
  return false;
}

/**
 * Calculates person/ledger statistics from their transactions.
 * Strict Invariant: Pending === Total - Completed (Returned)
 */
export function calculatePersonStats(transactions: Transaction[] = []): PersonStats {
  if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
    return {
      transactionCount: 0,
      total: 0,
      completed: 0,
      pending: 0,
    };
  }

  // Filter out cancelled transactions
  const activeTransactions = transactions.filter((t) => t.status !== "cancelled");
  if (activeTransactions.length === 0) {
    return {
      transactionCount: 0,
      total: 0,
      completed: 0,
      pending: 0,
    };
  }

  let loansPaise = 0;
  let settlementsPaise = 0;
  let legacyCompletedPaise = 0;

  for (const t of activeTransactions) {
    const amtPaise = toPaise(t.amount);

    if (isSettlementTransaction(t)) {
      settlementsPaise += amtPaise;
    } else {
      loansPaise += amtPaise;
      if (t.status === "completed" || (t.status as string) === "partial") {
        legacyCompletedPaise += amtPaise;
      }
    }
  }

  const completedPaise = settlementsPaise + legacyCompletedPaise;
  const pendingPaise = Math.max(0, loansPaise - completedPaise);

  return {
    transactionCount: activeTransactions.length,
    total: fromPaise(loansPaise),
    completed: fromPaise(completedPaise),
    pending: fromPaise(pendingPaise),
  };
}

/**
 * Reconciles an existing PersonStats object from backend.
 * Strict Invariant: Pending === Total - Completed
 */
export function reconcilePersonStats(stats?: PersonStats): PersonStats {
  if (!stats) {
    return { transactionCount: 0, total: 0, completed: 0, pending: 0 };
  }

  const totalPaise = toPaise(stats.total);
  let completedPaise = toPaise(stats.completed);
  let pendingPaise = toPaise(stats.pending);

  if (totalPaise > 0) {
    if (completedPaise === 0 && pendingPaise > 0 && pendingPaise < totalPaise) {
      completedPaise = totalPaise - pendingPaise;
    } else {
      pendingPaise = Math.max(0, totalPaise - completedPaise);
    }
  } else {
    completedPaise = 0;
    pendingPaise = 0;
  }

  return {
    transactionCount: stats.transactionCount || 0,
    total: fromPaise(totalPaise),
    completed: fromPaise(completedPaise),
    pending: fromPaise(pendingPaise),
  };
}

/**
 * Aggregates summary totals across a list of persons:
 * Total === Completed + Pending
 */
export function aggregatePersons(persons: Person[] = []): {
  total: number;
  completed: number;
  pending: number;
} {
  if (!persons || !Array.isArray(persons) || persons.length === 0) {
    return { total: 0, completed: 0, pending: 0 };
  }

  let totalPaise = 0;
  let completedPaise = 0;

  for (const p of persons) {
    const stats = reconcilePersonStats(p.stats);
    totalPaise += toPaise(stats.total);
    completedPaise += toPaise(stats.completed);
  }

  const pendingPaise = Math.max(0, totalPaise - completedPaise);

  return {
    total: fromPaise(totalPaise),
    completed: fromPaise(completedPaise),
    pending: fromPaise(pendingPaise),
  };
}

/**
 * Calculates high-level financial metrics for the Dashboard:
 * - Net Balance: Pending Lent - Pending Borrowed
 */
export function calculateFinancialMetrics(stats: DashboardStats | null | undefined): {
  netBalance: number;
  netReceivable: number;
  cashPosition: number;
  netWorth: number;
} {
  if (!stats) {
    return { netBalance: 0, netReceivable: 0, cashPosition: 0, netWorth: 0 };
  }

  const pendingLentPaise = toPaise(stats.lending?.pending || 0);
  const pendingBorrowedPaise = toPaise(stats.borrowing?.pending || 0);
  const netBalancePaise = pendingLentPaise - pendingBorrowedPaise;

  const cashPaise = toPaise(stats.cashBank?.cash || 0);
  const bankPaise = toPaise(stats.cashBank?.bank || 0);
  const cashPositionPaise = cashPaise + bankPaise;

  const earningsPaise = toPaise(stats.earnings?.completed || 0);
  const expensesPaise = toPaise(stats.expenses?.completed || 0);

  const netWorthPaise = cashPositionPaise + earningsPaise - expensesPaise + netBalancePaise;

  return {
    netBalance: fromPaise(netBalancePaise),
    netReceivable: fromPaise(netBalancePaise),
    cashPosition: fromPaise(cashPositionPaise),
    netWorth: fromPaise(netWorthPaise),
  };
}
