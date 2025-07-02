'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { DepositDisplay } from '@/components/DepositDisplay';
import { Vaults } from '@/components/Vaults';
import { VaultDashboard } from '@/components/VaultDashboard';
import { Button } from '@/components/ui/button';
import { BarChart3, Wallet, Vault } from 'lucide-react';

type ViewMode = 'deposit' | 'vaults' | 'dashboard';

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewMode>('deposit');

  return (
    <div>
      <Header />

      {/* View Toggle */}
      <div className="flex justify-center pt-6 pb-2">
        <div className="flex bg-muted/30 p-1 rounded-lg border">
          <Button
            variant={currentView === 'deposit' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('deposit')}
            className={`flex items-center gap-2 ${
              currentView === 'deposit'
                ? 'bg-orange hover:bg-orange/90 text-orange-foreground'
                : 'hover:bg-muted'
            }`}
          >
            <Wallet className="h-4 w-4" />
            Deposit
          </Button>
          <Button
            variant={currentView === 'vaults' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('vaults')}
            className={`flex items-center gap-2 ${
              currentView === 'vaults'
                ? 'bg-orange hover:bg-orange/90 text-orange-foreground'
                : 'hover:bg-muted'
            }`}
          >
            <Vault className="h-4 w-4" />
            Vaults
          </Button>
          <Button
            variant={currentView === 'dashboard' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('dashboard')}
            className={`flex items-center gap-2 ${
              currentView === 'dashboard'
                ? 'bg-orange hover:bg-orange/90 text-orange-foreground'
                : 'hover:bg-muted'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Portfolio
          </Button>
        </div>
      </div>

      {/* Render Current View */}
      {currentView === 'deposit' && <DepositDisplay />}
      {currentView === 'vaults' && <Vaults />}
      {currentView === 'dashboard' && <VaultDashboard />}
    </div>
  );
}
