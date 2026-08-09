import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <Card className="max-w-md w-full text-center shadow-xl">
        <CardHeader>
          <div className="w-12 h-12 rounded-2xl bg-[#FF7A00]/10 text-[#FF7A00] dark:text-[#FF7A00] flex items-center justify-center mx-auto mb-2">
            <FileQuestion className="w-6 h-6" />
          </div>
          <CardTitle className="text-xl">404 - Page Not Found</CardTitle>
          <CardDescription>
            The requested page does not exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard">
            <Button variant="primary" leftIcon={<Home className="w-4 h-4" />} className="w-full">
              Back to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

