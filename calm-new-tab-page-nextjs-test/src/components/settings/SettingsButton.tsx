"use client";

import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function SettingsButton() {
  const router = useRouter();

  const handleClick = () => {
    router.push('/settings');
  };

  return (
    <Button
      id="settings-button"
      variant="ghost"
      size="icon"
      className="fixed top-4 right-4 z-10 bg-background/30 backdrop-blur-sm hover:bg-background/50"
      onClick={handleClick}
      aria-label="Settings"
    >
      <Settings className="h-5 w-5" />
    </Button>
  );
}