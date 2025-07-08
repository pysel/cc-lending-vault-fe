/**
 * Withdrawal-specific types and interfaces
 * Used by the withdrawal component and hook
 */

import { Asset } from './assets';

/**
 * Withdrawal request structure for the custom withdrawal hook
 */
export interface WithdrawCustomRequest {
  selectedToken: Asset;
  amount: string;
  targetChain: string;
  recipientAddress: string;
}

/**
 * OneBalance withdrawal quote request structure
 * Following the "Aggregated Token to Chain-Specific Token with Custom Recipient" pattern
 */
export interface OneBalanceWithdrawQuoteRequest {
  from: {
    account: {
      sessionAddress: string;
      adminAddress: string;
      accountAddress: string;
    };
    asset: {
      assetId: string; // Aggregated asset ID (e.g., "ob:usdc")
    };
    amount: string; // Amount in wei
  };
  to: {
    asset: {
      assetId: string; // Chain-specific asset ID (e.g., "eip155:8453/erc20:0x...")
    };
    account: string; // Recipient address in CAIP format (e.g., "eip155:8453:0x...")
  };
}

/**
 * Withdrawal transaction status
 */
export interface WithdrawTransactionStatus {
  quoteId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  hash?: string;
  chainId?: number;
  explorerUrl?: string;
}

/**
 * Withdrawal state for the custom hook
 */
export interface WithdrawCustomState {
  quote: any | null;
  preparedQuoteData: {
    preparedQuote: any;
    callRequest: any;
    expirationTimestamp?: number;
  } | null;
  status: WithdrawTransactionStatus | null;
  loading: boolean;
  error: string | null;
  isPolling: boolean;
  timeLeft: number;
  executionSuccess: boolean;
  pollingTimeout: boolean;
  completedStatus: any | null;
}

/**
 * Address validation result
 */
export interface AddressValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Chain display information
 */
export interface ChainDisplayInfo {
  name: string;
  logoUrl: string | null;
}

/**
 * Withdrawal dialog props
 */
export interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Chain selection props
 */
export interface ChainSelectProps {
  selectedChain: string | null;
  setSelectedChain: (chainId: string) => void;
  placeholder?: string;
}
