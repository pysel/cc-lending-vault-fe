// Bot API Types
// This file defines the types for bot-managed share calculations

export interface BotUserInfo {
  userAddress: string;
  token: string;
  shares: string;
  withdrawableAmount: string;
  yieldEarned: string;
  depositAmount: string;
  percentageOfVault: number;
  lastUpdated: number;
}

export interface BotVaultMetrics {
  token: string;
  totalShares: string;
  sharePrice: string;
  currentATokenBalance: string;
  totalYieldEarned: string;
  totalDeposits: string;
  currentAllocation: string;
  currentAPY: string;
  crossChainAllocations: {
    chain: string;
    amount: string;
    percentage: number;
  }[];
}

export interface BotPortfolioSummary {
  userAddress: string;
  totalValueUSD: string;
  totalYieldEarned: string;
  positions: {
    token: string;
    valueUSD: string;
    yieldEarned: string;
    percentageOfPortfolio: number;
  }[];
  lastUpdated: number;
}

export interface BotHealthStatus {
  isHealthy: boolean;
  lastUpdate: number;
  crossChainSyncStatus: {
    chain: string;
    isHealthy: boolean;
    lastSync: number;
  }[];
}
