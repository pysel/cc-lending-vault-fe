// Updated: Removed redundant hooks, bot API is now the single source of truth for all vault data
// All hooks now use the unified VaultData interface from bot API

export { useAssets } from './useAssets';
export { useBalances } from './useBalances';
export { useBotMultiVaultData } from './useBotMultiVaultData';
export { useEmbeddedWallet } from './useEmbeddedWallet';
export { useChains } from './useChains';
export { useVaultData } from './useVaultData';
export { useDepositQuotes } from './useDepositQuotes';
export { useWithdraw } from './useWithdraw';
export { useWithdrawCustom } from './useWithdrawCustom';

// Bot API hooks - single source of truth for vault data
// Alias for backward compatibility
export { useBotMultiVaultData as useMultiVaultData } from './useBotMultiVaultData';
