// Format currency values
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
