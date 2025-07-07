import { formatUnits, parseUnits } from 'viem';

export const formatTokenAmount = (amount: string, decimals: number): string => {
  try {
    return formatUnits(BigInt(amount), decimals);
  } catch (error) {
    console.error('Error formatting token amount:', error);
    return '0';
  }
};

export const parseTokenAmount = (amount: string, decimals: number): string => {
  try {
    return parseUnits(amount, decimals).toString();
  } catch (error) {
    console.error('Error parsing token amount:', error);
    return '0';
  }
};

/**
 * Convert token symbol to aggregated asset ID format
 * @param symbol - Token symbol (e.g., 'USDT', 'USDC')
 * @returns Aggregated asset ID (e.g., 'ob:usdt', 'ob:usdc')
 */
export const symbolToAggregatedAssetId = (symbol: string): string => {
  if (!symbol || typeof symbol !== 'string') {
    console.warn('Invalid symbol provided to symbolToAggregatedAssetId:', symbol);
    return 'ob:unknown';
  }
  return `ob:${symbol.toLowerCase().trim()}`;
};

/**
 * Convert aggregated asset ID to token symbol
 * @param aggregatedAssetId - Aggregated asset ID (e.g., 'ob:usdt', 'ob:usdc')
 * @returns Token symbol (e.g., 'USDT', 'USDC')
 */
export const aggregatedAssetIdToSymbol = (aggregatedAssetId: string): string => {
  if (!aggregatedAssetId || typeof aggregatedAssetId !== 'string') {
    console.warn(
      'Invalid aggregatedAssetId provided to aggregatedAssetIdToSymbol:',
      aggregatedAssetId
    );
    return 'UNKNOWN';
  }

  const trimmed = aggregatedAssetId.trim();
  if (!trimmed.startsWith('ob:')) {
    console.warn('Invalid aggregated asset ID format:', aggregatedAssetId);
    return trimmed.toUpperCase();
  }

  return trimmed.replace('ob:', '').toUpperCase();
};

/**
 * Normalize token identifier to aggregated asset ID format
 * Handles both symbol and aggregated asset ID inputs
 * @param token - Token identifier (symbol or aggregated asset ID)
 * @returns Normalized aggregated asset ID
 */
export const normalizeTokenId = (token: string): string => {
  if (!token || typeof token !== 'string') {
    console.warn('Invalid token provided to normalizeTokenId:', token);
    return 'ob:unknown';
  }

  const trimmed = token.trim();

  // If already in aggregated asset ID format, return as is
  if (trimmed.startsWith('ob:')) {
    return trimmed;
  }

  // Otherwise, convert from symbol to aggregated asset ID
  return symbolToAggregatedAssetId(trimmed);
};
