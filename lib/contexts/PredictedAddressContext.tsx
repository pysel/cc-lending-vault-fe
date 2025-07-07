'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useEmbeddedWallet } from '@/lib/hooks/useEmbeddedWallet';
import { accountApi } from '@/lib/api/account';

interface PredictedAddressContextType {
  predictedAddress: string | null;
  getPredictedAddress: () => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
  isUserAddressReady: boolean;
}

const PredictedAddressContext = createContext<PredictedAddressContextType | undefined>(undefined);

export const PredictedAddressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [predictedAddress, setPredictedAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUserAddressReady, setIsUserAddressReady] = useState(false);
  const embeddedWallet = useEmbeddedWallet();

  // Get the predicted address for the account
  const getPredictedAddress = useCallback(async () => {
    if (!embeddedWallet || !embeddedWallet.address) {
      setIsUserAddressReady(false);
      return null;
    }

    // Return cached address if available
    if (predictedAddress) {
      setIsUserAddressReady(true);
      return predictedAddress;
    }

    setIsLoading(true);
    setError(null);
    setIsUserAddressReady(false);

    try {
      // Use the same wallet address for both session and admin
      const address = embeddedWallet.address;
      const predicted = await accountApi.predictAddress(address, address);
      setPredictedAddress(predicted);
      setIsUserAddressReady(true);
      return predicted;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to predict address';
      setError(errorMessage);
      setIsUserAddressReady(false);
      console.error('Failed to predict address:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [embeddedWallet, predictedAddress]);

  // Clear when wallet disconnects or changes - with proper state reset
  useEffect(() => {
    if (!embeddedWallet) {
      // Clear all state when wallet disconnects
      setPredictedAddress(null);
      setError(null);
      setIsUserAddressReady(false);
    } else if (embeddedWallet.address && predictedAddress) {
      // Check if wallet address changed (different user)
      const currentWalletAddress = embeddedWallet.address;
      // If we have a predicted address but wallet changed, clear it
      // This will be detected and handled by the getPredictedAddress logic
      setIsUserAddressReady(true);
    }
  }, [embeddedWallet, predictedAddress]);

  const value = {
    predictedAddress,
    getPredictedAddress,
    isLoading,
    error,
    isUserAddressReady,
  };

  return (
    <PredictedAddressContext.Provider value={value}>{children}</PredictedAddressContext.Provider>
  );
};

export const usePredictedAddress = () => {
  const context = useContext(PredictedAddressContext);
  if (context === undefined) {
    throw new Error('usePredictedAddress must be used within a PredictedAddressProvider');
  }
  return context;
};
