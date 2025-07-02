'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, Search, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAssets } from '@/lib/hooks/useAssets';
import { findTokenBySymbol } from '@/lib/constants';
import type { Asset } from '@/lib/types/assets';

interface DepositTokenSelectProps {
  selectedToken: Asset | null;
  setSelectedToken: (token: Asset) => void;
}

// Helper function to get token icon by symbol
const getTokenIconBySymbol = (symbol: string) => {
  const token = findTokenBySymbol(symbol);
  return token?.icon;
};

// Custom component to handle token images with proper fallbacks
const TokenImage = ({
  src,
  alt,
  size,
  className = '',
}: {
  src?: string | null;
  alt: string;
  size: number;
  className?: string;
}) => {
  const [imageError, setImageError] = useState(false);

  // If no src or image failed to load, show fallback
  if (!src || imageError) {
    const symbol = alt.toUpperCase();
    const colors = [
      'bg-blue-500',
      'bg-emerald-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-red-500',
    ];
    const colorIndex = symbol.charCodeAt(0) % colors.length;
    const bgColor = colors[colorIndex];

    return (
      <div
        className={`rounded-full flex items-center justify-center text-white font-bold ${bgColor} ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {symbol.charAt(0)}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      onError={() => setImageError(true)}
      unoptimized={true}
    />
  );
};

export const DepositTokenSelect = ({
  selectedToken,
  setSelectedToken,
}: DepositTokenSelectProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { assets, loading } = useAssets();

  // Filter tokens based on search query
  const filteredTokens = assets.filter(
    token =>
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTokenSelect = (token: Asset) => {
    setSelectedToken(token);
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between h-14 px-4 bg-background hover:bg-background border-0 transition-all"
        >
          <div className="flex items-center gap-3">
            {selectedToken ? (
              <>
                <TokenImage
                  src={getTokenIconBySymbol(selectedToken.symbol)}
                  alt={selectedToken.symbol}
                  size={32}
                />
                <div className="flex flex-col items-start">
                  <span className="font-medium text-foreground">{selectedToken.symbol}</span>
                  <span className="text-xs text-muted-foreground">{selectedToken.name}</span>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-muted-foreground">Select a token</span>
              </>
            )}
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Select a token
          </DialogTitle>
          <DialogDescription>
            Choose a token from the list below or search by name or symbol.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name or symbol..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Popular Tokens */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              Popular
            </Badge>
            {assets.slice(0, 4).map(token => (
              <Button
                key={token.aggregatedAssetId}
                variant="outline"
                size="sm"
                onClick={() => handleTokenSelect(token)}
                className="h-8 px-3 text-xs"
              >
                {token.symbol}
              </Button>
            ))}
          </div>

          {/* Token List */}
          <div className="max-h-80 overflow-y-auto space-y-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredTokens.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No tokens found</div>
            ) : (
              filteredTokens.map(token => (
                <Button
                  key={token.aggregatedAssetId}
                  variant="ghost"
                  onClick={() => handleTokenSelect(token)}
                  className="w-full justify-start h-16 px-3 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3 w-full">
                    <TokenImage
                      src={getTokenIconBySymbol(token.symbol)}
                      alt={token.symbol}
                      size={40}
                    />
                    <div className="flex flex-col items-start flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{token.symbol}</span>
                        <Badge variant="outline" className="text-xs">
                          {token.aggregatedEntities.length} chains
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground truncate max-w-48">
                        {token.name}
                      </span>
                    </div>
                  </div>
                </Button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
