// Cross-Chain Allocations Component for Bot-Managed Share System
// Shows where vault funds are currently allocated across different chains

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { TrendingUp, Globe } from 'lucide-react';
import type { VaultData } from '@/lib/types/vault';

interface CrossChainAllocationsProps {
  vaultData: VaultData;
  variant?: 'card' | 'detailed';
}

const getChainDisplayName = (chain: string): string => {
  const chainNames: Record<string, string> = {
    'eip155:1': 'Ethereum',
    'eip155:10': 'Optimism',
    'eip155:137': 'Polygon',
    'eip155:42161': 'Arbitrum',
    'eip155:8453': 'Base',
    'eip155:43114': 'Avalanche',
  };
  return chainNames[chain] || chain;
};

const getChainColor = (chain: string): string => {
  const chainColors: Record<string, string> = {
    'eip155:1': 'bg-blue-500',
    'eip155:10': 'bg-red-500',
    'eip155:137': 'bg-purple-500',
    'eip155:42161': 'bg-blue-600',
    'eip155:8453': 'bg-blue-400',
    'eip155:43114': 'bg-red-600',
  };
  return chainColors[chain] || 'bg-gray-500';
};

const formatAllocationAmount = (amount: string): string => {
  const num = parseFloat(amount) / 1e6; // Convert from wei to readable format
  return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const CrossChainAllocations = ({
  vaultData,
  variant = 'card',
}: CrossChainAllocationsProps) => {
  if (!vaultData.crossChainAllocations || vaultData.crossChainAllocations.length === 0) {
    return null;
  }

  if (variant === 'detailed') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Globe className="h-4 w-4" />
          Cross-Chain Allocations
        </div>
        <div className="space-y-1">
          {vaultData.crossChainAllocations.map((allocation: any, index: number) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getChainColor(allocation.chain)}`} />
                <span>{getChainDisplayName(allocation.chain)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{allocation.percentage.toFixed(1)}%</span>
                <Badge variant="outline" className="text-xs">
                  {formatAllocationAmount(allocation.amount)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-b from-background to-muted/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Cross-Chain Fund Allocation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Bot has optimally allocated funds across {vaultData.crossChainAllocations.length} chains
          for maximum yield
        </div>

        <div className="space-y-3">
          {vaultData.crossChainAllocations.map((allocation: any, index: number) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getChainColor(allocation.chain)}`} />
                  <span className="font-medium">{getChainDisplayName(allocation.chain)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{allocation.percentage.toFixed(1)}%</span>
                  <Badge variant="secondary">{formatAllocationAmount(allocation.amount)}</Badge>
                </div>
              </div>
              <Progress value={allocation.percentage} className="h-2" />
            </div>
          ))}
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            Allocations updated in real-time for optimal yield
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
