'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="w-9 h-9 p-0 rounded-lg">
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-9 h-9 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      title="Toggle light/dark theme"
    >
      {theme === 'dark' ? (
        <Sun className="h-4 h-4 text-amber-400 transition-all rotate-0 scale-100" />
      ) : (
        <Moon className="h-4 h-4 text-slate-700 transition-all rotate-0 scale-100" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
