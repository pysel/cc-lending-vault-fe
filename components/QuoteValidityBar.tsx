'use client';

import { useMemo } from 'react';
import { Clock } from 'lucide-react';

interface QuoteValidityBarProps {
  timeLeft: number;
  totalTime?: number; // Total time the quote is valid (default 30 seconds)
  className?: string;
}

export const QuoteValidityBar = ({
  timeLeft,
  totalTime = 30,
  className = '',
}: QuoteValidityBarProps) => {
  // Calculate percentage remaining
  const percentage = useMemo(() => {
    return Math.max(0, Math.min(100, (timeLeft / totalTime) * 100));
  }, [timeLeft, totalTime]);

  // Determine color based on time remaining
  const getBarColor = useMemo(() => {
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  }, [percentage]);

  const getTextColor = useMemo(() => {
    if (percentage > 50) return 'text-green-600';
    if (percentage > 20) return 'text-yellow-600';
    return 'text-red-600';
  }, [percentage]);

  // Format time display
  const formatTime = (seconds: number) => {
    if (seconds <= 0) return '0s';
    return `${seconds}s`;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className={`h-4 w-4 ${getTextColor}`} />
          <span className={`text-sm font-medium ${getTextColor}`}>Quote Valid</span>
        </div>
        <span className={`font-mono font-bold text-sm ${getTextColor}`}>
          {formatTime(timeLeft)}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${getBarColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Progress indicators */}
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span>0s</span>
          <span>{totalTime}s</span>
        </div>
      </div>

      {/* Warning message when expiring soon */}
      {timeLeft <= 5 && timeLeft > 0 && (
        <div className="text-xs text-red-600 font-medium animate-pulse text-center">
          Quote expiring soon, will auto-refresh...
        </div>
      )}

      {/* Expired message */}
      {timeLeft <= 0 && (
        <div className="text-xs text-red-600 font-medium text-center">
          Quote expired, getting new quote...
        </div>
      )}
    </div>
  );
};
