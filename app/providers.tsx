'use client';

import React from 'react';
import PlausibleProvider from 'next-plausible';
import { PrivyProvider } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/ThemeProvider';
import { PredictedAddressProvider } from '@/lib/contexts/PredictedAddressContext';

// Create a client
const queryClient = new QueryClient();

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => (
  <PlausibleProvider domain="onebalance-chain-abstracted-swap.vercel.app">
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <PrivyProvider
          appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
          config={{
            embeddedWallets: {
              createOnLogin: 'users-without-wallets',
            },
            loginMethods: ['email', 'google', 'sms', 'passkey', 'wallet'],
            appearance: {
              theme: 'dark',
              // accentColor: '#fa9e39',
            },
            fundingMethodConfig: {
              moonpay: {
                useSandbox: true,
                uiConfig: {
                  theme: 'dark',
                  // accentColor: '#fa9e39',
                },
              },
            },
          }}
        >
          <PredictedAddressProvider>{children}</PredictedAddressProvider>
        </PrivyProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </PlausibleProvider>
);
