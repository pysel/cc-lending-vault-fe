// Implemented a deposit button component that integrates with Privy's fund wallet feature.
// This component fetches the predicted smart contract account address and initiates the
// funding flow for USDC on the Arbitrum network. It also handles loading and error states.
'use client';

import React, { useState } from 'react';
import { FundWalletConfig, MoonpayConfig, useFundWallet } from '@privy-io/react-auth';
import { usePredictedAddress } from '@/lib/contexts/PredictedAddressContext';
import { Button } from '@/components/ui/button';
import { ArrowDownToLine, Loader2 } from 'lucide-react';
import { arbitrum } from 'viem/chains';
import { tokenList } from '@/lib/constants';
import { Address } from 'viem';

export function DepositButton() {
  const { fundWallet } = useFundWallet();
  const {
    predictedAddress,
    getPredictedAddress,
    isLoading: isAddressLoading,
  } = usePredictedAddress();
  const [isFunding, setIsFunding] = useState(false);

  const moonpayConfig: FundWalletConfig = {
    chain: arbitrum,
    asset: 'USDC',
    amount: '100',
    card: {
      preferredProvider: 'moonpay',
    },
  };

  const handleDeposit = async () => {
    setIsFunding(true);
    try {
      let address = predictedAddress;
      if (!address) {
        address = await getPredictedAddress();
      }

      if (!address) {
        console.error('Could not retrieve account address. Please try again or refresh the page.');
        window.location.reload();
        return;
      }

      const usdcToken = tokenList.find(token => token.symbol === 'USDC');
      const usdcAddress = usdcToken?.address?.[arbitrum.id];

      if (!usdcAddress) {
        console.error('USDC address for Arbitrum is not configured.');
        return;
      }

      await fundWallet(address as Address, {
        chain: arbitrum,
        asset: 'USDC',
        amount: '100',
        card: {
          preferredProvider: 'moonpay',
        },
      });
    } catch (error) {
      console.error('Error funding wallet:', error);
    } finally {
      setIsFunding(false);
    }
  };

  const isLoading = isAddressLoading || isFunding;

  return (
    <Button
      onClick={handleDeposit}
      variant="ghost"
      size="sm"
      className="text-green-500 hover:text-green-600 disabled:opacity-50"
      disabled={isLoading}
      title="Deposit funds"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ArrowDownToLine className="h-4 w-4" />
      )}
    </Button>
  );
}
