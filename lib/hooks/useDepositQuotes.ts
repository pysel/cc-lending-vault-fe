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
import { parseAbi, encodeFunctionData } from 'viem';
import { useEmbeddedWallet } from './useEmbeddedWallet';
import { usePredictedAddress } from '@/lib/contexts/PredictedAddressContext';
import { Asset } from '@/lib/types/assets';

interface DepositQuoteState {
  quote: Quote | null;
  preparedQuoteData: {
    preparedQuote: any;
    callRequest: any;
    expirationTimestamp?: number;
  } | null;
  status: any | null;
  loading: boolean;
  error: string | null;
  isPolling: boolean;
  timeLeft: number;
  executionSuccess: boolean;
  pollingTimeout: boolean;
  completedStatus: any | null;
}

// Simple interface for components to use
interface SimpleDepositRequest {
  selectedToken: Asset;
  amount: string;
  vaultAddress: string;
  targetChain: string;
}

export const useDepositQuotes = () => {
  const { authenticated } = usePrivy();
  const embeddedWallet = useEmbeddedWallet();
  const { predictedAddress, getPredictedAddress } = usePredictedAddress();
  const statusPollingRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastQuoteRequestRef = useRef<SimpleDepositRequest | null>(null);

  const [state, setState] = useState<DepositQuoteState>({
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
    // Clear countdown timer
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
      // Keep isPolling and polling state
      isPolling: prev.isPolling,
      timeLeft: 0,
      executionSuccess: false,
      pollingTimeout: false,
      completedStatus: prev.completedStatus, // Preserve completedStatus to allow green notification
    }));
  }, []);

  const resetForNewDeposit = useCallback(() => {
    // Clear any active polling
    if (statusPollingRef.current) {
      console.log('🧹 Clearing polling in resetForNewDeposit');
      clearInterval(statusPollingRef.current);
      statusPollingRef.current = null;
    }

    // Clear countdown timer
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    lastQuoteRequestRef.current = null;

    // Reset everything including status for a completely new deposit
    setState(prev => ({
      quote: null,
      preparedQuoteData: null,
      status: null,
      loading: false,
      error: null,
      isPolling: false,
      timeLeft: 0,
      executionSuccess: false,
      pollingTimeout: false,
      completedStatus: null, // Clear completedStatus too when fully resetting
    }));
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

      // Only auto-refresh quote if not executing and no status exists
      if (timeLeft <= 10 && timeLeft > 0 && lastQuoteRequestRef.current) {
        setState(currentState => {
          // Don't auto-refresh if transaction is in progress or completed
          if (currentState.loading || currentState.status || currentState.executionSuccess) {
            return currentState;
          }

          return currentState;
        });
      }

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

  const getDepositQuote = useCallback(
    async (request: SimpleDepositRequest) => {
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

      // Check if we already have a valid quote for the same request
      if (state.preparedQuoteData && state.timeLeft > 20 && lastQuoteRequestRef.current) {
        const isSameRequest =
          lastQuoteRequestRef.current.selectedToken.aggregatedAssetId ===
            request.selectedToken.aggregatedAssetId &&
          lastQuoteRequestRef.current.amount === request.amount &&
          lastQuoteRequestRef.current.vaultAddress === request.vaultAddress;

        if (isSameRequest) {
          return state.preparedQuoteData;
        }
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

        // Find the Arbitrum asset type for this token (target chain where vault lives)
        const arbitrumAsset = request.selectedToken.aggregatedEntities.find(
          entity => entity.assetType.startsWith('eip155:42161/') // Arbitrum chain ID
        );

        if (!arbitrumAsset) {
          throw new Error(`${request.selectedToken.symbol} is not available on Arbitrum`);
        }

        // Use Arbitrum asset type for tokensRequired and allowanceRequirements
        const arbitrumAssetType = arbitrumAsset.assetType;

        // Define the deposit function ABI - simplified for bot-managed system
        const depositAbi = parseAbi(['function deposit(address user, uint256 amount)']);

        // Encode the deposit function call data - no shares calculation needed
        const depositCalldata = encodeFunctionData({
          abi: depositAbi,
          functionName: 'deposit',
          args: [predicted as Hex, BigInt(amountWei)],
        });

        // Create EVM account
        const evmAccount: EvmAccount = {
          accountAddress: predicted as Hex,
          sessionAddress: embeddedWallet.address as Hex,
          adminAddress: embeddedWallet.address as Hex,
        };

        // Prepare the call request using the specific chain asset type
        const prepareRequest: PrepareCallRequest = {
          account: evmAccount,
          targetChain: request.targetChain,
          calls: [
            {
              to: request.vaultAddress as Hex,
              data: depositCalldata as Hex,
              value: '0x0',
            },
          ],
          tokensRequired: [
            {
              assetType: arbitrumAssetType, // Always use target chain (Arbitrum) asset type
              amount: amountWei,
            },
          ],
          allowanceRequirements: [
            {
              assetType: arbitrumAssetType, // Always use target chain (Arbitrum) asset type
              amount: amountWei,
              spender: request.vaultAddress as Hex,
            },
          ],
        };

        console.log('prepareRequest', prepareRequest);
        const preparedQuote = await quoteClient.prepareCallQuote(prepareRequest);

        if (!preparedQuote.chainOperation) {
          throw new Error('Invalid response: missing chainOperation');
        }

        // Generate expiration timestamp (30 seconds from now)
        const expirationTimestamp = Math.floor(Date.now() / 1000) + 30;

        // Store the prepared quote and request data for later signing
        const quoteData = {
          preparedQuote,
          callRequest: {
            fromAggregatedAssetId: request.selectedToken.aggregatedAssetId,
            account: evmAccount,
            tamperProofSignature: preparedQuote.tamperProofSignature,
            chainOperation: preparedQuote.chainOperation, // Will be signed later
          },
          expirationTimestamp,
        };

        setState(prev => ({ ...prev, preparedQuoteData: quoteData, loading: false }));

        // Start countdown timer
        startCountdownTimer(expirationTimestamp);

        return quoteData;
      } catch (err) {
        console.error('❌ Deposit quote error:', err);
        setState(prev => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Failed to get deposit quote',
          loading: false,
        }));
      }
    },
    [
      authenticated,
      embeddedWallet,
      state.loading,
      state.status,
      state.preparedQuoteData,
      state.timeLeft,
      predictedAddress,
      startCountdownTimer,
      getPredictedAddress,
    ]
  );

  const executeDepositQuote = useCallback(async () => {
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
      // Step 1: Sign the chain operation using Privy's wallet
      const signWithEmbeddedWallet = signOperation(embeddedWallet);
      const signedChainOp = await signWithEmbeddedWallet(
        state.preparedQuoteData.preparedQuote.chainOperation
      )();

      // Step 2: Create the call request with signed operation
      const callRequest: CallRequest = {
        ...state.preparedQuoteData.callRequest,
        chainOperation: signedChainOp,
      };

      // Step 3: Fetch the call quote
      const quote = await quoteClient.fetchCallQuote(callRequest);
      console.log('quote', quote);

      // Check if quote is valid
      if (!quote.id || !quote.account || !quote.originChainsOperations) {
        throw new Error('Invalid quote received from API');
      }

      // Step 4: Sign all origin chain operations
      const signedQuote = { ...quote };

      for (let i = 0; i < quote.originChainsOperations.length; i++) {
        const signedOperation = await signWithEmbeddedWallet(quote.originChainsOperations[i])();
        signedQuote.originChainsOperations[i] = signedOperation;
      }

      // Step 5: Execute the signed quote
      const executeResult = await quoteClient.executeQuote(signedQuote);

      if (!executeResult.success) {
        throw new Error(executeResult.error || 'Quote execution failed');
      }

      // Mark execution as successful and clear prepared quote data to reset to clean state
      setState(prev => ({
        ...prev,
        executionSuccess: true,
        preparedQuoteData: null, // Clear to reset to clean home state
        timeLeft: 0, // Clear countdown
      }));

      // Step 6: Start polling for status
      setState(prev => ({ ...prev, isPolling: true }));

      // Store quote ID for polling
      const quoteId = quote.id;
      console.log('🔄 Starting status polling for quote:', quoteId);
      const startTime = Date.now();
      const maxPollingTime = 10 * 1000; // 10 seconds

      // Clear any existing polling
      if (statusPollingRef.current) {
        clearInterval(statusPollingRef.current);
      }

      statusPollingRef.current = setInterval(async () => {
        try {
          const elapsed = Date.now() - startTime;

          // Stop polling after 10 seconds
          if (elapsed > maxPollingTime) {
            if (statusPollingRef.current) {
              clearInterval(statusPollingRef.current);
              statusPollingRef.current = null;
            }
            setState(prev => ({ ...prev, isPolling: false, loading: false, pollingTimeout: true }));
            return;
          }

          // Use getQuoteStatus instead of fetchTransactionHistory
          const quoteStatus = await quoteClient.getQuoteStatus(quoteId);
          console.log('Quote status response:', quoteStatus);

          if (quoteStatus) {
            console.log('Raw quote status:', quoteStatus);

            // Handle both possible response formats - direct status or nested status
            const actualStatus =
              typeof quoteStatus.status === 'string'
                ? quoteStatus.status
                : quoteStatus.status?.status;

            console.log('Extracted status:', actualStatus);

            if (actualStatus) {
              // If the transaction is completed or failed, stop polling
              if (actualStatus === 'COMPLETED' || actualStatus === 'FAILED') {
                console.log('🏁 Transaction completed, stopping polling:', actualStatus);
                if (statusPollingRef.current) {
                  clearInterval(statusPollingRef.current);
                  statusPollingRef.current = null;
                }

                // Handle completed/failed states
                if (actualStatus === 'COMPLETED') {
                  console.log('✅ Transaction completed - will show green notification');
                  // Don't set status state for COMPLETED - just stop polling
                  // The green notification will be triggered via a custom event or callback
                  setState(prev => ({
                    ...prev,
                    loading: false,
                    isPolling: false,
                    // Trigger completion via a different mechanism
                    completedStatus: quoteStatus,
                  }));
                } else if (actualStatus === 'FAILED' || actualStatus === 'REFUNDED') {
                  // For FAILED, we do want to show the error state
                  const transaction = {
                    quoteId: quoteStatus.quoteId,
                    status: actualStatus,
                    hash: quoteStatus.originChainOperations?.[0]?.hash,
                    chainId: quoteStatus.originChainOperations?.[0]?.chainId,
                    explorerUrl: quoteStatus.originChainOperations?.[0]?.explorerUrl,
                  };
                  setState(prev => ({
                    ...prev,
                    status: transaction,
                    loading: false,
                    isPolling: false,
                    error: 'Transaction failed',
                  }));
                }
              } else {
                // For PENDING/IN_PROGRESS, still set status to show progress
                const transaction = {
                  quoteId: quoteStatus.quoteId,
                  status: actualStatus,
                  hash: quoteStatus.originChainOperations?.[0]?.hash,
                  chainId: quoteStatus.originChainOperations?.[0]?.chainId,
                  explorerUrl: quoteStatus.originChainOperations?.[0]?.explorerUrl,
                };
                setState(prev => ({ ...prev, status: transaction }));
              }
            }
          } else {
            console.log('No valid quote status received, continuing polling...');
          }
        } catch (err) {
          console.error('Error polling quote status:', err);
          // Continue polling even if individual requests fail
        }
      }, 2000); // Poll every 2 seconds (less aggressive)
    } catch (err) {
      console.error('Execute deposit error:', err);
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to execute deposit',
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
    getDepositQuote,
    executeDepositQuote,
    resetQuote,
    resetUIOnly,
    resetForNewDeposit,
    clearExecutionSuccess,
  };
};
