export interface VaultData {
  // Token information
  tokenId?: string;
  tokenSymbol?: string;
  tokenName?: string;
  tokenIcon?: string;
  tokenDecimals: number;

  // Vault metrics (from bot)
  currentATokenBalance: bigint;
  totalYieldEarned: bigint;
  totalDeposits: bigint;
  currentAllocation: string;
  currentAPY: bigint;
  sharePrice: bigint;
  totalShares: bigint;

  // Cross-chain data
  crossChainAllocations: {
    chain: string;
    amount: string;
    percentage: number;
  }[];

  // User data (from bot)
  userWithdrawableAmount?: bigint;
  userYieldAmount?: bigint;
  userDepositAmount?: bigint;
  userShares?: bigint;
  percentageOfVault?: number;
  hasUserPosition?: boolean;

  // Metadata
  lastUpdated: number;
  isFromBot: boolean;
}
