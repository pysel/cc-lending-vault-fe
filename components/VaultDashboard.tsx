// Updated: Fixed inconsistent position detection logic by using standardized utility function

'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useMultiVaultData } from '@/lib/hooks/useMultiVaultData';
import { useWithdraw } from '@/lib/hooks/useWithdraw';
import { useVaultData } from '@/lib/hooks/useVaultData';
import { CrossChainAllocations } from './vault/CrossChainAllocations';
import { usePredictedAddress } from '@/lib/contexts/PredictedAddressContext';
import { TokenVaultCard } from './TokenVaultCard';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import {
  TrendingUp,
  Wallet,
  DollarSign,
  PieChart,
  RefreshCw,
  Info,
  Loader2,
  AlertCircle,
  ArrowLeft,
  BarChart3,
  LogOut,
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/utils/conversions';
import { calculateYieldPerformance, hasUserPosition } from '@/lib/utils/vaultCalculations';
import { ARBITRUM_TARGET_CHAIN_ID, findTokenBySymbol, getVaultAddress } from '@/lib/constants';

export const VaultDashboard = () => {
  const { authenticated } = usePrivy();
  const { predictedAddress, getPredictedAddress } = usePredictedAddress();
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);

  const {
    loading: withdrawLoading,
    error: withdrawError,
    success: withdrawSuccess,
    executeWithdraw,
    resetState,
  } = useWithdraw();

  // Use multi-vault data for list view
  const {
    vaultsWithPositions,
    allVaults,
    loading: multiVaultLoading,
    error: multiVaultError,
    refetch: refetchMultiVault,
  } = useMultiVaultData(predictedAddress || undefined);

  // Use single vault data when viewing details
  const {
    data: singleVaultData,
    loading: singleVaultLoading,
    error: singleVaultError,
    refetch: refetchSingleVault,
  } = useVaultData(predictedAddress || undefined, selectedTokenId || 'ob:usdc');

  // Also get bot vault data for enhanced features
  const botVaultData = useVaultData(predictedAddress || undefined, selectedTokenId || 'ob:usdc');

  // Get predicted address when wallet connects
  useEffect(() => {
    if (authenticated && !predictedAddress) {
      getPredictedAddress();
    }
  }, [authenticated, predictedAddress, getPredictedAddress]);

  // Reset withdraw state when changing views
  useEffect(() => {
    resetState();
  }, [selectedTokenId, resetState]);

  // Handle withdraw success
  useEffect(() => {
    if (withdrawSuccess) {
      // Refresh the vault data after successful withdrawal
      refetchSingleVault();
      refetchMultiVault();
    }
  }, [withdrawSuccess, refetchSingleVault, refetchMultiVault]);

  // Handle view details
  const handleViewDetails = (tokenId: string) => {
    setSelectedTokenId(tokenId);
  };

  // Handle back to list
  const handleBackToList = () => {
    setSelectedTokenId(null);
  };

  // Handle withdraw - simplified for bot-managed system
  const handleWithdraw = async () => {
    if (!selectedTokenId || !singleVaultData || !predictedAddress) {
      return;
    }

    const vaultAddress = getVaultAddress(selectedTokenId);
    if (!vaultAddress) {
      console.error('No vault address found for token:', selectedTokenId);
      return;
    }

    const tokenAddress = findTokenBySymbol(singleVaultData.tokenSymbol!)!.address!['42161'];

    await executeWithdraw({
      vaultAddress,
      userAddress: predictedAddress,
      targetChain: ARBITRUM_TARGET_CHAIN_ID,
      tokenAddress: tokenAddress || '',
    });
  };

  // Show detailed view for specific token
  if (selectedTokenId) {
    const loading = singleVaultLoading;
    const error = singleVaultError;
    const vaultData = singleVaultData;
    const refetch = refetchSingleVault;

    const hasPosition = vaultData ? hasUserPosition(vaultData) : false;

    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[600px] p-4">
          <Card className="w-full max-w-4xl shadow-xl border-0 bg-gradient-to-b from-background to-muted/20">
            <CardContent className="flex items-center justify-center p-12">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading vault data...</p>
              </div>
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
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Vault Data</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="mt-4 flex justify-center gap-2">
                <Button onClick={handleBackToList} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to List
                </Button>
                <Button onClick={refetch} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
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
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Button onClick={handleBackToList} variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {selectedTokenId.replace('ob:', '').toUpperCase()} Vault Details
            </h1>
            <p className="text-muted-foreground">Detailed vault performance and bot allocations</p>
            <div className="flex justify-center">
              <Button onClick={refetch} variant="ghost" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </div>

          {/* Withdraw Success Alert */}
          {withdrawSuccess && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-700 dark:text-green-300">
                Withdrawal Successful
              </AlertTitle>
              <AlertDescription className="text-green-600 dark:text-green-400">
                Your withdrawal has been processed successfully. Your funds should appear in your
                wallet shortly.
              </AlertDescription>
            </Alert>
          )}

          {/* Withdraw Error Alert */}
          {withdrawError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Withdrawal Error</AlertTitle>
              <AlertDescription>{withdrawError}</AlertDescription>
            </Alert>
          )}

          {/* User Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Your Deposited Value */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Your Deposited Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  ${formatCurrency(vaultData?.userWithdrawableAmount, vaultData?.tokenDecimals)}
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Current Position</p>
              </CardContent>
            </Card>

            {/* Your Yield Earned */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Your Yield Earned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  ${formatCurrency(vaultData?.userYieldAmount, vaultData?.tokenDecimals)}
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">Personal Earnings</p>
              </CardContent>
            </Card>

            {/* Current APY */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Current APY
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {formatPercentage(vaultData?.currentAPY)}
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  Annual Percentage Yield
                </p>
              </CardContent>
            </Card>

            {/* Your Performance */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Your Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {vaultData?.userWithdrawableAmount && vaultData?.userYieldAmount
                    ? calculateYieldPerformance(
                        vaultData.userYieldAmount,
                        vaultData.userWithdrawableAmount
                      )
                    : '0.00%'}
                </div>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Personal Return</p>
              </CardContent>
            </Card>
          </div>

          {/* Withdraw Section */}
          {hasPosition && (
            <Card className="shadow-xl border-0 bg-gradient-to-b from-background to-muted/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogOut className="h-5 w-5" />
                  Withdraw Funds
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium">Available to Withdraw</p>
                      <p className="text-2xl font-bold">
                        $
                        {formatCurrency(
                          vaultData?.userWithdrawableAmount,
                          vaultData?.tokenDecimals
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        This will withdraw your entire position
                      </p>
                    </div>
                    <Button
                      onClick={handleWithdraw}
                      disabled={withdrawLoading || !hasPosition}
                      variant="destructive"
                      size="lg"
                    >
                      {withdrawLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Withdrawing...
                        </>
                      ) : (
                        <>
                          <LogOut className="h-4 w-4 mr-2" />
                          Withdraw All
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cross-Chain Allocations (Enhanced Feature) */}
          {botVaultData.data && botVaultData.data.crossChainAllocations?.length > 0 ? (
            <CrossChainAllocations vaultData={botVaultData.data} />
          ) : (
            /* Fallback to Current Bot Strategy */
            <Card className="shadow-xl border-0 bg-gradient-to-b from-background to-muted/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Current Bot Strategy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Active Strategy</span>
                    <Badge variant="secondary">Live</Badge>
                  </div>
                  <p className="text-lg font-semibold">
                    {vaultData?.currentAllocation || 'Aave Lending'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Bot is currently allocating funds to maximize yield through this strategy
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Show list view (default)
  const loading = multiVaultLoading;
  const error = multiVaultError;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] p-4">
        <Card className="w-full max-w-4xl shadow-xl border-0 bg-gradient-to-b from-background to-muted/20">
          <CardContent className="flex items-center justify-center p-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading vault data...</p>
            </div>
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
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Vault Data</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4 flex justify-center">
              <Button onClick={refetchMultiVault} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
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
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Your Vault Positions
          </h1>
          <p className="text-muted-foreground">
            Track your yield vault positions across all supported tokens
          </p>
          <div className="flex justify-center">
            <Button onClick={refetchMultiVault} variant="ghost" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Vault Positions */}
        {!authenticated ? (
          <Card className="shadow-xl border-0 bg-gradient-to-b from-background to-muted/20">
            <CardContent className="text-center p-12">
              <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
              <p className="text-muted-foreground">
                Connect your wallet to view your vault positions and allocations
              </p>
            </CardContent>
          </Card>
        ) : vaultsWithPositions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vaultsWithPositions.map(vault => (
              <TokenVaultCard
                key={vault.tokenId}
                vaultData={vault}
                authenticated={authenticated}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        ) : (
          <Card className="shadow-xl border-0 bg-gradient-to-b from-background to-muted/20">
            <CardContent className="text-center p-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Vault Positions</h3>
              <p className="text-muted-foreground mb-4">
                You don&apos;t have any positions in the available vaults yet
              </p>
              <p className="text-sm text-muted-foreground">
                Switch to the Deposit tab to start earning yield
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
