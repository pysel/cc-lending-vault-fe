// Utility functions for formatting and converting data types
// Updated: Added percentageStringToBasisPoints function to handle decimal percentage strings from bot API
export const formatCurrency = (value: bigint | undefined, decimals: number = 18) => {
  if (!value) return '0.00';
  const num = Number(value) / Math.pow(10, decimals);
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
};

// Format percentage
export const formatPercentage = (value: bigint | undefined) => {
  if (!value) return '0.00%';
  const num = Number(value) / 100; // Assuming APY is stored as basis points
  return `${num.toFixed(2)}%`;
};

// Format share price (usually in 18 decimals)
export const formatSharePrice = (value: bigint | undefined, tokenDecimals: number = 18) => {
  if (!value) return '1.00';
  const num = Number(value) / Math.pow(10, 18 + tokenDecimals);
  return num.toFixed(6);
};

// Convert percentage string to basis points BigInt
// Handles decimal percentages from bot API (e.g., "0.03479" -> 347n basis points)
export const percentageStringToBasisPoints = (percentageStr: string): bigint => {
  if (!percentageStr || percentageStr === '0') return 0n;

  try {
    const percentage = parseFloat(percentageStr);
    if (isNaN(percentage)) return 0n;

    // Convert to basis points (multiply by 10000)
    const basisPoints = Math.round(percentage * 10000);
    return BigInt(basisPoints);
  } catch {
    return 0n;
  }
};
