// Multi-Vault Data Hook - Consolidated VaultData type
// This hook fetches data for all vaults from bot APIs using unified VaultData interface
// Updated: Added safe conversion of percentage strings to basis points for currentAPY

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

  const fetchBotMultiVaultData = useCallback(async () => {
    // Only wait for userAddress if we're authenticated but userAddress is explicitly undefined (not null)
    if (authenticated && userAddress === undefined) {
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Fetch all vault metrics from bot in one call (more efficient)
      const allVaultMetrics = await botApi.getAllVaultMetrics();

      let userPositions: BotUserInfo[] = [];

      // Fetch user positions if user address is provided
      if (userAddress && authenticated) {
        try {
          userPositions = await botApi.getUserPositions(userAddress);
        } catch (userError) {
          console.warn('Failed to fetch user positions from bot:', userError);
          // Continue without user data
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

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    fetchBotMultiVaultData();

    const interval = setInterval(fetchBotMultiVaultData, 120 * 1000);
    return () => clearInterval(interval);
  }, [fetchBotMultiVaultData]);

  return {
    ...state,
    refetch: fetchBotMultiVaultData,
  };
};
