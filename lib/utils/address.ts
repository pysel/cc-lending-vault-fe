/**
 * Address validation utilities for EVM addresses
 * Used in withdrawal component to validate recipient addresses
 */

/**
 * Validates if a string is a valid Ethereum address
 * @param address - The address string to validate
 * @returns true if valid, false otherwise
 */
export const isValidEthereumAddress = (address: string): boolean => {
  // Check if it's a valid hex string with 0x prefix and correct length
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethAddressRegex.test(address);
};

/**
 * Validates if a string could be an ENS name
 * @param address - The address string to validate
 * @returns true if it looks like an ENS name, false otherwise
 */
export const isValidENSName = (address: string): boolean => {
  // Basic ENS validation - ends with .eth and contains valid characters
  const ensRegex = /^[a-zA-Z0-9-]+\.eth$/;
  return ensRegex.test(address);
};

/**
 * Validates if a string is a valid EVM address (Ethereum address or ENS)
 * @param address - The address string to validate
 * @returns true if valid, false otherwise
 */
export const isValidEVMAddress = (address: string): boolean => {
  if (!address || typeof address !== 'string') {
    return false;
  }

  // Trim whitespace
  const trimmedAddress = address.trim();

  // Check if it's a valid Ethereum address or ENS name
  return isValidEthereumAddress(trimmedAddress) || isValidENSName(trimmedAddress);
};

/**
 * Formats an address for display (shortens long addresses)
 * @param address - The address to format
 * @param startChars - Number of characters to show at start (default: 6)
 * @param endChars - Number of characters to show at end (default: 4)
 * @returns Formatted address string
 */
export const formatAddressForDisplay = (
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string => {
  if (!address) return '';

  // If it's an ENS name, show it as is
  if (isValidENSName(address)) {
    return address;
  }

  // If it's too short to truncate, show as is
  if (address.length <= startChars + endChars) {
    return address;
  }

  // Truncate long addresses
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

/**
 * Normalizes an address by trimming whitespace and converting to lowercase
 * @param address - The address to normalize
 * @returns Normalized address string
 */
export const normalizeAddress = (address: string): string => {
  if (!address || typeof address !== 'string') {
    return '';
  }

  return address.trim().toLowerCase();
};

/**
 * Validates and provides detailed error message for address validation
 * @param address - The address to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export const validateAddressWithMessage = (
  address: string
): {
  isValid: boolean;
  error?: string;
} => {
  if (!address || typeof address !== 'string') {
    return { isValid: false, error: 'Address is required' };
  }

  const trimmedAddress = address.trim();

  if (!trimmedAddress) {
    return { isValid: false, error: 'Address is required' };
  }

  if (!isValidEVMAddress(trimmedAddress)) {
    return {
      isValid: false,
      error:
        'Invalid address format. Please enter a valid Ethereum address (0x...) or ENS name (.eth)',
    };
  }

  return { isValid: true };
};
