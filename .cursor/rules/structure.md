# Project Structure

```
.
├── .cursor
│   └── rules
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
│   │   ├── select.tsx
│   │   ├── skeleton.tsx
│   │   └── token-image.tsx
│   ├── vault
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
│   │   └── chains.ts
│   ├── api.ts
│   ├── constants.ts
│   ├── contexts
│   │   └── PredictedAddressContext.tsx
│   ├── hooks
│   │   ├── index.ts
│   │   ├── useAssets.ts
│   │   ├── useBalances.ts
│   │   ├── useChains.ts
│   │   ├── useDepositQuotes.ts
│   │   ├── useEmbeddedWallet.ts
│   │   ├── useMultiVaultData.ts
│   │   ├── useVaultData.ts
│   │   └── useWithdraw.ts
│   ├── types
│   │   ├── assets.ts
│   │   ├── balances.ts
│   │   ├── chains.ts
│   │   └── quote.ts
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

19 directories, 89 files
```
