'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { VaultData } from '@/lib/hooks/useVaultData';
import { TrendingUp, Wallet, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/conversions';

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

  // Check if user has a position by looking at actual values instead of hasUserPosition flag
  const hasPosition =
    vaultData.userWithdrawableAmount && Number(vaultData.userWithdrawableAmount) > 0;

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
