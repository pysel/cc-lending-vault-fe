import { useState, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import {
  quoteClient,
  type EvmAccount,
  type PrepareCallRequest,
  type CallRequest,
  type Hex,
} from '@/lib/api';
import { signOperation } from '@/lib/utils/signer';
import { parseAbi, encodeFunctionData } from 'viem';
import { useEmbeddedWallet } from './useEmbeddedWallet';
import { ARBITRUM_TARGET_CHAIN_ID, findAggregatedAssetIdByArbitrumAddress } from '../constants';

interface WithdrawState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

interface WithdrawRequest {
  vaultAddress: string;
  userAddress: string;
  targetChain: string;
  tokenAddress: string;
}

export const useWithdraw = () => {
  const { authenticated } = usePrivy();
  const embeddedWallet = useEmbeddedWallet();

  const [state, setState] = useState<WithdrawState>({
    loading: false,
    error: null,
    success: false,
  });

  const executeWithdraw = useCallback(
    async (request: WithdrawRequest) => {
      if (!authenticated || !embeddedWallet) {
        setState(prev => ({ ...prev, error: 'Wallet not connected' }));
        return;
      }

      // No need to check shares - bot-managed system handles all user funds

      setState(prev => ({ ...prev, loading: true, error: null, success: false }));

      try {
        // Log withdrawal details for debugging
        console.log('🔄 Starting withdrawal with bot-managed approach:', {
          vaultAddress: request.vaultAddress,
          userAddress: request.userAddress,
          tokenAddress: request.tokenAddress,
        });

        // Define the withdraw function ABI - simplified for bot-managed system
        const withdrawAbi = parseAbi(['function withdraw(address user)']);

        // Encode the withdraw function call data - no shares needed, withdraws all
        const withdrawCalldata = encodeFunctionData({
          abi: withdrawAbi,
          functionName: 'withdraw',
          args: [request.userAddress as Hex],
        });

        // Create EVM account
        const evmAccount: EvmAccount = {
          accountAddress: request.userAddress as Hex,
          sessionAddress: embeddedWallet.address as Hex,
          adminAddress: embeddedWallet.address as Hex,
        };

        // Prepare the call request - simplified for withdrawals
        const prepareRequest: PrepareCallRequest = {
          account: evmAccount,
          targetChain: request.targetChain,
          calls: [
            {
              to: request.vaultAddress as Hex,
              data: withdrawCalldata as Hex,
              value: '0x0',
            },
          ],
          tokensRequired: [
            {
              assetType: `${ARBITRUM_TARGET_CHAIN_ID}/erc20:${request.tokenAddress}`,
              amount: '0x0',
            },
          ],
        };

        console.log('📋 Withdraw prepareRequest:', prepareRequest);

        const preparedQuote = await quoteClient.prepareCallQuote(prepareRequest);
        console.log('📋 Withdraw preparedQuote:', preparedQuote);

        if (!preparedQuote.chainOperation) {
          console.error('❌ Missing chainOperation in response:', preparedQuote);
          throw new Error('Invalid response: missing chainOperation');
        }

        // Step 1: Sign the chain operation using Privy's wallet
        const signWithEmbeddedWallet = signOperation(embeddedWallet);
        const signedChainOp = await signWithEmbeddedWallet(preparedQuote.chainOperation)();

        const tokenAggregatedAssetId = findAggregatedAssetIdByArbitrumAddress(request.tokenAddress);
        console.log('🔗 Withdraw tokenAggregatedAssetId:', {
          tokenAddress: request.tokenAddress,
          aggregatedAssetId: tokenAggregatedAssetId,
        });

        // Step 2: Create the call request with signed operation
        const callRequest: CallRequest = {
          fromAggregatedAssetId: tokenAggregatedAssetId || '',
          account: evmAccount,
          tamperProofSignature: preparedQuote.tamperProofSignature,
          chainOperation: signedChainOp,
        };

        console.log('📋 Withdraw callRequest:', callRequest);

        // Step 3: Fetch the call quote
        const quote = await quoteClient.fetchCallQuote(callRequest);
        console.log('📋 Withdraw quote:', quote);

        // Check if quote is valid
        if (!quote.id || !quote.account || !quote.originChainsOperations) {
          throw new Error('Invalid withdraw quote received from API');
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
          throw new Error(executeResult.error || 'Withdraw execution failed');
        }

        console.log('✅ Withdrawal successful - all user funds withdrawn:', {
          userAddress: request.userAddress,
          quoteId: quote.id,
        });

        setState(prev => ({ ...prev, loading: false, success: true }));
      } catch (err) {
        console.error('❌ Execute withdraw error:', err);
        setState(prev => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Failed to execute withdrawal',
          loading: false,
        }));
      }
    },
    [authenticated, embeddedWallet]
  );

  const resetState = useCallback(() => {
    setState({
      loading: false,
      error: null,
      success: false,
    });
  }, []);

  return {
    ...state,
    executeWithdraw,
    resetState,
  };
};
