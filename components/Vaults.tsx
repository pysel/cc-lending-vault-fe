'use client';

import { useState, useEffect } from 'react';
import { useMultiVaultData } from '@/lib/hooks/useMultiVaultData';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  RefreshCw,
  Loader2,
  AlertCircle,
  Vault,
  BarChart3,
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/utils/conversions';
import {
  calculateYieldPerformance,
  calculateTotalValueLocked,
  calculateAverageAPY,
} from '@/lib/utils/vaultCalculations';

export const Vaults = () => {
  const { allVaults, loading, error, refetch } = useMultiVaultData(null); // Pass null to explicitly fetch all vault data without user info

  console.log(allVaults);

  // Calculate vault aggregations using utility functions
  const totalValueLocked = calculateTotalValueLocked(allVaults);
  const averageAPY = calculateAverageAPY(allVaults);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] p-4">
        <Card className="w-full max-w-4xl shadow-xl border-0 bg-gradient-to-b from-background to-muted/20">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium mb-2">Loading Vault Data</p>
            <p className="text-muted-foreground text-center">
              Fetching information from all vault contracts...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] p-4">
        <Card className="w-full max-w-4xl shadow-xl border-0 bg-gradient-to-b from-background to-muted/20">
          <CardContent className="p-8">
            <Alert className="border-destructive/50">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Vaults</AlertTitle>
              <AlertDescription className="mt-2">{error}</AlertDescription>
            </Alert>
            <div className="flex justify-center mt-6">
              <Button onClick={refetch} variant="outline" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] p-4">
      <div className="w-full max-w-6xl space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
            All Vaults Overview
          </h1>
          <div className="flex justify-center mt-4">
            <Button
              onClick={refetch}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-xl border-1 bg-gradient-to-b from-background to-muted/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5" />
                Total Value Locked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                $
                {totalValueLocked.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Across {allVaults.length} vault{allVaults.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-1 bg-gradient-to-b from-background to-muted/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5" />
                Average APY
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{averageAPY.toFixed(2)}%</p>
              <p className="text-sm text-muted-foreground mt-1">Weighted across all vaults</p>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-1 bg-gradient-to-b from-background to-muted/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Vault className="h-5 w-5" />
                Active Vaults
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-600">{allVaults.length}</p>
              <p className="text-sm text-muted-foreground mt-1">Currently deployed</p>
            </CardContent>
          </Card>
        </div>

        {/* Vault List - Compact Layout */}
        <div className="space-y-4">
          {allVaults.map(vault => (
            <Card
              key={vault.tokenId}
              className="shadow-lg border-1 bg-gradient-to-r from-background to-muted/10 hover:shadow-xl transition-shadow duration-200 py-0"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  {/* Token Info */}
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {vault.tokenIcon && (
                      <img
                        src={vault.tokenIcon}
                        alt={vault.tokenSymbol}
                        className="h-10 w-10 rounded-full flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold">{vault.tokenSymbol}</h3>
                      <p className="text-sm text-muted-foreground truncate">{vault.tokenName}</p>
                    </div>
                  </div>

                  {/* Vault Metrics - Horizontal Layout */}
                  <div className="hidden md:flex items-center gap-8 flex-1 justify-center">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Total Deposited</p>
                      <p className="font-semibold">
                        ${formatCurrency(vault.totalDeposits, vault.tokenDecimals)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Current Balance</p>
                      <p className="font-semibold">
                        ${formatCurrency(vault.currentATokenBalance, vault.tokenDecimals)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Total Yield</p>
                      <p className="font-semibold text-green-600">
                        ${formatCurrency(vault.totalYieldEarned, vault.tokenDecimals)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Performance</p>
                      <p className="font-semibold text-blue-600">
                        {calculateYieldPerformance(vault.totalYieldEarned, vault.totalDeposits)}
                      </p>
                    </div>
                  </div>

                  {/* Strategy & APY */}
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-center hidden sm:block">
                      <p className="text-xs text-muted-foreground">Strategy</p>
                      <p className="font-medium text-sm">{vault.currentAllocation || 'Aave'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">APY</p>
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      >
                        {formatPercentage(vault.currentAPY)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Mobile Layout - Show metrics in rows for small screens */}
                <div className="md:hidden mt-4 grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-muted/30 rounded">
                    <p className="text-xs text-muted-foreground">Deposited</p>
                    <p className="font-semibold text-sm">
                      ${formatCurrency(vault.totalDeposits, vault.tokenDecimals)}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-muted/30 rounded">
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className="font-semibold text-sm">
                      ${formatCurrency(vault.currentATokenBalance, vault.tokenDecimals)}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-muted/30 rounded">
                    <p className="text-xs text-muted-foreground">Yield</p>
                    <p className="font-semibold text-sm text-green-600">
                      ${formatCurrency(vault.totalYieldEarned, vault.tokenDecimals)}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-muted/30 rounded">
                    <p className="text-xs text-muted-foreground">Performance</p>
                    <p className="font-semibold text-sm text-blue-600">
                      {calculateYieldPerformance(vault.totalYieldEarned, vault.totalDeposits)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {allVaults.length === 0 && !loading && (
          <Card className="shadow-xl border-0 bg-gradient-to-b from-background to-muted/20">
            <CardContent className="text-center p-12">
              <Vault className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Vaults Available</h3>
              <p className="text-muted-foreground">
                There are currently no vaults deployed or available for viewing.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
