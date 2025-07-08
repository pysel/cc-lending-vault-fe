'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { DepositTokenSelect } from '@/components/DepositTokenSelect';
import { ChainSelect } from '@/components/ui/chain-select';
import { QuoteValidityBar } from '@/components/QuoteValidityBar';
import { useBalances } from '@/lib/hooks/useBalances';
import { useWithdrawCustom } from '@/lib/hooks/useWithdrawCustom';
import type { Asset } from '@/lib/types/assets';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { ArrowRight, Loader2, CheckCircle, TriangleAlert, LogOut } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { validateAddressWithMessage, formatAddressForDisplay } from '@/lib/utils/address';
import debounce from 'lodash.debounce';

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WithdrawDialog = ({ open, onOpenChange }: WithdrawDialogProps) => {
  const { authenticated } = usePrivy();
  const [selectedToken, setSelectedToken] = useState<Asset | null>(null);
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [recipientAddress, setRecipientAddress] = useState<string>('');
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
    getWithdrawQuote,
    executeWithdrawQuote,
    resetQuote,
    resetUIOnly,
    resetForNewWithdraw,
    clearExecutionSuccess,
  } = useWithdrawCustom();

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

  // Validate recipient address
  const addressValidation = useMemo(() => {
    return validateAddressWithMessage(recipientAddress);
  }, [recipientAddress]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecipientAddress(e.target.value);
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
      setRecipientAddress('');
      setSelectedChain(null);
      setSelectedToken(null);
      setShowGreenNotification(false);

      // Use resetUIOnly to preserve polling
      resetUIOnly();

      // Refresh balances after withdrawal
      if (predictedAddress) {
        fetchBalances();
      }

      // Hide yellow notification after 3 seconds
      const timer = setTimeout(() => {
        setShowYellowNotification(false);
        clearExecutionSuccess();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [executionSuccess, resetUIOnly, predictedAddress, fetchBalances, clearExecutionSuccess]);

  // Debounce quote fetching to reduce API calls
  const debouncedGetWithdrawQuote = useMemo(
    () =>
      debounce(async request => {
        await getWithdrawQuote(request);
      }, 1000),
    [getWithdrawQuote]
  );

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      debouncedGetWithdrawQuote.cancel();
    };
  }, [debouncedGetWithdrawQuote]);

  // Handle withdraw quote fetching when inputs change
  useEffect(() => {
    // Don't fetch quotes if transaction is in progress
    if ((loading && status) || status?.status === 'PENDING' || status?.status === 'IN_PROGRESS') {
      return;
    }

    if (
      selectedToken &&
      selectedChain &&
      recipientAddress &&
      amount &&
      hasSufficientBalance(amount) &&
      addressValidation.isValid &&
      authenticated &&
      predictedAddress
    ) {
      // Only fetch if we don't have a valid quote (timeLeft > 20 seconds)
      if (!quote || timeLeft <= 20) {
        debouncedGetWithdrawQuote({
          selectedToken,
          amount,
          targetChain: selectedChain,
          recipientAddress,
        });
      }
    } else {
      if (quote || loading) {
        resetQuote();
      }
    }
  }, [
    selectedToken,
    selectedChain,
    recipientAddress,
    amount,
    authenticated,
    predictedAddress,
    debouncedGetWithdrawQuote,
    resetQuote,
    hasSufficientBalance,
    addressValidation.isValid,
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

  // Get exit button state
  const getExitButtonState = () => {
    if (!authenticated) {
      return { disabled: true, text: 'Login to Withdraw' };
    }

    if (loading && status?.status === 'PENDING') {
      return { disabled: true, text: 'Executing Withdrawal...' };
    }

    if (loading) {
      return { disabled: true, text: 'Getting Quote...' };
    }

    if (!selectedToken) {
      return { disabled: true, text: 'Select a token first' };
    }

    if (!selectedChain) {
      return { disabled: true, text: 'Select target chain' };
    }

    if (!recipientAddress) {
      return { disabled: true, text: 'Enter recipient address' };
    }

    if (!addressValidation.isValid) {
      return { disabled: true, text: 'Invalid address' };
    }

    if (!amount) {
      return { disabled: true, text: 'Enter amount' };
    }

    if (amountExceedsBalance()) {
      return { disabled: true, text: 'Insufficient balance' };
    }

    if (!quote) {
      return { disabled: true, text: 'Getting quote...' };
    }

    return { disabled: false, text: 'Exit' };
  };

  const isValidWithdraw = () => {
    if (!selectedToken || !selectedChain || !recipientAddress || !amount) return false;
    if (!addressValidation.isValid) return false;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return false;
    const userBalance = getUserBalanceAsNumber();
    return numAmount <= userBalance;
  };

  // Format countdown time
  const formatCountdown = (seconds: number) => {
    if (seconds === 0) return 'Expired';
    return `${seconds}s`;
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      resetForNewWithdraw();
      setSelectedToken(null);
      setSelectedChain(null);
      setRecipientAddress('');
      setAmount('');
      setShowYellowNotification(false);
      setShowGreenNotification(false);
    }
  }, [open, resetForNewWithdraw]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            Withdraw Funds
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto max-h-[70vh] pr-2">
          {/* Yellow notification - Transaction submitted */}
          {showYellowNotification && (
            <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800">
              <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
              <AlertTitle>Withdrawal Submitted</AlertTitle>
              <AlertDescription>
                Your withdrawal has been submitted and is being processed. You can close this
                dialog.
              </AlertDescription>
            </Alert>
          )}

          {/* Green notification - Transaction completed */}
          {showGreenNotification && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle>Withdrawal Completed</AlertTitle>
              <AlertDescription>
                Your withdrawal has been successfully completed! The funds have been sent to the
                recipient address.
              </AlertDescription>
            </Alert>
          )}

          {/* Transaction In Progress Status */}
          {status &&
            !executionSuccess &&
            (status?.status === 'PENDING' || status?.status === 'IN_PROGRESS') && (
              <div className="space-y-4">
                <Alert>
                  <Loader2 className={`h-4 w-4 ${isPolling ? 'animate-spin' : ''}`} />
                  <AlertTitle>Transaction Status: {status?.status || 'Processing'}</AlertTitle>
                  <AlertDescription>
                    {status?.status === 'PENDING' && 'Your withdrawal is being processed...'}
                    {status?.status === 'IN_PROGRESS' && 'Executing transaction steps...'}
                  </AlertDescription>
                </Alert>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    resetForNewWithdraw();
                    setSelectedToken(null);
                    setSelectedChain(null);
                    setRecipientAddress('');
                    setAmount('');
                  }}
                  disabled={loading}
                >
                  Start New Withdrawal
                </Button>
              </div>
            )}

          {/* Main Form - Show when no blocking status */}
          {(!status || status?.status === 'COMPLETED') && (
            <>
              {/* Token Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Select Token</label>
                <div className="border-2 border-orange rounded-lg p-1">
                  <DepositTokenSelect
                    selectedToken={selectedToken}
                    setSelectedToken={token => {
                      setSelectedToken(token);
                      setAmount('');
                      resetQuote();
                    }}
                  />
                </div>
              </div>

              {/* Amount Input - Show after token selection */}
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

              {/* Target Chain Selection - Show after amount */}
              {selectedToken && amount && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Target Chain</label>
                  <div className="border-2 border-orange rounded-lg p-1">
                    <ChainSelect
                      selectedChain={selectedChain}
                      setSelectedChain={chainId => {
                        setSelectedChain(chainId);
                        resetQuote();
                      }}
                      placeholder="Select destination chain"
                    />
                  </div>
                </div>
              )}

              {/* Recipient Address Input - Show after chain selection */}
              {selectedToken && amount && selectedChain && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Recipient Address</label>
                  <div className="border-2 border-orange rounded-lg p-1">
                    <Input
                      type="text"
                      placeholder="0x... or name.eth"
                      value={recipientAddress}
                      onChange={handleAddressChange}
                      className={`text-lg font-medium h-14 border-0 focus:ring-0 focus:border-0 ${
                        recipientAddress && !addressValidation.isValid
                          ? 'bg-red-100 border-red-300 dark:bg-background dark:border-red-800'
                          : ''
                      }`}
                      disabled={loading}
                    />
                  </div>

                  {/* Address Error Message */}
                  {recipientAddress && !addressValidation.isValid && (
                    <p className="text-xs text-red-600 mt-1">{addressValidation.error}</p>
                  )}

                  {/* Address Preview */}
                  {recipientAddress && addressValidation.isValid && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Valid address: {formatAddressForDisplay(recipientAddress)}
                    </p>
                  )}
                </div>
              )}

              {/* Quote Validity Bar - Only show when there's a quote */}
              {quote && timeLeft > 0 && <QuoteValidityBar timeLeft={timeLeft} />}

              {/* Quote Loading Alert */}
              {authenticated &&
                selectedToken &&
                amount &&
                selectedChain &&
                recipientAddress &&
                addressValidation.isValid &&
                !quote &&
                loading && (
                  <Alert>
                    <AlertTitle>Getting quote...</AlertTitle>
                    <AlertDescription>
                      Please wait while we prepare your withdrawal transaction
                    </AlertDescription>
                  </Alert>
                )}

              {/* Withdrawal Flow Indicator */}
              {selectedToken && selectedChain && recipientAddress && isValidWithdraw() && quote && (
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">From:</span>
                    <span className="font-medium">Your OneBalance Account</span>
                  </div>
                  <div className="flex justify-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">To:</span>
                    <span className="font-medium">
                      {formatAddressForDisplay(recipientAddress)} (
                      {selectedChain &&
                      selectedChain in
                        { '1': 'Ethereum', '42161': 'Arbitrum', '8453': 'Base', '10': 'Optimism' }
                        ? {
                            '1': 'Ethereum',
                            '42161': 'Arbitrum',
                            '8453': 'Base',
                            '10': 'Optimism',
                          }[selectedChain]
                        : `Chain ${selectedChain}`}
                      )
                    </span>
                  </div>
                </div>
              )}

              {/* Action Button - Show after all inputs are filled */}
              {selectedToken && selectedChain && recipientAddress && (
                <div className="pt-2">
                  <Button
                    onClick={executeWithdrawQuote}
                    disabled={getExitButtonState().disabled}
                    className="w-full h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200 bg-red-600 hover:bg-red-700 text-white"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        {getExitButtonState().text}
                      </>
                    ) : (
                      <>
                        <LogOut className="h-4 w-4 mr-2" />
                        {getExitButtonState().text}
                      </>
                    )}
                  </Button>

                  {/* Cancel button only shows when there's a quote */}
                  {quote && (
                    <Button
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => {
                        resetForNewWithdraw();
                        setSelectedToken(null);
                        setSelectedChain(null);
                        setRecipientAddress('');
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

          {/* Help Text */}
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
              <p>Funds will be sent to your specified address on the selected chain</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
