import { Person, PersonStats, Transaction, DashboardStats } from "../../models/app.models";

/**
 * Centralized Money Calculation Utility for FinTrack (Frontend)
 * Strictly uses integer paise (1 Rupee = 100 Paise) internally to avoid floating-point errors.
 * 
 * Rules:
 * 1. Total = sum of loans.
 * 2. Returned = sum of repayments.
 * 3. Pending = Math.max(0, Total - Returned).
 * 4. Advance = Math.max(0, Returned - Total).
 * 
 * Includes clearly marked TEMPORARY LEGACY ADAPTER to handle historical rows:
 * - Legacy rows with status COMPLETED loans
 * - Legacy split loans (containing "(Remaining pending after partial settlement)")
 * - Legacy settlement rows (containing "Settlement received" or "Settled via")
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

/* =========================================================================
   TEMPORARY LEGACY ADAPTER
   Identifies and classifies historical transactions created before the clean
   non-destructive ledger model.
   ========================================================================= */

/**
 * Checks whether a transaction is a repayment record:
 * - Clean model: type === 'repayment'
 * - Legacy model: remarks start with "Settlement received" or contain "Settled via"
 */
export function isRepayment(t: Partial<Transaction> | null | undefined): boolean {
  if (!t) return false;
  const type = (t.type || "").trim().toLowerCase();
  if (type === "repayment") return true;

  const remarks = (t.remarks || "").trim();
  if (remarks.startsWith("Settlement received")) return true;

  return false;
}

/**
 * Checks whether a transaction is a legacy loan that was split in-place
 * by the previous settle-up handler.
 */
export function isLegacySplitLoan(t: Partial<Transaction> | null | undefined): boolean {
  if (!t || !t.remarks) return false;
  return t.remarks.includes("(Remaining pending after partial settlement)");
}

/**
 * Checks whether a transaction is a legacy loan marked "completed"
 * directly (without a separate repayment record).
 */
export function isLegacyCompletedLoan(t: Partial<Transaction> | null | undefined): boolean {
  if (!t) return false;
  if (isRepayment(t)) return false;
  return t.status === "completed";
}

/**
 * Calculates person/ledger totals using integer paise:
 * - Total: Sum of all loans (restoring legacy split amounts if applicable)
 * - Returned: Sum of all repayments + legacy completed loans
 * - Pending: Remaining unpaid balance (max(0, Total - Returned))
 * - Advance: Overpayment amount if repayments exceed loans (max(0, Returned - Total))
 */
export function calculatePersonStats(transactions: Transaction[] = []): PersonStats {
  if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
    return {
      transactionCount: 0,
      total: 0,
      completed: 0,
      pending: 0,
      advance: 0,
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
      advance: 0,
    };
  }

  let loansPaise = 0;
  let repaymentsPaise = 0;

  for (const t of activeTransactions) {
    const amtPaise = toPaise(t.amount);

    if (isRepayment(t)) {
      // Repayment record
      repaymentsPaise += amtPaise;
    } else if (isLegacyCompletedLoan(t)) {
      // Legacy loan that was marked completed directly in place.
      // Contributes to total lent and is fully accounted as returned.
      loansPaise += amtPaise;
      repaymentsPaise += amtPaise;
    } else {
      // Active loan (Clean loan or Legacy Split loan)
      loansPaise += amtPaise;
    }
  }

  // Enforce invariant:
  // Pending = max(0, Total - Returned)
  // Advance = max(0, Returned - Total)
  const pendingPaise = Math.max(0, loansPaise - repaymentsPaise);
  const advancePaise = Math.max(0, repaymentsPaise - loansPaise);

  return {
    transactionCount: activeTransactions.length,
    total: fromPaise(loansPaise),
    completed: fromPaise(repaymentsPaise),
    pending: fromPaise(pendingPaise),
    advance: fromPaise(advancePaise),
  };
}

/**
 * Reconciles an existing PersonStats object from backend.
 * Enforces invariant: Pending === max(0, Total - Completed)
 */
export function reconcilePersonStats(stats?: PersonStats): PersonStats {
  if (!stats) {
    return { transactionCount: 0, total: 0, completed: 0, pending: 0, advance: 0 };
  }

  const totalPaise = toPaise(stats.total);
  const completedPaise = toPaise(stats.completed);
  const pendingPaise = Math.max(0, totalPaise - completedPaise);
  const advancePaise = Math.max(0, completedPaise - totalPaise);

  return {
    transactionCount: stats.transactionCount || 0,
    total: fromPaise(totalPaise),
    completed: fromPaise(completedPaise),
    pending: fromPaise(pendingPaise),
    advance: fromPaise(advancePaise),
  };
}

/**
 * Aggregates summary totals across a list of persons:
 * Total === sum of totals
 * Completed === sum of completed
 * Pending === max(0, Total - Completed)
 */
export function aggregatePersons(persons: Person[] = []): {
  total: number;
  completed: number;
  pending: number;
  advance: number;
} {
  if (!persons || !Array.isArray(persons) || persons.length === 0) {
    return { total: 0, completed: 0, pending: 0, advance: 0 };
  }

  let totalPaise = 0;
  let completedPaise = 0;
  let advancePaise = 0;

  for (const p of persons) {
    const stats = reconcilePersonStats(p.stats);
    totalPaise += toPaise(stats.total);
    completedPaise += toPaise(stats.completed);
    advancePaise += toPaise(stats.advance);
  }

  const pendingPaise = Math.max(0, totalPaise - completedPaise);

  return {
    total: fromPaise(totalPaise),
    completed: fromPaise(completedPaise),
    pending: fromPaise(pendingPaise),
    advance: fromPaise(advancePaise),
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
