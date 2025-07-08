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
import { useChains } from '@/lib/hooks/useChains';
import { getChainConfig } from '@/lib/types/chains';

interface ChainSelectProps {
  selectedChain: string | null;
  setSelectedChain: (chainId: string) => void;
  placeholder?: string;
}

// Custom component to handle chain images with proper fallbacks
const ChainImage = ({
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
    return (
      <div
        className={`rounded-full flex items-center justify-center bg-muted text-muted-foreground font-bold ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {alt.charAt(0)}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-contain ${className}`}
      onError={() => setImageError(true)}
      unoptimized={true}
    />
  );
};

export const ChainSelect = ({
  selectedChain,
  setSelectedChain,
  placeholder = 'Select a chain',
}: ChainSelectProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { chains, loading } = useChains();

  // Get chain display info
  const getChainDisplayInfo = (chainId: string) => {
    const config = getChainConfig(chainId);
    return {
      name: config?.name || `Chain ${chainId}`,
      logoUrl: config?.logoUrl || null,
    };
  };

  // Filter chains based on search query
  const filteredChains = chains.filter(chain => {
    const chainId = chain.chain.reference;
    const displayInfo = getChainDisplayInfo(chainId);
    return (
      displayInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chainId.includes(searchQuery)
    );
  });

  const handleChainSelect = (chainId: string) => {
    setSelectedChain(chainId);
    setOpen(false);
    setSearchQuery('');
  };

  const selectedChainInfo = selectedChain ? getChainDisplayInfo(selectedChain) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between h-14 px-4 bg-background hover:bg-background border-0 transition-all"
        >
          <div className="flex items-center gap-3">
            {selectedChainInfo ? (
              <>
                <ChainImage
                  src={selectedChainInfo.logoUrl}
                  alt={selectedChainInfo.name}
                  size={32}
                />
                <div className="flex flex-col items-start">
                  <span className="font-medium text-foreground">{selectedChainInfo.name}</span>
                  <span className="text-xs text-muted-foreground">Chain ID: {selectedChain}</span>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-muted-foreground">{placeholder}</span>
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
            Select target chain
          </DialogTitle>
          <DialogDescription>
            Choose the blockchain network where you want to receive your tokens.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chains..."
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

          {/* Popular Chains */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              Popular
            </Badge>
            {['1', '42161', '8453', '10'].map(chainId => {
              const chainInfo = getChainDisplayInfo(chainId);
              return (
                <Button
                  key={chainId}
                  variant="outline"
                  size="sm"
                  onClick={() => handleChainSelect(chainId)}
                  className="h-8 px-3 text-xs"
                >
                  {chainInfo.name}
                </Button>
              );
            })}
          </div>

          {/* Chain List */}
          <div className="max-h-80 overflow-y-auto space-y-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredChains.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No chains found</div>
            ) : (
              filteredChains.map(chain => {
                const chainId = chain.chain.reference;
                const chainInfo = getChainDisplayInfo(chainId);
                return (
                  <Button
                    key={chainId}
                    variant="ghost"
                    onClick={() => handleChainSelect(chainId)}
                    className="w-full justify-start h-16 px-3 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <ChainImage src={chainInfo.logoUrl} alt={chainInfo.name} size={40} />
                      <div className="flex flex-col items-start flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{chainInfo.name}</span>
                          {chain.isTestnet && (
                            <Badge variant="outline" className="text-xs">
                              Testnet
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">Chain ID: {chainId}</span>
                      </div>
                    </div>
                  </Button>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
