import { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { parseAbi, createPublicClient, http } from 'viem';
import { arbitrum } from 'viem/chains';
import { getVaultAddress, tokenList } from '@/lib/constants';

// Vault contract ABI updated for the refactored TokenYieldVault contract
export const vaultAbi = parseAbi([
  // Core vault metrics
  'function getCurrentATokenBalance() view returns (uint256)',
  'function getSharePrice() view returns (uint256)',
  'function getTotalYieldEarned() view returns (uint256)',
  'function totalShares() view returns (uint256)',
  'function totalDeposits() view returns (uint256)',
  'function currentAllocation() view returns (string)',
  'function currentAPY() view returns (uint256)',

  // Contract addresses
  'function bot() view returns (address)',
  'function token() view returns (address)',
  'function aToken() view returns (address)',

  // User-specific methods
  'function getUserWithdrawableAmount(address user) view returns (uint256)',
  'function getUserShares(address user) view returns (uint256)',
  'function getUserYieldAmount(address user) view returns (uint256)',
  'function getUserDepositAmount(address user) view returns (uint256)',

  // New calculation methods from refactored contract
  'function calculateSharesToMint(uint256 depositAmount) view returns (uint256)',
  'function calculateTokensForShares(uint256 shares) view returns (uint256)',
]);

export interface VaultData {
  // Token information
  tokenId?: string;
  tokenSymbol?: string;
  tokenName?: string;
  tokenIcon?: string;
  tokenDecimals: number;

  // Contract addresses
  vaultAddress?: string;
  botAddress?: string;
  tokenAddress?: string;
  aTokenAddress?: string;

  // Vault metrics
  currentATokenBalance: bigint;
  totalYieldEarned: bigint;
  totalDeposits: bigint;
  currentAllocation: string;
  currentAPY: bigint;

  // User data
  userWithdrawableAmount?: bigint;
  userYieldAmount?: bigint;
  userDepositAmount?: bigint;
  hasUserPosition?: boolean;

  // Internal bookkeeping (not displayed to users)
  sharePrice?: bigint;
  totalShares?: bigint;
  userShares?: bigint;
}

export interface VaultDataState {
  data: VaultData | null;
  loading: boolean;
  error: string | null;
}

export const useVaultData = (userAddress?: string, tokenId: string = 'ob:usdc') => {
  const { authenticated } = usePrivy();
  const [state, setState] = useState<VaultDataState>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchVaultData = useCallback(async () => {
    const vaultAddress = getVaultAddress(tokenId);
    if (!vaultAddress) {
      setState(prev => ({ ...prev, error: 'Vault not found for token' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Create a public client for Arbitrum (where the vault lives)
      const client = createPublicClient({
        chain: arbitrum,
        transport: http(process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL),
      });

      // Fetch general vault data
      const [
        currentATokenBalance,
        sharePrice,
        totalYieldEarned,
        totalShares,
        totalDeposits,
        currentAllocation,
        currentAPY,
        botAddress,
        tokenAddress,
        aTokenAddress,
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
        client.readContract({
          address: vaultAddress as `0x${string}`,
          abi: vaultAbi,
          functionName: 'bot',
        }),
        client.readContract({
          address: vaultAddress as `0x${string}`,
          abi: vaultAbi,
          functionName: 'token',
        }),
        client.readContract({
          address: vaultAddress as `0x${string}`,
          abi: vaultAbi,
          functionName: 'aToken',
        }),
      ]);

      let userShares: bigint | undefined;
      let userWithdrawableAmount: bigint | undefined;
      let userYieldAmount: bigint | undefined;
      let userDepositAmount: bigint | undefined;

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
          console.warn('Failed to fetch user-specific vault data:', userError);
          // Continue without user data
        }
      }

      const tokenDecimals =
        tokenList.find(token => token.aggregatedAssetId === tokenId)?.decimals || 18;

      const vaultData: VaultData = {
        currentATokenBalance: currentATokenBalance as bigint,
        sharePrice: sharePrice as bigint,
        totalYieldEarned: totalYieldEarned as bigint,
        totalShares: totalShares as bigint,
        totalDeposits: totalDeposits as bigint,
        currentAllocation: currentAllocation as string,
        currentAPY: currentAPY as bigint,
        botAddress: botAddress as string,
        tokenAddress: tokenAddress as string,
        aTokenAddress: aTokenAddress as string,
        tokenDecimals,
        userShares,
        userWithdrawableAmount,
        userYieldAmount,
        userDepositAmount,
      };

      setState(prev => ({ ...prev, data: vaultData, loading: false }));
    } catch (error) {
      console.error('Failed to fetch vault data:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch vault data',
        loading: false,
      }));
    }
  }, [userAddress, tokenId, authenticated]);

  useEffect(() => {
    fetchVaultData();
  }, [fetchVaultData]);

  return {
    ...state,
    refetch: fetchVaultData,
  };
};
