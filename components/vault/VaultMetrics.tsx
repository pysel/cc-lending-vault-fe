'use client';

import { Badge } from '../ui/badge';
import { VaultData } from '@/lib/hooks/useVaultData';
import { PieChart, DollarSign } from 'lucide-react';
import { formatPercentage } from '@/lib/utils/conversions';

interface VaultMetricsProps {
  vaultData: VaultData;
  variant?: 'card' | 'badge-only';
}

export const VaultMetrics = ({ vaultData, variant = 'card' }: VaultMetricsProps) => {
  if (variant === 'badge-only') {
    return (
      <Badge
        variant="secondary"
        className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      >
        {formatPercentage(vaultData.currentAPY)}
      </Badge>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
        <div className="flex items-center gap-1 mb-1">
          <PieChart className="h-3 w-3 text-purple-600 dark:text-purple-400" />
          <span className="text-xs text-purple-600 dark:text-purple-400">APY</span>
        </div>
        <p className="font-semibold text-purple-900 dark:text-purple-100">
          {formatPercentage(vaultData.currentAPY)}
        </p>
      </div>

      <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
        <div className="flex items-center gap-1 mb-1">
          <DollarSign className="h-3 w-3 text-orange-600 dark:text-orange-400" />
          <span className="text-xs text-orange-600 dark:text-orange-400">Strategy</span>
        </div>
        <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
          {vaultData.currentAllocation || 'Aave'}
        </p>
      </div>
    </div>
  );
};
