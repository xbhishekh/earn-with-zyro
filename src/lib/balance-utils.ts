/**
 * Centralized Balance Calculation Utilities
 * Ensures consistent balance calculations across the entire application
 */

interface Transaction {
  amount: number;
  type: string;
  status: string;
}

interface BalanceResult {
  available: number;
  pending: number;
  total: number;
}

// Transaction types that ADD to balance (positive credits)
const CREDIT_TYPES = [
  'payout',
  'deposit',
  'affiliate_commission',
  'referral_bonus',
  'product_sale',
  'transfer_in',
];

// Transaction types that SUBTRACT from balance (negative debits)
const DEBIT_TYPES = [
  'withdrawal',
  'deduction',
  'transfer_out',
];

// Transaction types that are pending (not yet available)
const PENDING_TYPE = 'pending_payout';

/**
 * Calculate all balance figures from transactions
 * This is the SINGLE source of truth for balance calculations
 */
export function calculateBalances(transactions: Transaction[]): BalanceResult {
  let available = 0;
  let pending = 0;
  let total = 0;

  transactions.forEach((tx) => {
    const amount = Number(tx.amount);
    const absAmount = Math.abs(amount);

    // Handle pending payouts separately
    if (tx.type === PENDING_TYPE) {
      if (tx.status === 'pending') {
        pending += absAmount;
      } else if (tx.status === 'available' || tx.status === 'paid') {
        available += absAmount;
        total += absAmount;
      }
      return;
    }

    // Credit types (add to balance)
    if (CREDIT_TYPES.includes(tx.type)) {
      if (tx.status === 'available' || tx.status === 'paid' || tx.status === 'completed') {
        available += absAmount;
      }
      // All credits count towards total earned (except transfers which are internal)
      if (tx.type !== 'transfer_in') {
        total += absAmount;
      }
      return;
    }

    // Debit types (subtract from balance)
    if (DEBIT_TYPES.includes(tx.type)) {
      // Deductions are stored as negative amounts, withdrawals as positive
      if (tx.type === 'deduction') {
        // Deductions are already negative in DB, so we add them (which subtracts)
        if (tx.status === 'available' || tx.status === 'paid' || tx.status === 'completed') {
          available += amount; // amount is already negative
        }
      } else if (tx.type === 'transfer_out') {
        // Transfer out is stored as negative
        if (tx.status === 'completed') {
          available += amount; // amount is already negative
        }
      } else if (tx.type === 'withdrawal') {
        // Withdrawals are positive amounts that should be subtracted
        if (tx.status !== 'rejected') {
          available -= absAmount;
        }
      }
      return;
    }
  });

  // Ensure non-negative values
  return {
    available: Math.max(0, available),
    pending: Math.max(0, pending),
    total: Math.max(0, total),
  };
}

/**
 * Calculate only the available balance (optimized for header display)
 */
export function calculateAvailableBalance(transactions: Transaction[]): number {
  return calculateBalances(transactions).available;
}

/**
 * Calculate earnings from views for a campaign
 */
export function calculateEarnings(
  views: number,
  rewardPer1kViews: number,
  minPayout?: number | null,
  maxPayout?: number | null
): number {
  let earnings = (views / 1000) * rewardPer1kViews;
  
  // Apply minimum threshold - if below minimum, earnings are 0
  if (minPayout && earnings < minPayout) {
    earnings = 0;
  }
  
  // Apply maximum cap
  if (maxPayout && earnings > maxPayout) {
    earnings = maxPayout;
  }
  
  return Math.round(earnings * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate seller earnings after platform fee (10%)
 */
export function calculateSellerEarnings(purchaseAmount: number): number {
  const platformFee = 0.10; // 10% platform fee
  return Math.round(purchaseAmount * (1 - platformFee) * 100) / 100;
}
