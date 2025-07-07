// Bot API Client - Updated with token normalization and fallback mechanisms
// This provides bot-managed share calculations and cross-chain vault data

import { apiClient } from '@/lib/api';
import {
  BotUserInfo,
  BotVaultMetrics,
  BotPortfolioSummary,
  BotHealthStatus,
} from '@/lib/types/bot';
import { normalizeTokenId, aggregatedAssetIdToSymbol } from '@/lib/utils/token';

/**
 * Bot API client for cross-chain aware share management
 */
export const botApi = {
  /**
   * Get comprehensive user information for a specific vault
   */
  getUserInfo: async (userAddress: string, token: string): Promise<BotUserInfo> => {
    try {
      // Convert aggregated asset ID to symbol for bot API call
      const tokenSymbol = aggregatedAssetIdToSymbol(token);
      const response = await apiClient.get(
        `/bot/user-info?address=${userAddress}&token=${tokenSymbol}`
      );

      // Normalize the token ID in the response
      const data = response.data;
      return {
        ...data,
        token: normalizeTokenId(data.token || token),
      };
    } catch (error) {
      console.error('Failed to fetch user info from bot API:', error);
      throw error;
    }
  },

  /**
   * Get vault metrics with cross-chain awareness
   */
  getVaultMetrics: async (token: string): Promise<BotVaultMetrics> => {
    try {
      // Convert aggregated asset ID to symbol for bot API call
      const tokenSymbol = aggregatedAssetIdToSymbol(token);
      const response = await apiClient.get(`/bot/vault-metrics?token=${tokenSymbol}`);

      // Normalize the token ID in the response
      const data = response.data;
      return {
        ...data,
        token: normalizeTokenId(data.token || token),
      };
    } catch (error) {
      console.error('Failed to fetch vault metrics from bot API:', error);
      throw error;
    }
  },

  /**
   * Get user's complete portfolio summary across all vaults
   */
  getUserPortfolioSummary: async (userAddress: string): Promise<BotPortfolioSummary> => {
    try {
      const response = await apiClient.get(`/bot/portfolio-summary?address=${userAddress}`);

      // Normalize token IDs in portfolio positions
      const data = response.data;
      return {
        ...data,
        positions: (data.positions || []).map((position: any) => ({
          ...position,
          token: normalizeTokenId(position.token),
        })),
      };
    } catch (error) {
      console.error('Failed to fetch portfolio summary from bot API:', error);
      throw error;
    }
  },

  /**
   * Get bot health status for monitoring cross-chain operations
   */
  getBotHealthStatus: async (): Promise<BotHealthStatus> => {
    try {
      const response = await apiClient.get('/bot/health-status');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch bot health status:', error);
      throw error;
    }
  },

  /**
   * Get all vault metrics for overview page
   */
  getAllVaultMetrics: async (): Promise<BotVaultMetrics[]> => {
    try {
      const response = await apiClient.get('/bot/all-vault-metrics');

      // Normalize token IDs in all vault metrics
      const data = response.data;
      return (data || []).map((vaultMetrics: any) => ({
        ...vaultMetrics,
        token: normalizeTokenId(vaultMetrics.token),
      }));
    } catch (error) {
      console.error('Failed to fetch all vault metrics from bot API:', error);
      throw error;
    }
  },

  /**
   * Get user positions across all vaults
   */
  getUserPositions: async (userAddress: string): Promise<BotUserInfo[]> => {
    try {
      const response = await apiClient.get(`/bot/user-positions?address=${userAddress}`);

      // Normalize token IDs in all user positions
      const data = response.data;
      return (data || []).map((position: any) => ({
        ...position,
        token: normalizeTokenId(position.token),
      }));
    } catch (error) {
      console.error('Failed to fetch user positions from bot API:', error);
      throw error;
    }
  },
};
