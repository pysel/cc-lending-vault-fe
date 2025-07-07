// Bot Health Status Component
// Displays bot service health and cross-chain synchronization status

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, AlertTriangle, XCircle, Globe, RefreshCw } from 'lucide-react';
import { botApi } from '@/lib/api/bot';
import { BotHealthStatus } from '@/lib/types/bot';

interface BotHealthStatusProps {
  variant?: 'card' | 'banner' | 'compact';
}

export const BotHealthStatusComponent = ({ variant = 'compact' }: BotHealthStatusProps) => {
  const [healthStatus, setHealthStatus] = useState<BotHealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthStatus = async () => {
    try {
      setLoading(true);
      const status = await botApi.getBotHealthStatus();
      setHealthStatus(status);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bot health status');
      setHealthStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthStatus();

    // Refresh health status every 30 seconds
    const interval = setInterval(fetchHealthStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (isHealthy: boolean) => {
    if (isHealthy) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (isHealthy: boolean) => {
    return (
      <Badge variant={isHealthy ? 'default' : 'destructive'}>
        {isHealthy ? 'Healthy' : 'Unhealthy'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Checking bot status...
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Bot service unavailable. Using fallback data sources.</AlertDescription>
      </Alert>
    );
  }

  if (!healthStatus) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        {getStatusIcon(healthStatus.isHealthy)}
        <span className="text-sm font-medium">
          Bot: {healthStatus.isHealthy ? 'Operational' : 'Issues Detected'}
        </span>
        {!healthStatus.isHealthy && (
          <Badge variant="destructive" className="text-xs">
            Service Issues
          </Badge>
        )}
      </div>
    );
  }

  if (variant === 'banner' && !healthStatus.isHealthy) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Bot service is experiencing issues. Some data may be outdated. Cross-chain calculations
          may be affected.
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === 'card') {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-b from-background to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Bot Service Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Overall Status</span>
            {getStatusBadge(healthStatus.isHealthy)}
          </div>

          <div className="text-sm text-muted-foreground">
            Last updated: {new Date(healthStatus.lastUpdate).toLocaleTimeString()}
          </div>

          {healthStatus.crossChainSyncStatus && healthStatus.crossChainSyncStatus.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Cross-Chain Sync Status</h4>
              <div className="space-y-1">
                {healthStatus.crossChainSyncStatus.map((sync, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(sync.isHealthy)}
                      <span>{sync.chain}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {new Date(sync.lastSync).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
};
