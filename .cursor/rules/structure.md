# Project Structure

```
.
├── .cursor
│   └── rules
│       ├── big_changes
│       │   ├── share-management-migration-fe.md
│       │   └── share-management-migration.md
│       ├── guidelines.txt
│       ├── sdk_docs
│       │   └── ethers-docs.txt
│       ├── structure.md
│       └── update-structure.sh
├── .env.example
├── .gitignore
├── .husky
│   └── pre-commit
├── .prettierignore
├── .prettierrc
├── LICENSE
├── Makefile
├── README.md
├── app
│   ├── api
│   │   └── [...path]
│   │       └── route.ts
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   ├── manifest.ts
│   ├── page.tsx
│   ├── providers.tsx
│   ├── robots.ts
│   └── sitemap.ts
├── components
│   ├── BalanceDisplay.tsx
│   ├── BotHealthStatus.tsx
│   ├── ConnectButton.tsx
│   ├── DepositDisplay.tsx
│   ├── DepositTokenSelect.tsx
│   ├── Header.tsx
│   ├── ModeToggle.tsx
│   ├── QuoteValidityBar.tsx
│   ├── ThemeProvider.tsx
│   ├── TokenVaultCard.tsx
│   ├── VaultDashboard.tsx
│   ├── Vaults.tsx
│   ├── ui
│   │   ├── alert.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── progress.tsx
│   │   ├── select.tsx
│   │   ├── skeleton.tsx
│   │   └── token-image.tsx
│   ├── vault
│   │   ├── CrossChainAllocations.tsx
│   │   ├── TokenInfo.tsx
│   │   ├── UserPosition.tsx
│   │   └── VaultMetrics.tsx
│   └── wallet
│       ├── AccountAddress.tsx
│       ├── AssetList.tsx
│       ├── PortfolioSummary.tsx
│       └── WalletHeader.tsx
├── components.json
├── env.d.ts
├── eslint.config.mjs
├── lib
│   ├── api
│   │   ├── account.ts
│   │   ├── assets.ts
│   │   ├── balances.ts
│   │   ├── bot.ts
│   │   └── chains.ts
│   ├── api.ts
│   ├── constants.ts
│   ├── contexts
│   │   └── PredictedAddressContext.tsx
│   ├── hooks
│   │   ├── index.ts
│   │   ├── useAssets.ts
│   │   ├── useBalances.ts
│   │   ├── useBotMultiVaultData.ts
│   │   ├── useChains.ts
│   │   ├── useDepositQuotes.ts
│   │   ├── useEmbeddedWallet.ts
│   │   ├── useMultiVaultData.ts
│   │   ├── useVaultData.ts
│   │   └── useWithdraw.ts
│   ├── types
│   │   ├── assets.ts
│   │   ├── balances.ts
│   │   ├── bot.ts
│   │   ├── chains.ts
│   │   ├── quote.ts
│   │   └── vault.ts
│   ├── utils
│   │   ├── chain.ts
│   │   ├── conversions.ts
│   │   ├── signer.ts
│   │   ├── token.ts
│   │   └── vaultCalculations.ts
│   └── utils.ts
├── next.config.ts
├── package.json
├── pnpm-lock.yaml
├── postcss.config.mjs
├── public
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── og-image.png
│   ├── vercel.svg
│   └── window.svg
└── tsconfig.json

20 directories, 98 files
```
