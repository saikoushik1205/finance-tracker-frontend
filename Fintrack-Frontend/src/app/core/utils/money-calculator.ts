import { Person, PersonStats, Transaction, DashboardStats } from "../../models/app.models";

/**
 * Centralized Money Calculation Utility for FinTrack
 * All arithmetic uses integer paise (1 Rupee = 100 Paise) to avoid floating-point errors.
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
 * Calculates person/ledger statistics from their transactions.
 * Strict Invariant Enforced: Pending === Total - Completed (Returned)
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

  let totalPaise = 0;
  let explicitCompletedPaise = 0;
  let explicitPendingPaise = 0;
  let partialPaise = 0;

  for (const t of activeTransactions) {
    const amtPaise = toPaise(t.amount);
    totalPaise += amtPaise;

    if (t.status === "completed") {
      explicitCompletedPaise += amtPaise;
    } else if (t.status === "pending") {
      explicitPendingPaise += amtPaise;
    } else if (t.status === "partial") {
      partialPaise += amtPaise;
    }
  }

  let completedPaise = explicitCompletedPaise + partialPaise;
  let pendingPaise = explicitPendingPaise;

  // Strict invariant: Pending = Total - Completed
  if (totalPaise > 0) {
    if (completedPaise === 0 && pendingPaise > 0 && pendingPaise < totalPaise) {
      // Reconcile missing returned amount
      completedPaise = totalPaise - pendingPaise;
    } else {
      pendingPaise = Math.max(0, totalPaise - completedPaise);
    }
  } else {
    completedPaise = 0;
    pendingPaise = 0;
  }

  return {
    transactionCount: activeTransactions.length,
    total: fromPaise(totalPaise),
    completed: fromPaise(completedPaise),
    pending: fromPaise(pendingPaise),
  };
}

/**
 * Reconciles an existing PersonStats object (e.g. from backend response)
 * to strictly enforce: Pending === Total - Completed.
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
 * Aggregates summary totals across a list of persons.
 * Invariant Enforced: Total === Completed (Returned) + Pending
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
 * - Net Receivable: Pending Lent - Pending Borrowed
 * - Cash Position: Liquid funds in Cash + Bank
 * - Net Worth: Cash Position + Total Earnings - Total Expenses + Net Receivable
 */
export function calculateFinancialMetrics(stats: DashboardStats | null | undefined): {
  netReceivable: number;
  cashPosition: number;
  netWorth: number;
} {
  if (!stats) {
    return { netReceivable: 0, cashPosition: 0, netWorth: 0 };
  }

  const pendingLentPaise = toPaise(stats.lending?.pending || 0);
  const pendingBorrowedPaise = toPaise(stats.borrowing?.pending || 0);
  const netReceivablePaise = pendingLentPaise - pendingBorrowedPaise;

  const cashPaise = toPaise(stats.cashBank?.cash || 0);
  const bankPaise = toPaise(stats.cashBank?.bank || 0);
  const cashPositionPaise = cashPaise + bankPaise;

  const earningsPaise = toPaise(stats.earnings?.completed || 0);
  const expensesPaise = toPaise(stats.expenses?.completed || 0);

  const netWorthPaise = cashPositionPaise + earningsPaise - expensesPaise + netReceivablePaise;

  return {
    netReceivable: fromPaise(netReceivablePaise),
    cashPosition: fromPaise(cashPositionPaise),
    netWorth: fromPaise(netWorthPaise),
  };
}
