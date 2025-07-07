// Vault Data Hook - Consolidated VaultData type
// This hook fetches vault data from bot APIs with a single unified VaultData interface
// Updated: Added safe conversion of percentage strings to basis points for currentAPY

import { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { botApi } from '@/lib/api/bot';
import { BotUserInfo } from '@/lib/types/bot';
import { findTokenByAggregatedAssetId } from '@/lib/constants';
import type { VaultData } from '@/lib/types/vault';
import { percentageStringToBasisPoints } from '@/lib/utils/conversions';

export interface VaultDataState {
  data: VaultData | null;
  loading: boolean;
  error: string | null;
  botHealthy: boolean;
}

export const useVaultData = (userAddress?: string, tokenId: string = 'ob:usdc') => {
  const { authenticated } = usePrivy();
  const [state, setState] = useState<VaultDataState>({
    data: null,
    loading: false,
    error: null,
    botHealthy: true,
  });

  const fetchBotVaultData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Get token information
      const tokenInfo = findTokenByAggregatedAssetId(tokenId);
      if (!tokenInfo) {
        throw new Error('Token not found');
      }

      // Fetch vault metrics from bot
      const vaultMetrics = await botApi.getVaultMetrics(tokenId);

      let userInfo: BotUserInfo | null = null;

      // Fetch user-specific data if user address is provided
      if (userAddress && authenticated) {
        try {
          userInfo = await botApi.getUserInfo(userAddress, tokenId);
        } catch (userError) {
          console.warn('Failed to fetch user-specific bot data:', userError);
          // Continue without user data
        }
      }

      // Convert string values to bigint for component compatibility
      const vaultData: VaultData = {
        tokenId,
        tokenSymbol: tokenInfo.symbol,
        tokenName: tokenInfo.name || tokenInfo.symbol,
        tokenIcon: tokenInfo.icon,
        tokenDecimals: tokenInfo.decimals,

        // Vault metrics
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
        userWithdrawableAmount: userInfo ? BigInt(userInfo.withdrawableAmount) : undefined,
        userYieldAmount: userInfo ? BigInt(userInfo.yieldEarned) : undefined,
        userDepositAmount: userInfo ? BigInt(userInfo.depositAmount) : undefined,
        userShares: userInfo ? BigInt(userInfo.shares) : undefined,
        percentageOfVault: userInfo?.percentageOfVault,
        hasUserPosition: userInfo ? BigInt(userInfo.shares) > 0n : false,

        // Metadata
        lastUpdated: userInfo?.lastUpdated || Date.now(),
        isFromBot: true,
      };

      setState(prev => ({
        ...prev,
        data: vaultData,
        loading: false,
        botHealthy: true,
      }));
    } catch (error) {
      console.error('Failed to fetch bot vault data:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch bot vault data',
        loading: false,
        botHealthy: false,
      }));
    }
  }, [userAddress, tokenId, authenticated]);

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    fetchBotVaultData();

    const interval = setInterval(fetchBotVaultData, 30000);
    return () => clearInterval(interval);
  }, [fetchBotVaultData]);

  return {
    ...state,
    refetch: fetchBotVaultData,
  };
};
