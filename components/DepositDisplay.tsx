'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { DepositTokenSelect } from '@/components/DepositTokenSelect';
import { QuoteValidityBar } from '@/components/QuoteValidityBar';
import { useBalances } from '@/lib/hooks/useBalances';
import { useDepositQuotes } from '@/lib/hooks/useDepositQuotes';
import { getVaultAddress } from '@/lib/constants';
import type { Asset } from '@/lib/types/assets';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ArrowDown, Loader2, CheckCircle, TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import debounce from 'lodash.debounce';
import { ARBITRUM_TARGET_CHAIN_ID } from '@/lib/constants';

export const DepositDisplay = () => {
  const { authenticated } = usePrivy();
  const [selectedToken, setSelectedToken] = useState<Asset | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [showYellowNotification, setShowYellowNotification] = useState(false);
  const [showGreenNotification, setShowGreenNotification] = useState(false);

  const {
    quote,
    status,
    loading,
    error,
    isPolling,
    timeLeft,
    executionSuccess,
    pollingTimeout,
    completedStatus,
    predictedAddress,
    getPredictedAddress,
    getDepositQuote,
    executeDepositQuote,
    resetQuote,
    resetUIOnly,
    resetForNewDeposit,
    clearExecutionSuccess,
  } = useDepositQuotes();

  const { balances, fetchBalances } = useBalances(predictedAddress);

  // Get user's balance for selected token
  const getUserBalance = () => {
    if (!selectedToken || !balances) return '0';
    const assetBalance = balances.balanceByAggregatedAsset.find(
      asset => asset.aggregatedAssetId === selectedToken.aggregatedAssetId
    );
    return assetBalance?.balance || '0';
  };

  const formatBalance = (balance: string, decimals: number) => {
    const balanceNum = parseFloat(balance) / Math.pow(10, decimals);
    return balanceNum.toLocaleString(undefined, { maximumFractionDigits: 6 });
  };

  // Convert user balance to decimal number for comparison
  const getUserBalanceAsNumber = () => {
    if (!selectedToken) return 0;
    const balance = getUserBalance();
    const decimals = selectedToken.aggregatedEntities[0]?.decimals || 6;
    return parseFloat(balance) / Math.pow(10, decimals);
  };

  const hasSufficientBalance = useCallback(
    (amount: string) => {
      if (!amount || !selectedToken) return false;
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) return false;
      const userBalance = getUserBalanceAsNumber();
      return numAmount <= userBalance;
    },
    [selectedToken, balances]
  );

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const amountExceedsBalance = () => {
    if (!amount || !selectedToken) return false;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return false;

    const userBalance = getUserBalanceAsNumber();
    return numAmount > userBalance;
  };

  // Get the predicted address when wallet connects
  useEffect(() => {
    if (authenticated && !predictedAddress) {
      getPredictedAddress();
    }
  }, [authenticated, predictedAddress, getPredictedAddress]);

  // Show yellow notification and reset UI when transaction is submitted
  useEffect(() => {
    if (executionSuccess) {
      // Show yellow notification
      setShowYellowNotification(true);

      // Reset UI immediately but keep polling active
      setAmount('');
      setShowGreenNotification(false); // Clear any existing green notification
      setSelectedToken(null);

      // Use resetUIOnly to preserve polling
      resetUIOnly();

      // Refresh balances after deposit
      if (predictedAddress) {
        fetchBalances();
      }

      // Hide yellow notification after 3 seconds
      const timer = setTimeout(() => {
        setShowYellowNotification(false);
        clearExecutionSuccess(); // Clear the executionSuccess flag
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [executionSuccess, resetUIOnly, predictedAddress, fetchBalances, clearExecutionSuccess]);

  // Debounce quote fetching to reduce API calls
  const debouncedGetDepositQuote = useMemo(
    () =>
      debounce(async request => {
        await getDepositQuote(request);
      }, 1000),
    [getDepositQuote]
  );

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      debouncedGetDepositQuote.cancel();
    };
  }, [debouncedGetDepositQuote]);

  // Handle deposit quote fetching when amount changes
  useEffect(() => {
    // Don't fetch quotes if transaction is in progress (but allow for completed/failed)
    if ((loading && status) || status?.status === 'PENDING' || status?.status === 'IN_PROGRESS') {
      return;
    }

    if (
      selectedToken &&
      amount &&
      hasSufficientBalance(amount) &&
      authenticated &&
      predictedAddress
    ) {
      const vaultAddress = getVaultAddress(selectedToken.aggregatedAssetId);
      if (vaultAddress) {
        // Only fetch if we don't have a valid quote (timeLeft > 20 seconds)
        if (!quote || timeLeft <= 20) {
          debouncedGetDepositQuote({
            selectedToken,
            amount,
            vaultAddress,
            targetChain: ARBITRUM_TARGET_CHAIN_ID,
          });
        }
      }
    } else {
      if (quote || loading) {
        resetQuote();
      }
    }
  }, [
    selectedToken,
    amount,
    authenticated,
    predictedAddress,
    debouncedGetDepositQuote,
    resetQuote,
    hasSufficientBalance,
    quote,
    loading,
    timeLeft,
    status,
  ]);

  // Show green notification when completedStatus is received
  useEffect(() => {
    if (completedStatus) {
      // Immediately hide yellow notification when green appears
      setShowYellowNotification(false);
      setShowGreenNotification(true);

      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setShowGreenNotification(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [completedStatus]);

  // Get deposit button state
  const getDepositButtonState = () => {
    if (!authenticated) {
      return { disabled: true, text: 'Login to Deposit' };
    }

    if (loading && status?.status === 'PENDING') {
      return { disabled: true, text: 'Executing Deposit...' };
    }

    if (loading) {
      return { disabled: true, text: 'Getting Quote...' };
    }

    if (!selectedToken) {
      return { disabled: true, text: 'Select a token first' };
    }

    if (!amount) {
      return { disabled: true, text: 'Enter amount' };
    }

    if (amountExceedsBalance()) {
      return { disabled: true, text: 'Insufficient balance' };
    }

    const vaultAddress = getVaultAddress(selectedToken.aggregatedAssetId);
    if (!vaultAddress) {
      return { disabled: true, text: 'Vault not supported' };
    }

    if (!quote) {
      return { disabled: true, text: 'Getting quote...' };
    }

    return { disabled: false, text: 'Deposit' };
  };

  const isValidAmount = () => {
    if (!amount || !selectedToken) return false;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return false;

    // Check if amount exceeds user's balance
    const userBalance = getUserBalanceAsNumber();
    return numAmount <= userBalance;
  };

  // Format countdown time
  const formatCountdown = (seconds: number) => {
    if (seconds === 0) return 'Expired';
    return `${seconds}s`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] p-4">
      {/* Yellow Notification - Transaction Submitted */}
      {showYellowNotification && (
        <div className="fixed top-4 right-4 z-50 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-right-full duration-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">Deposit submitted! Processing...</span>
        </div>
      )}

      {/* Green Notification - Transaction Completed */}
      {showGreenNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-right-full duration-300">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Deposit completed successfully!</span>
        </div>
      )}

      <Card className="w-full max-w-md shadow-xl border-1 bg-gradient-to-b from-background to-muted/20">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Deposit to Vault
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Deposit tokens to earn yield across multiple chains
          </p>
        </CardHeader>

        <CardContent className="space-y-10">
          {/* Transaction Failed Status */}
          {status?.status === 'FAILED' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <TriangleAlert className="h-4 w-4" />
                <AlertTitle>Transaction Failed</AlertTitle>
                <AlertDescription>
                  Your deposit transaction failed. Please try again or contact support if the issue
                  persists.
                </AlertDescription>
              </Alert>

              {/* Start new deposit button */}
              <Button
                className="w-full h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200 bg-orange hover:bg-orange/90 text-orange-foreground"
                onClick={() => {
                  resetForNewDeposit();
                  setAmount('');
                }}
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Polling Timeout Warning */}
          {pollingTimeout && !status && (
            <div className="space-y-4">
              <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800">
                <TriangleAlert className="h-4 w-4 text-yellow-600" />
                <AlertTitle>Transaction Status Unknown</AlertTitle>
                <AlertDescription>
                  Your deposit was executed but we couldn&apos;t get confirmation from OneBalance.
                  Your transaction may still be processing. Please check your wallet or try
                  refreshing your balance.
                </AlertDescription>
              </Alert>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    if (predictedAddress) {
                      fetchBalances();
                    }
                  }}
                >
                  Refresh Balance
                </Button>
                <Button
                  className="flex-1 bg-orange hover:bg-orange/90 text-orange-foreground"
                  onClick={() => {
                    resetForNewDeposit();
                    setAmount('');
                  }}
                >
                  Start New Deposit
                </Button>
              </div>
            </div>
          )}

          {/* Transaction In Progress Status */}
          {status &&
            !executionSuccess &&
            (status?.status === 'PENDING' || status?.status === 'IN_PROGRESS') && (
              <div className="space-y-4">
                {/* Transaction Status */}
                <Alert>
                  <Loader2 className={`h-4 w-4 ${isPolling ? 'animate-spin' : ''}`} />
                  <AlertTitle>Transaction Status: {status?.status || 'Processing'}</AlertTitle>
                  <AlertDescription>
                    {status?.status === 'PENDING' && 'Your deposit is being processed...'}
                    {status?.status === 'IN_PROGRESS' && 'Executing transaction steps...'}
                  </AlertDescription>
                </Alert>

                {/* Back to form button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    resetForNewDeposit();
                    setAmount('');
                  }}
                  disabled={loading}
                >
                  Start New Deposit
                </Button>
              </div>
            )}

          {/* Main Form - Show when no blocking status */}
          {(!status || status?.status === 'COMPLETED') && (
            <>
              {/* Token Selection - Always show in clean state */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Select Token</label>
                <div className="border-2 border-orange rounded-lg p-1">
                  <DepositTokenSelect
                    selectedToken={selectedToken}
                    setSelectedToken={token => {
                      setSelectedToken(token);
                      // Reset amount when token changes
                      setAmount('');
                      resetQuote();
                    }}
                  />
                </div>
              </div>

              {/* Amount Input - Only show after token selection */}
              {selectedToken && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-foreground">Amount</label>
                    <span className="text-xs text-muted-foreground">
                      Balance:{' '}
                      {formatBalance(
                        getUserBalance(),
                        selectedToken.aggregatedEntities[0]?.decimals || 6
                      )}{' '}
                      {selectedToken.symbol}
                    </span>
                  </div>
                  <div className="border-2 border-orange rounded-lg p-1">
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="0.00"
                        value={amount}
                        onChange={handleAmountChange}
                        className={`text-lg font-medium pr-16 h-14 border-0 focus:ring-0 focus:border-0 ${
                          amountExceedsBalance()
                            ? 'bg-red-100 border-red-300 dark:bg-background dark:border-red-800'
                            : ''
                        }`}
                        disabled={loading}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          {selectedToken.symbol}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Balance Error Message */}
                  {amountExceedsBalance() && (
                    <p className="text-xs text-red-600 mt-1">Amount exceeds available balance</p>
                  )}

                  {/* Max Button */}
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const maxAmount = getUserBalanceAsNumber();
                        setAmount(maxAmount.toString());
                      }}
                      className="text-xs h-6 px-2 text-primary hover:text-primary/80"
                    >
                      Use Max
                    </Button>
                  </div>
                </div>
              )}

              {/* Quote Validity Bar - Only show when there's a quote */}
              {quote && timeLeft > 0 && <QuoteValidityBar timeLeft={timeLeft} />}

              {/* Quote Loading Alert */}
              {authenticated && amount && selectedToken && !quote && loading && (
                <Alert>
                  <AlertTitle>Getting quote...</AlertTitle>
                  <AlertDescription>
                    Please wait while we prepare your deposit transaction
                  </AlertDescription>
                </Alert>
              )}

              {/* Deposit Flow Indicator */}
              {selectedToken && isValidAmount() && quote && (
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">From:</span>
                    <span className="font-medium">Aggregated Balance</span>
                  </div>
                  <div className="flex justify-center">
                    <ArrowDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">To:</span>
                    <span className="font-medium">Yield Vault (Arbitrum)</span>
                  </div>
                </div>
              )}

              {/* Action Button - Only show after token selection */}
              {selectedToken && (
                <div className="pt-2">
                  <Button
                    onClick={executeDepositQuote}
                    disabled={getDepositButtonState().disabled}
                    className="w-full h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200 bg-orange hover:bg-orange/90 text-orange-foreground"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        {getDepositButtonState().text}
                      </>
                    ) : (
                      getDepositButtonState().text
                    )}
                  </Button>

                  {/* Cancel button only shows when there's a quote */}
                  {quote && (
                    <Button
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => {
                        resetForNewDeposit();
                        setAmount('');
                      }}
                      disabled={loading}
                    >
                      Cancel Quote
                    </Button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Error Handling */}
          {error && (
            <Alert variant="destructive">
              <TriangleAlert className="h-4 w-4" />
              <AlertTitle>An error occurred</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Help Text - Only show when form is visible and no status */}
          {!status && (
            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p>
                Powered by{' '}
                <a
                  href="https://onebalance.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange hover:underline"
                >
                  OneBalance
                </a>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
