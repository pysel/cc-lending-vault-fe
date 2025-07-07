// Multi-Vault Data Hook - Static Vault List + Bot User Data
// This hook uses TOKEN_TO_VAULT_MAP for vault listing and bot APIs for user data with unified VaultData interface
// Token IDs are normalized by the bot API client to ensure proper matching between vault tokens and user positions
// Updated: Added safe conversion of percentage strings to basis points for currentAPY

import { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { TOKEN_TO_VAULT_MAP, findTokenByAggregatedAssetId } from '@/lib/constants';
import { botApi } from '@/lib/api/bot';
import type { VaultData } from '@/lib/types/vault';
import type { BotUserInfo } from '@/lib/types/bot';
import { percentageStringToBasisPoints } from '@/lib/utils/conversions';

export interface MultiVaultDataState {
  vaultsWithPositions: VaultData[];
  allVaults: VaultData[];
  loading: boolean;
  error: string | null;
}

export const useMultiVaultData = (userAddress?: string | null) => {
  const { authenticated } = usePrivy();
  const [state, setState] = useState<MultiVaultDataState>({
    vaultsWithPositions: [],
    allVaults: [],
    loading: false,
    error: null,
  });

  const fetchVaultData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Get available vaults from static mapping
      const availableTokens = Object.keys(TOKEN_TO_VAULT_MAP);

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

      // Process each available vault
      for (const tokenId of availableTokens) {
        const tokenInfo = findTokenByAggregatedAssetId(tokenId);
        if (!tokenInfo) continue;

        try {
          // Fetch vault metrics from bot
          const vaultMetrics = await botApi.getVaultMetrics(tokenId);

          // Find user position for this vault (token IDs are now normalized by bot API client)
          const userPosition = userPositions.find(pos => pos.token === tokenId);

          const vaultData: VaultData = {
            tokenId,
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
        } catch (vaultError) {
          console.warn(`Failed to fetch metrics for vault ${tokenId}:`, vaultError);
          // Continue with other vaults
        }
      }

      setState(prev => ({
        ...prev,
        vaultsWithPositions,
        allVaults: allVaultsData,
        loading: false,
      }));
    } catch (error) {
      console.error('Failed to fetch vault data:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch vault data',
        loading: false,
      }));
    }
  }, [userAddress, authenticated]);

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    fetchVaultData();

    const interval = setInterval(fetchVaultData, 30000);
    return () => clearInterval(interval);
  }, [fetchVaultData]);

  return {
    ...state,
    refetch: fetchVaultData,
  };
};
