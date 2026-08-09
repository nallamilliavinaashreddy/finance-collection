'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled App Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <Card className="max-w-md w-full text-center border-rose-500/20 shadow-xl">
        <CardHeader>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-2">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <CardTitle className="text-xl">Something Went Wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred in the application runtime.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 text-left overflow-x-auto max-h-32">
            {error.message || 'Unknown runtime error'}
          </div>
          <Button
            variant="primary"
            onClick={() => reset()}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            className="w-full"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
