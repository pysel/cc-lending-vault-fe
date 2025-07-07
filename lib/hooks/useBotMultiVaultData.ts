// Updated: Fixed user address handling and standardized refresh intervals to prevent stale data
// This hook is the single source of truth for all vault data from bot APIs using unified VaultData interface
//
// STALE DATA FIXES IMPLEMENTED:
// 1. User address dependency chain: Waits for stable user address before fetching
// 2. Authentication state reset: Clears user data when authentication changes
// 3. Standardized refresh intervals: All data fetching uses 30-second intervals
// 4. Error handling: Continues without user data rather than failing completely
// 5. Race condition prevention: Proper state management during auth transitions
//
// This replaces the old useMultiVaultData hook to eliminate duplicate data sources

import { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { botApi } from '@/lib/api/bot';
import type { VaultData } from '@/lib/types/vault';
import { BotUserInfo } from '@/lib/types/bot';
import { findTokenByAggregatedAssetId } from '@/lib/constants';
import { percentageStringToBasisPoints } from '@/lib/utils/conversions';

export interface MultiVaultDataState {
  vaultsWithPositions: VaultData[];
  allVaults: VaultData[];
  loading: boolean;
  error: string | null;
  botHealthy: boolean;
}

export const useBotMultiVaultData = (userAddress?: string | null) => {
  const { authenticated } = usePrivy();
  const [state, setState] = useState<MultiVaultDataState>({
    vaultsWithPositions: [],
    allVaults: [],
    loading: false,
    error: null,
    botHealthy: true,
  });

  // Clear user data when authentication state changes
  useEffect(() => {
    if (!authenticated) {
      setState(prev => ({
        ...prev,
        vaultsWithPositions: prev.allVaults.map(vault => ({
          ...vault,
          userWithdrawableAmount: undefined,
          userYieldAmount: undefined,
          userDepositAmount: undefined,
          userShares: undefined,
          percentageOfVault: undefined,
          hasUserPosition: false,
        })),
      }));
    }
  }, [authenticated]);

  const fetchBotMultiVaultData = useCallback(async () => {
    // Don't fetch if we're waiting for user address to be resolved
    if (authenticated && userAddress === undefined) {
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Fetch all vault metrics from bot in one call (more efficient)
      const allVaultMetrics = await botApi.getAllVaultMetrics();

      let userPositions: BotUserInfo[] = [];

      // Fetch user positions if user address is provided and authenticated
      if (userAddress && authenticated) {
        try {
          userPositions = await botApi.getUserPositions(userAddress);
        } catch (userError) {
          console.warn('Failed to fetch user positions from bot:', userError);
          // Continue without user data rather than failing completely
        }
      }

      const allVaultsData: VaultData[] = [];
      const vaultsWithPositions: VaultData[] = [];

      // Process each vault
      for (const vaultMetrics of allVaultMetrics) {
        const tokenInfo = findTokenByAggregatedAssetId(vaultMetrics.token);
        if (!tokenInfo) continue;

        // Find user position for this vault
        const userPosition = userPositions.find(pos => pos.token === vaultMetrics.token);

        const vaultData: VaultData = {
          tokenId: vaultMetrics.token,
          tokenSymbol: tokenInfo.symbol,
          tokenName: tokenInfo.name || tokenInfo.symbol,
          tokenIcon: tokenInfo.icon,
          tokenDecimals: tokenInfo.decimals,

          // Vault metrics from bot
          currentATokenBalance: BigInt(vaultMetrics.currentATokenBalance),
          totalYieldEarned: BigInt(vaultMetrics.totalYieldEarned),
          totalDeposits: BigInt(vaultMetrics.totalDeposits),
          currentAllocation: vaultMetrics.currentAllocation,
          currentAPY: percentageStringToBasisPoints(vaultMetrics.currentAPY),
          sharePrice: BigInt(vaultMetrics.sharePrice),
          totalShares: BigInt(vaultMetrics.totalShares),

          // Cross-chain allocations
          crossChainAllocations: vaultMetrics.crossChainAllocations,

          // User data
          userWithdrawableAmount: userPosition
            ? BigInt(userPosition.withdrawableAmount)
            : undefined,
          userYieldAmount: userPosition ? BigInt(userPosition.yieldEarned) : undefined,
          userDepositAmount: userPosition ? BigInt(userPosition.depositAmount) : undefined,
          userShares: userPosition ? BigInt(userPosition.shares) : undefined,
          percentageOfVault: userPosition?.percentageOfVault,
          hasUserPosition: userPosition ? BigInt(userPosition.shares) > 0n : false,

          // Metadata
          lastUpdated: userPosition?.lastUpdated || Date.now(),
          isFromBot: true,
        };

        allVaultsData.push(vaultData);

        // Add to positions list if user has shares
        if (vaultData.hasUserPosition) {
          vaultsWithPositions.push(vaultData);
        }
      }

      setState(prev => ({
        ...prev,
        vaultsWithPositions,
        allVaults: allVaultsData,
        loading: false,
        botHealthy: true,
      }));
    } catch (error) {
      console.error('Failed to fetch bot multi-vault data:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch bot vault data',
        loading: false,
        botHealthy: false,
      }));
    }
  }, [userAddress, authenticated]);

  // Standardized refresh interval of 30 seconds for consistent data sync
  useEffect(() => {
    fetchBotMultiVaultData();

    const interval = setInterval(fetchBotMultiVaultData, 30000);
    return () => clearInterval(interval);
  }, [fetchBotMultiVaultData]);

  return {
    ...state,
    refetch: fetchBotMultiVaultData,
  };
};
