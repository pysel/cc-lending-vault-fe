import { useState, useCallback, useRef, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import {
  quoteClient,
  type EvmAccount,
  type PrepareCallRequest,
  type CallRequest,
  type Hex,
  type Quote,
} from '@/lib/api';
import { signOperation } from '@/lib/utils/signer';
import { useEmbeddedWallet } from './useEmbeddedWallet';
import { usePredictedAddress } from '@/lib/contexts/PredictedAddressContext';
import { Asset } from '@/lib/types/assets';
import {
  WithdrawCustomRequest,
  WithdrawCustomState,
  OneBalanceWithdrawQuoteRequest,
} from '@/lib/types/withdraw';

// Types are imported from @/lib/types/withdraw

export const useWithdrawCustom = () => {
  const { authenticated } = usePrivy();
  const embeddedWallet = useEmbeddedWallet();
  const { predictedAddress, getPredictedAddress } = usePredictedAddress();
  const statusPollingRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastQuoteRequestRef = useRef<WithdrawCustomRequest | null>(null);

  const [state, setState] = useState<WithdrawCustomState>({
    quote: null,
    preparedQuoteData: null,
    status: null,
    loading: false,
    error: null,
    isPolling: false,
    timeLeft: 0,
    executionSuccess: false,
    pollingTimeout: false,
    completedStatus: null,
  });

  const resetQuote = useCallback(() => {
    // Clear any active polling
    if (statusPollingRef.current) {
      clearInterval(statusPollingRef.current);
      statusPollingRef.current = null;
    }

    // Clear countdown timer
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    lastQuoteRequestRef.current = null;

    // Reset quote-related state but preserve status for success display
    setState(prev => ({
      ...prev,
      quote: null,
      preparedQuoteData: null,
      loading: false,
      error: null,
      isPolling: false,
      timeLeft: 0,
    }));
  }, []);

  const resetUIOnly = useCallback(() => {
    // Reset UI state but keep polling active
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    lastQuoteRequestRef.current = null;

    // Reset form state but preserve polling and completedStatus
    setState(prev => ({
      quote: null,
      preparedQuoteData: null,
      status: null,
      loading: false,
      error: null,
      isPolling: prev.isPolling,
      timeLeft: 0,
      executionSuccess: false,
      pollingTimeout: false,
      completedStatus: prev.completedStatus,
    }));
  }, []);

  const resetForNewWithdraw = useCallback(() => {
    // Clear any active polling
    if (statusPollingRef.current) {
      clearInterval(statusPollingRef.current);
      statusPollingRef.current = null;
    }

    // Clear countdown timer
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    lastQuoteRequestRef.current = null;

    // Reset everything including status for a completely new withdrawal
    setState({
      quote: null,
      preparedQuoteData: null,
      status: null,
      loading: false,
      error: null,
      isPolling: false,
      timeLeft: 0,
      executionSuccess: false,
      pollingTimeout: false,
      completedStatus: null,
    });
  }, []);

  // Start countdown timer for quote expiration
  const startCountdownTimer = useCallback((expirationTimestamp: number) => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    const updateCountdown = () => {
      const now = Date.now();
      const timeLeft = Math.max(0, Math.floor((expirationTimestamp * 1000 - now) / 1000));

      setState(prev => ({ ...prev, timeLeft }));

      // Clear timer when expired
      if (timeLeft === 0) {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
      }
    };

    // Update immediately
    updateCountdown();

    // Then update every second
    countdownTimerRef.current = setInterval(updateCountdown, 1000);
  }, []);

  // Helper function to format asset ID for OneBalance API
  const formatAssetId = (token: Asset, chainId?: string) => {
    if (chainId) {
      // For chain-specific asset (to.asset), find the specific asset type
      const chainAsset = token.aggregatedEntities.find(entity =>
        entity.assetType.includes(`eip155:${chainId}/`)
      );
      return chainAsset?.assetType || token.aggregatedAssetId;
    }
    // For aggregated asset (from.asset), use the aggregated asset ID
    return token.aggregatedAssetId;
  };

  // Helper function to format account address for OneBalance API
  const formatAccountAddress = (chainId: string, address: string) => {
    return `eip155:${chainId}:${address}`;
  };

  const getWithdrawQuote = useCallback(
    async (request: WithdrawCustomRequest) => {
      if (!authenticated || !embeddedWallet) {
        setState(prev => ({ ...prev, error: 'Wallet not connected' }));
        return;
      }

      // Don't fetch new quotes if transaction is in progress
      if (
        state.loading ||
        (state.status && state.status.status !== 'COMPLETED' && state.status.status !== 'FAILED')
      ) {
        return;
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        // Store the current request
        lastQuoteRequestRef.current = request;

        // Get or fetch the predicted address
        let predicted = predictedAddress;
        if (!predicted) {
          predicted = await getPredictedAddress();
          if (!predicted) {
            throw new Error('Failed to get account address');
          }
        }

        // Convert amount to wei using token decimals
        const decimals = request.selectedToken.aggregatedEntities[0]?.decimals || 6;
        const amountWei = (parseFloat(request.amount) * Math.pow(10, decimals)).toString();

        // Check if user has sufficient aggregated balance
        const balances = await fetch(
          `/api/v2/balances/aggregated-balance?address=${predicted}`
        ).then(res => res.json());

        const tokenBalance = balances.balanceByAggregatedAsset.find(
          (asset: any) => asset.aggregatedAssetId === request.selectedToken.aggregatedAssetId
        );

        if (!tokenBalance) {
          throw new Error(`No balance found for ${request.selectedToken.symbol}`);
        }

        // Check if user has sufficient aggregated balance
        if (BigInt(tokenBalance.balance) < BigInt(amountWei)) {
          throw new Error(
            `Insufficient balance for ${request.amount} ${request.selectedToken.symbol}`
          );
        }

        // Extract chain ID from target chain (remove eip155: prefix if present)
        const chainId = request.targetChain.replace('eip155:', '');

        // Create EVM account for OneBalance
        const evmAccount: EvmAccount = {
          accountAddress: predicted as Hex,
          sessionAddress: embeddedWallet.address as Hex,
          adminAddress: embeddedWallet.address as Hex,
        };

        // Prepare the OneBalance quote request following the specified structure
        const quoteRequest = {
          from: {
            account: {
              sessionAddress: embeddedWallet.address,
              adminAddress: embeddedWallet.address,
              accountAddress: predicted,
            },
            asset: {
              assetId: request.selectedToken.aggregatedAssetId, // Use ob: prefix
            },
            amount: amountWei,
          },
          to: {
            asset: {
              assetId: formatAssetId(request.selectedToken, chainId), // Chain-specific asset ID
            },
            account: formatAccountAddress(chainId, request.recipientAddress),
          },
        };

        console.log('🔄 Withdraw quote request:', quoteRequest);

        // Use the OneBalance quote API - this should be the correct endpoint for withdrawal quotes
        const quote = await quoteClient.getV1Quote(quoteRequest);

        console.log('   📋 Withdraw quote response:', quote);

        if (!quote || !quote.id) {
          throw new Error('Invalid quote response from API');
        }

        // Generate expiration timestamp (30 seconds from now)
        const expirationTimestamp = Math.floor(Date.now() / 1000) + 30;

        // Store the quote data
        const preparedQuoteData = {
          preparedQuote: quote,
          callRequest: {
            fromAggregatedAssetId: request.selectedToken.aggregatedAssetId,
            account: quote.account,
            quote: quote,
          },
          expirationTimestamp,
        };

        setState(prev => ({ ...prev, preparedQuoteData, loading: false }));

        // Start countdown timer
        startCountdownTimer(expirationTimestamp);

        return preparedQuoteData;
      } catch (err) {
        console.error('❌ Withdraw quote error:', err);
        setState(prev => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Failed to get withdrawal quote',
          loading: false,
        }));
      }
    },
    [
      authenticated,
      embeddedWallet,
      state.loading,
      state.status,
      predictedAddress,
      startCountdownTimer,
      getPredictedAddress,
      formatAssetId,
      formatAccountAddress,
    ]
  );

  const executeWithdrawQuote = useCallback(async () => {
    if (!state.preparedQuoteData) {
      setState(prev => ({ ...prev, error: 'No quote to execute' }));
      return;
    }

    if (!embeddedWallet) {
      setState(prev => ({ ...prev, error: 'Wallet not available' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const quote = state.preparedQuoteData.preparedQuote;

      // Sign the quote if it requires signing
      if (quote.originChainsOperations && quote.originChainsOperations.length > 0) {
        const signWithEmbeddedWallet = signOperation(embeddedWallet);
        const signedQuote = { ...quote };

        for (let i = 0; i < quote.originChainsOperations.length; i++) {
          const signedOperation = await signWithEmbeddedWallet(quote.originChainsOperations[i])();
          signedQuote.originChainsOperations[i] = signedOperation;
        }

        // Execute the signed quote
        const executeResult = await quoteClient.executeQuote(signedQuote);

        if (!executeResult.success) {
          throw new Error(executeResult.error || 'Withdrawal execution failed');
        }

        // Mark execution as successful
        setState(prev => ({
          ...prev,
          executionSuccess: true,
          preparedQuoteData: null,
          timeLeft: 0,
        }));

        // Start polling for transaction status
        const quoteId = quote.id;
        statusPollingRef.current = setInterval(async () => {
          try {
            const statusResponse = await quoteClient.getQuoteStatus(quoteId);
            console.log('📊 Withdrawal status:', statusResponse);

            if (statusResponse) {
              // Handle both possible response formats - direct status or nested status
              const actualStatus =
                typeof statusResponse.status === 'string'
                  ? statusResponse.status
                  : statusResponse.status?.status;

              if (actualStatus === 'COMPLETED' || actualStatus === 'FAILED') {
                console.log('🏁 Withdrawal completed, stopping polling:', actualStatus);
                if (statusPollingRef.current) {
                  clearInterval(statusPollingRef.current);
                  statusPollingRef.current = null;
                }

                if (actualStatus === 'COMPLETED') {
                  setState(prev => ({
                    ...prev,
                    loading: false,
                    isPolling: false,
                    completedStatus: statusResponse,
                  }));
                } else {
                  setState(prev => ({
                    ...prev,
                    loading: false,
                    isPolling: false,
                    error: 'Withdrawal failed',
                  }));
                }
              } else {
                // Still in progress
                const transaction = {
                  quoteId: statusResponse.quoteId || '',
                  status: actualStatus as
                    | 'PENDING'
                    | 'IN_PROGRESS'
                    | 'COMPLETED'
                    | 'FAILED'
                    | 'REFUNDED',
                  hash: statusResponse.originChainOperations?.[0]?.hash,
                  chainId: statusResponse.originChainOperations?.[0]?.chainId,
                  explorerUrl: statusResponse.originChainOperations?.[0]?.explorerUrl,
                };
                setState(prev => ({ ...prev, status: transaction }));
              }
            }
          } catch (err) {
            console.error('Error polling withdrawal status:', err);
          }
        }, 2000);
      } else {
        throw new Error('No operations to sign in the quote');
      }
    } catch (err) {
      console.error('Execute withdrawal error:', err);
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to execute withdrawal',
        loading: false,
      }));
    }
  }, [state.preparedQuoteData, embeddedWallet]);

  const clearExecutionSuccess = useCallback(() => {
    setState(prev => ({ ...prev, executionSuccess: false }));
  }, []);

  useEffect(() => {
    return () => {
      if (statusPollingRef.current) {
        clearInterval(statusPollingRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  return {
    quote: state.preparedQuoteData,
    status: state.status,
    loading: state.loading,
    error: state.error,
    isPolling: state.isPolling,
    timeLeft: state.timeLeft,
    executionSuccess: state.executionSuccess,
    pollingTimeout: state.pollingTimeout,
    completedStatus: state.completedStatus,
    predictedAddress,
    getPredictedAddress,
    getWithdrawQuote,
    executeWithdrawQuote,
    resetQuote,
    resetUIOnly,
    resetForNewWithdraw,
    clearExecutionSuccess,
  };
};
