'use client';

import { useState } from 'react';
import Image from 'next/image';
import { RefreshCw, Wallet, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BalanceByAssetDto } from '@/lib/types/balances';
import { Asset } from '@/lib/types/assets';
import { formatTokenAmount } from '@/lib/utils/token';
import { getChainName, getChainLogoUrl, extractChainIdFromAssetType } from '@/lib/types/chains';
import { findTokenBySymbol } from '@/lib/constants';

interface AssetListProps {
  balances?: BalanceByAssetDto[];
  assets: Asset[];
  loading: boolean;
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

// Custom component for chain images with proper fallbacks
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

export const AssetList = ({ balances, assets, loading }: AssetListProps) => {
  const [expandedAssets, setExpandedAssets] = useState<Set<string>>(new Set());

  // Helper functions
  const getAssetSymbol = (assetId: string) => {
    return assetId.split(':')[1]?.toUpperCase() || assetId;
  };

  const getAssetDecimals = (aggregatedAssetId: string) => {
    const asset = assets.find(a => a.aggregatedAssetId === aggregatedAssetId);
    return asset?.decimals || 18;
  };

  const getAssetsWithPositiveValue = () => {
    if (!balances) return [];
    return balances.filter(asset => asset.fiatValue && asset.fiatValue > 0);
  };

  const hasAssets = getAssetsWithPositiveValue().length > 0;

  const getChainInfo = (assetType: string) => {
    const chainId = extractChainIdFromAssetType(assetType);
    return {
      name: getChainName(chainId),
      logoUrl: getChainLogoUrl(chainId),
      chainId,
    };
  };

  const toggleAssetExpansion = (assetId: string) => {
    setExpandedAssets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Asset Balances</h3>
        {loading && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Loading...
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="flex items-center justify-between p-3 border border-border rounded-xl bg-card"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="w-16 h-4" />
                  <Skeleton className="w-12 h-3" />
                </div>
              </div>
              <div className="space-y-1 text-right">
                <Skeleton className="w-16 h-4" />
                <Skeleton className="w-20 h-3" />
              </div>
            </div>
          ))}
        </div>
      ) : hasAssets ? (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {getAssetsWithPositiveValue()
            .sort((a, b) => (b.fiatValue || 0) - (a.fiatValue || 0))
            .map(asset => {
              const symbol = getAssetSymbol(asset.aggregatedAssetId);
              const chainCount = asset.individualAssetBalances.length;
              const isExpanded = expandedAssets.has(asset.aggregatedAssetId);

              return (
                <Card
                  key={asset.aggregatedAssetId}
                  className="border-border hover:border-muted-foreground/20 transition-all duration-200 overflow-hidden bg-card"
                >
                  {/* Main Asset Row */}
                  <div className="px-4 py-1 transition-colors duration-200">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border shadow-sm">
                          <TokenImage src={getTokenIconBySymbol(symbol)} alt={symbol} size={40} />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{symbol}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <button
                              onClick={() => toggleAssetExpansion(asset.aggregatedAssetId)}
                              className="flex items-center gap-1 hover:text-foreground cursor-pointer transition-colors"
                            >
                              {chainCount} chain{chainCount > 1 ? 's' : ''}
                              {isExpanded ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-foreground">
                          $
                          {asset.fiatValue?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || '0.00'}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {formatTokenAmount(
                            asset.balance,
                            getAssetDecimals(asset.aggregatedAssetId)
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Chain Details */}
                  {isExpanded && (
                    <div className="border-t border-border bg-muted/30">
                      <div className="p-3 space-y-2">
                        <div className="text-xs font-medium text-muted-foreground mb-3 px-1">
                          Chain Distribution
                        </div>
                        {asset.individualAssetBalances
                          .sort((a, b) => (b.fiatValue || 0) - (a.fiatValue || 0))
                          .map((individualAsset, index) => {
                            const chainInfo = getChainInfo(individualAsset.assetType);

                            return (
                              <div
                                key={`${asset.aggregatedAssetId}-${index}`}
                                className="flex items-center justify-between py-2 px-3 bg-background rounded-lg border border-border hover:border-muted-foreground/20 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-6 h-6 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                                    <ChainImage
                                      src={chainInfo.logoUrl}
                                      alt={chainInfo.name}
                                      size={24}
                                    />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-foreground">
                                      {chainInfo.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {formatTokenAmount(
                                        individualAsset.balance,
                                        getAssetDecimals(asset.aggregatedAssetId)
                                      )}{' '}
                                      {symbol}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium text-foreground">
                                    $
                                    {individualAsset.fiatValue?.toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }) || '0.00'}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {((individualAsset.fiatValue / asset.fiatValue) * 100).toFixed(
                                      1
                                    )}
                                    %
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
        </div>
      ) : (
        <div className="text-center space-y-4">
          {/* Icon and main message */}
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-muted/40 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-muted-foreground/60" />
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-foreground">No assets yet</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your token balances and portfolio will appear here once you have assets in your
              account.
            </p>
          </div>

          {/* Getting started tips */}
          <div className="bg-muted/30 text-left rounded-lg p-4 space-y-3 border border-border/50">
            <h5 className="text-sm font-medium text-foreground">Getting started:</h5>
            <ol className="list-decimal list-inside space-y-2 text-xs text-muted-foreground marker:text-primary marker:font-semibold">
              <li>Send assets directly to your Account Address above</li>
              <li>Your balances will sync across all supported chains</li>
              <li>View detailed breakdowns by expanding each asset</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};
