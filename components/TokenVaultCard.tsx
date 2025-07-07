'use client';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import type { VaultData } from '@/lib/types/vault';
import { ChevronRight, Eye } from 'lucide-react';
import { TokenInfo } from './vault/TokenInfo';
import { UserPosition } from './vault/UserPosition';
import { VaultMetrics } from './vault/VaultMetrics';

interface TokenVaultCardProps {
  vaultData: VaultData;
  authenticated: boolean;
  onViewDetails?: (tokenId: string) => void;
}

export const TokenVaultCard = ({
  vaultData,
  authenticated,
  onViewDetails,
}: TokenVaultCardProps) => {
  return (
    <Card className="shadow-lg border-0 bg-gradient-to-b from-background to-muted/20 hover:shadow-xl transition-shadow duration-200">
      <CardHeader className="pb-3">
        <CardTitle>
          <TokenInfo vaultData={vaultData} />
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* User Position */}
        <UserPosition vaultData={vaultData} authenticated={authenticated} variant="card" />

        {/* Vault Metrics */}
        <VaultMetrics vaultData={vaultData} />

        {/* View Details Button */}
        {onViewDetails && vaultData.tokenId && (
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => onViewDetails(vaultData.tokenId!)}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
