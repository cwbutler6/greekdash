'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ErrorPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-6 p-8">
      <div className="flex items-center space-x-3 text-destructive">
        <AlertTriangle className="h-12 w-12" />
        <h1 className="text-3xl font-bold">Something went wrong</h1>
      </div>
      
      <div className="text-center space-y-2 max-w-md">
        <p className="text-lg text-muted-foreground">
          We encountered an unexpected error while processing your request.
        </p>
        <p className="text-sm text-muted-foreground">
          Our team has been automatically notified and is working on a fix.
        </p>
      </div>
      
      <div className="flex space-x-4">
        <Button asChild variant="outline">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Link>
        </Button>
        <Button onClick={() => router.back()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    </div>
  );
}