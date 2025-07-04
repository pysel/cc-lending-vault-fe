import { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { parseAbi, createPublicClient, http } from 'viem';
import { arbitrum } from 'viem/chains';
import { TOKEN_TO_VAULT_MAP, findTokenByAggregatedAssetId } from '@/lib/constants';
import { VaultData, vaultAbi } from './useVaultData';

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

  const fetchMultiVaultData = useCallback(async () => {
    // Only wait for userAddress if we're authenticated but userAddress is explicitly undefined (not null)
    // If userAddress is null, it means we intentionally want to fetch without user data
    if (authenticated && userAddress === undefined) {
      return; // Wait for userAddress if authenticated and userAddress is not provided yet
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Create a public client for Arbitrum (where the vaults live)
      const client = createPublicClient({
        chain: arbitrum,
        transport: http(process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL),
      });

      const allVaultsData: VaultData[] = [];
      const vaultsWithPositions: VaultData[] = [];

      // Iterate through all tokens in TOKEN_TO_VAULT_MAP
      for (const [tokenId, vaultAddress] of Object.entries(TOKEN_TO_VAULT_MAP)) {
        try {
          const tokenInfo = findTokenByAggregatedAssetId(tokenId);
          if (!tokenInfo) continue;

          // Fetch general vault data
          const [
            currentATokenBalance,
            sharePrice,
            totalYieldEarned,
            totalShares,
            totalDeposits,
            currentAllocation,
            currentAPY,
          ] = await Promise.all([
            client.readContract({
              address: vaultAddress as `0x${string}`,
              abi: vaultAbi,
              functionName: 'getCurrentATokenBalance',
            }),
            client.readContract({
              address: vaultAddress as `0x${string}`,
              abi: vaultAbi,
              functionName: 'getSharePrice',
            }),
            client.readContract({
              address: vaultAddress as `0x${string}`,
              abi: vaultAbi,
              functionName: 'getTotalYieldEarned',
            }),
            client.readContract({
              address: vaultAddress as `0x${string}`,
              abi: vaultAbi,
              functionName: 'totalShares',
            }),
            client.readContract({
              address: vaultAddress as `0x${string}`,
              abi: vaultAbi,
              functionName: 'totalDeposits',
            }),
            client.readContract({
              address: vaultAddress as `0x${string}`,
              abi: vaultAbi,
              functionName: 'currentAllocation',
            }),
            client.readContract({
              address: vaultAddress as `0x${string}`,
              abi: vaultAbi,
              functionName: 'currentAPY',
            }),
          ]);

          let userShares: bigint = 0n;
          let userWithdrawableAmount: bigint = 0n;
          let userYieldAmount: bigint = 0n;
          let userDepositAmount: bigint = 0n;

          // Fetch user-specific data if user address is provided
          if (userAddress && authenticated) {
            try {
              [userShares, userWithdrawableAmount, userYieldAmount, userDepositAmount] =
                await Promise.all([
                  client.readContract({
                    address: vaultAddress as `0x${string}`,
                    abi: vaultAbi,
                    functionName: 'getUserShares',
                    args: [userAddress as `0x${string}`],
                  }),
                  client.readContract({
                    address: vaultAddress as `0x${string}`,
                    abi: vaultAbi,
                    functionName: 'getUserWithdrawableAmount',
                    args: [userAddress as `0x${string}`],
                  }),
                  client.readContract({
                    address: vaultAddress as `0x${string}`,
                    abi: vaultAbi,
                    functionName: 'getUserYieldAmount',
                    args: [userAddress as `0x${string}`],
                  }),
                  client.readContract({
                    address: vaultAddress as `0x${string}`,
                    abi: vaultAbi,
                    functionName: 'getUserDepositAmount',
                    args: [userAddress as `0x${string}`],
                  }),
                ]);
            } catch (userError) {
              console.warn(`Failed to fetch user data for ${tokenId}:`, userError);
              // Continue with zero values
            }
          }

          const vaultData: VaultData = {
            tokenId,
            tokenSymbol: tokenInfo.symbol,
            tokenName: tokenInfo.name || tokenInfo.symbol,
            tokenIcon: tokenInfo.icon,
            tokenDecimals: tokenInfo.decimals,
            vaultAddress,
            currentATokenBalance: currentATokenBalance as bigint,
            sharePrice: sharePrice as bigint,
            totalYieldEarned: totalYieldEarned as bigint,
            totalShares: totalShares as bigint,
            totalDeposits: totalDeposits as bigint,
            currentAllocation: currentAllocation as string,
            currentAPY: currentAPY as bigint,
            userShares,
            userWithdrawableAmount,
            userYieldAmount,
            userDepositAmount,
            hasUserPosition: userShares > 0n,
          };

          allVaultsData.push(vaultData);

          // Add to positions list if user has shares
          if (vaultData.hasUserPosition) {
            vaultsWithPositions.push(vaultData);
          }
        } catch (vaultError) {
          console.warn(`Failed to fetch data for vault ${tokenId}:`, vaultError);
        }
      }

      setState(prev => ({
        ...prev,
        vaultsWithPositions,
        allVaults: allVaultsData,
        loading: false,
      }));
    } catch (error) {
      console.error('Failed to fetch multi-vault data:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch vault data',
        loading: false,
      }));
    }
  }, [userAddress, authenticated]);

  useEffect(() => {
    fetchMultiVaultData();
  }, [fetchMultiVaultData]);

  return {
    ...state,
    refetch: fetchMultiVaultData,
  };
};
