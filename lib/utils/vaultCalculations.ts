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
