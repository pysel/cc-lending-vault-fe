import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Providers } from '@/app/providers';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'OneYield Cross-Chain Vault',
    template: '%s | OneBalance',
  },
  description: 'Chain-abstracted cross-chain vault for maximizing yield farming.',
  keywords: [
    'chain-abstracted',
    'defi',
    'crypto',
    'blockchain',
    'ethereum',
    'swap',
    'transfer',
    'onebalance',
    'web3',
  ],
  authors: [
    {
      name: 'pysel',
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
