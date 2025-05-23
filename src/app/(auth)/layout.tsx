import { ReactNode } from 'react';
import AuthGuard from '@/components/auth/auth-guard';

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <AuthGuard>
          {children}
        </AuthGuard>
      </div>
    </div>
  );
}
