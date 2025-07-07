// Hooks exports - Consolidated VaultData type system
// All hooks now use the unified VaultData interface

export { useAssets } from './useAssets';
export { useBalances } from './useBalances';
export { useChains } from './useChains';
export { useVaultData } from './useVaultData';
export { useMultiVaultData } from './useMultiVaultData';
export { useDepositQuotes } from './useDepositQuotes';
export { useWithdraw } from './useWithdraw';
export { useEmbeddedWallet } from './useEmbeddedWallet';

// Bot-managed share system hooks (using unified VaultData)
export { useBotMultiVaultData } from './useBotMultiVaultData';
