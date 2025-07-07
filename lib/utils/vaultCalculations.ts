// Updated: Added hasUserPosition utility to standardize position detection across components

import type { VaultData } from '@/lib/types/vault';

/**
 * Calculate yield performance percentage
 * @param totalYieldEarned - Total yield earned in vault currency
 * @param totalDeposits - Total deposits in vault currency
 * @returns Formatted percentage string
 */
export const calculateYieldPerformance = (
  totalYieldEarned: bigint | undefined,
  totalDeposits: bigint | undefined
): string => {
  if (!totalYieldEarned || !totalDeposits || totalDeposits === 0n) {
    return '0.00%';
  }

  const performancePercent = (Number(totalYieldEarned) / Number(totalDeposits)) * 100;
  return `+${performancePercent.toFixed(2)}%`;
};

/**
 * Calculate total value locked across multiple vaults
 * @param vaults - Array of vault data
 * @param decimals - Token decimals for conversion
 * @returns Total value as number
 */
export const calculateTotalValueLocked = (
  vaults: Array<{ currentATokenBalance?: bigint; tokenDecimals?: number }>,
  decimals: number = 6
): number => {
  return vaults.reduce((total, vault) => {
    const tokenDecimals = vault.tokenDecimals || decimals;
    return total + Number(vault.currentATokenBalance || 0n) / Math.pow(10, tokenDecimals);
  }, 0);
};

/**
 * Calculate total cross-chain allocations summary
 * @param vaults - Array of bot vault data with cross-chain allocations
 * @returns Summary of cross-chain allocations
 */
export const calculateCrossChainSummary = (
  vaults: Array<{
    crossChainAllocations?: Array<{ chain: string; amount: string; percentage: number }>;
    tokenDecimals?: number;
  }>
): { totalChains: number; totalAllocated: number; chainBreakdown: Record<string, number> } => {
  const chainBreakdown: Record<string, number> = {};
  let totalAllocated = 0;
  const chainsUsed = new Set<string>();

  vaults.forEach(vault => {
    if (vault.crossChainAllocations) {
      vault.crossChainAllocations.forEach(allocation => {
        chainsUsed.add(allocation.chain);
        const amount = parseFloat(allocation.amount) / Math.pow(10, vault.tokenDecimals || 6);
        chainBreakdown[allocation.chain] = (chainBreakdown[allocation.chain] || 0) + amount;
        totalAllocated += amount;
      });
    }
  });

  return {
    totalChains: chainsUsed.size,
    totalAllocated,
    chainBreakdown,
  };
};

/**
 * Calculate average APY across multiple vaults
 * @param vaults - Array of vault data with APY
 * @returns Average APY as number
 */
export const calculateAverageAPY = (vaults: Array<{ currentAPY?: bigint }>): number => {
  if (vaults.length === 0) return 0;

  const totalAPY = vaults.reduce((total, vault) => {
    return total + Number(vault.currentAPY || 0n);
  }, 0);

  return totalAPY / (vaults.length * 100); // Convert from basis points
};

/**
 * Format address for display (first 6 and last 4 characters)
 * @param address - Full address string
 * @returns Formatted address string
 */
export const formatAddress = (address?: string): string => {
  if (!address) return 'Unknown';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Determines if a user has a position in a vault using multiple robust checks
 * This prevents inconsistencies between different components checking different fields
 */
export const hasUserPosition = (vaultData: VaultData): boolean => {
  // Use multiple indicators for robustness during data transitions
  const hasShares = vaultData.userShares && vaultData.userShares > 0n;
  const hasWithdrawable =
    vaultData.userWithdrawableAmount && Number(vaultData.userWithdrawableAmount) > 0;
  const flaggedAsHasPosition = vaultData.hasUserPosition === true;

  // Return true if ANY of these conditions are met to prevent flickering during updates
  return hasShares || hasWithdrawable || flaggedAsHasPosition;
};
