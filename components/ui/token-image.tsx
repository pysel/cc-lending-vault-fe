'use client';

import { useState } from 'react';

interface TokenImageProps {
  src?: string | null;
  alt: string;
  symbol: string;
  width: number;
  height: number;
  className?: string;
}

export const TokenImage = ({
  src,
  alt,
  symbol,
  width,
  height,
  className = '',
}: TokenImageProps) => {
  const [imageError, setImageError] = useState(false);

  // If no src provided or image failed to load, show fallback
  if (!src || imageError) {
    return (
      <div
        className={`rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold ${className}`}
        style={{ width, height }}
      >
        {symbol.slice(0, 2)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setImageError(true)}
    />
  );
};
