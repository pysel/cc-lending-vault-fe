'use client';

import { ConnectButton } from '@/components/ConnectButton';
import { ModeToggle } from '@/components/ModeToggle';
import { BotHealthStatusComponent } from '@/components/BotHealthStatus';

export const Header = () => {
  return (
    <header className="flex items-center justify-between gap-4 bg-muted/50 p-4 border-b border-border transition-colors">
      <div className="flex items-center gap-2">
        <h1 className="font-bold text-xl text-foreground text-orange">OneYield</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* <BotHealthStatusComponent variant="compact" /> */}
        <ModeToggle />
        <div data-onboarding="connect-button">
          <ConnectButton />
        </div>
      </div>
    </header>
  );
};
