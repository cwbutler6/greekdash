import { ReactNode } from 'react';
import Image from 'next/image';

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          <div className="relative h-10 w-auto mx-auto mb-3">
            <Image 
              src="/images/logo.svg" 
              alt="GreekDash Logo" 
              fill
              className="object-contain"
              priority
            />
          </div>
        </h2>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
