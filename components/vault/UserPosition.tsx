// Updated: Fixed inconsistent position detection logic by using standardized utility function

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { VaultData } from '@/lib/types/vault';
import { TrendingUp, Wallet, Info, PieChart } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/conversions';
import { hasUserPosition } from '@/lib/utils/vaultCalculations';

interface UserPositionProps {
  vaultData: VaultData;
  variant?: 'card' | 'detailed';
  authenticated: boolean;
}

export const UserPosition = ({ vaultData, variant = 'card', authenticated }: UserPositionProps) => {
  if (!authenticated) {
    return (
      <div className="text-center p-8">
        <Info className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Connect your wallet to view your position</p>
      </div>
    );
  }

  // Use standardized position detection to prevent inconsistencies
  const hasPosition = hasUserPosition(vaultData);

  if (!hasPosition) {
    return (
      <div className="text-center p-8">
        <Wallet className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">You don&apos;t have any deposits in this vault yet</p>
        <p className="text-sm text-muted-foreground mt-2">Make a deposit to start earning yield</p>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="space-y-3">
        {/* Deposited Value */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-1">
              <Wallet className="h-3 w-3" />
              Your Position
            </span>
          </div>
          <div>
            <p className="font-semibold text-blue-900 dark:text-blue-100 text-lg">
              ${formatCurrency(vaultData.userWithdrawableAmount, vaultData.tokenDecimals)}
            </p>
          </div>
        </div>

        {/* Yield Information */}
        <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
            <span className="text-xs text-green-600 dark:text-green-400">Your Yield</span>
          </div>
          <p className="font-semibold text-green-900 dark:text-green-100">
            ${formatCurrency(vaultData.userYieldAmount, vaultData.tokenDecimals)}
          </p>
        </div>

        {/* Portfolio Percentage (if available from bot data) */}
        {'percentageOfVault' in vaultData && vaultData.percentageOfVault !== undefined && (
          <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <PieChart className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              <span className="text-xs text-purple-600 dark:text-purple-400">Vault Share</span>
            </div>
            <p className="font-semibold text-purple-900 dark:text-purple-100">
              {vaultData.percentageOfVault.toFixed(3)}%
            </p>
          </div>
        )}
      </div>
    );
  }

  // Detailed variant
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-green-700 dark:text-green-300">Your Deposited Value</span>
            <span className="font-medium text-green-900 dark:text-green-100">
              ${formatCurrency(vaultData.userWithdrawableAmount, vaultData.tokenDecimals)}
            </span>
          </div>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-blue-700 dark:text-blue-300">Your Yield Earned</span>
            <span className="font-medium text-blue-900 dark:text-blue-100">
              ${formatCurrency(vaultData.userYieldAmount, vaultData.tokenDecimals)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
