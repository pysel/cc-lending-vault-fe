'use client';

import { VaultData } from '@/lib/hooks/useVaultData';
import { Badge } from '../ui/badge';

interface TokenInfoProps {
  vaultData: VaultData;
  showStatus?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const TokenInfo = ({ vaultData, showStatus = true, size = 'md' }: TokenInfoProps) => {
  const iconSize = size === 'sm' ? 'h-6 w-6' : size === 'lg' ? 'h-12 w-12' : 'h-8 w-8';
  const titleSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-lg';
  const subtitleSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className="flex items-center gap-3">
      {vaultData.tokenIcon && (
        <img
          src={vaultData.tokenIcon}
          alt={vaultData.tokenSymbol}
          className={`${iconSize} rounded-full flex-shrink-0`}
        />
      )}
      <div className="min-w-0">
        <h3 className={`${titleSize} font-bold`}>{vaultData.tokenSymbol}</h3>
        <p className={`${subtitleSize} text-muted-foreground truncate`}>{vaultData.tokenName}</p>
      </div>
      {showStatus && (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 ml-auto"
        >
          Active
        </Badge>
      )}
    </div>
  );
};
