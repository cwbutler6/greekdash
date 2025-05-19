"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Form validation schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Wrap the component that uses useSearchParams in a Suspense boundary as required by Next.js 15
function LoginForm() {
  const router = useRouter();
  // In Next.js 15, searchParams are a promise that needs to be unwrapped
  const searchParams = useSearchParams();
  // Get callbackUrl safely - no need to use the 'use' hook in this case as useSearchParams
  // in client components in Next.js 15 returns the params directly (not a promise)
  const callbackUrl = searchParams?.get("callbackUrl") || null;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      console.log("Auth result:", result); // Debugging

      // Check for errors - NextAuth sometimes returns ok:true AND an error
      if (result?.error === "OAuthSignIn") {
        // This is just the OAuth flow starting, not an actual error
        // Continue with the flow
      } else if (!result?.ok || result?.error) {
        setError("Invalid email or password");
        setIsLoading(false);
        return;
      }
      
      // Add a small delay to ensure session is established
      // This helps with production environment synchronization
      await new Promise(resolve => setTimeout(resolve, 500));

      // If there's a specific callback URL, respect it
      if (callbackUrl) {
        console.log(`Redirecting to callback URL: ${callbackUrl}`);
        // Try both router.push and window.location for more reliable redirection
        router.push(callbackUrl);
        return;
      }

      // After successful login, we need to get the session data which includes memberships
      // NextAuth already populated the session with memberships data in the JWT callbacks
      try {
        // Use a simple fetch to '/api/auth/session' to get the session data
        // This is a built-in NextAuth endpoint that returns the session
        const sessionResponse = await fetch('/api/auth/session');
        if (!sessionResponse.ok) {
          console.log('Session response not OK:', sessionResponse.status);
          router.push('/signup');
          return;
        }

        const sessionData = await sessionResponse.json();

        // The memberships are included in the session.user object
        const memberships = sessionData.user?.memberships || [];
        
        if (memberships.length === 0) {
          console.log('No memberships found, redirecting to signup');
          // If user has no memberships, send to the signup page to create or join a chapter
          router.push('/signup');
          return;
        }
        
        // Find the first active (non-pending) membership
        const activeMembership = memberships.find(
          (m: { role: string }) => m.role !== 'PENDING_MEMBER'
        );
        
        console.log('Active membership:', activeMembership);
        
        if (activeMembership) {
          // If user has an active membership and is an admin/owner, redirect to admin
          if (activeMembership.role === 'ADMIN' || activeMembership.role === 'OWNER') {
            console.log(`Redirecting admin to /${activeMembership.chapterSlug}/admin`);
            // Use both router and window.location for more reliable redirection in production
            console.log(`Redirecting admin to /${activeMembership.chapterSlug}/admin with window.location`);
            router.push(`/${activeMembership.chapterSlug}/admin`);
            // Fallback to window.location after a small delay if router.push doesn't work
            setTimeout(() => {
              window.location.href = `/${activeMembership.chapterSlug}/admin`;
            }, 300);
          } else {
            // Regular members go to the portal
            console.log(`Redirecting member to /${activeMembership.chapterSlug}/portal with window.location`);
            router.push(`/${activeMembership.chapterSlug}/portal`);
            // Fallback to window.location after a small delay if router.push doesn't work
            setTimeout(() => {
              window.location.href = `/${activeMembership.chapterSlug}/portal`;
            }, 300);
          }
        } else {
          // If user only has pending memberships, redirect to their pending page
          console.log(`Redirecting pending member to /${memberships[0].chapterSlug}/pending with window.location`);
          router.push(`/${memberships[0].chapterSlug}/pending`);
          // Fallback to window.location after a small delay if router.push doesn't work
          setTimeout(() => {
            window.location.href = `/${memberships[0].chapterSlug}/pending`;
          }, 300);
        }
      } catch (error) {
        console.error('Error getting session data:', error);
        // Fallback to signup if there's any error in the process
        console.log('Redirecting to signup due to error with window.location');
        router.push('/signup');
        // Fallback to window.location as a more reliable alternative in production
        setTimeout(() => {
          window.location.href = '/signup';
        }, 300);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl font-bold">
            <div className="relative w-[150px] h-[150px] mx-auto">
              <Image 
                src="/greekdash-icon.svg" 
                alt="GreekDash Logo" 
                fill
                className="object-contain"
                priority
              />
            </div>
          </CardTitle>
          <CardDescription className="text-center">Sign in to your account</CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register("email")}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-primary"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => signIn("google", callbackUrl ? { callbackUrl } : undefined)}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              width="1em"
              height="1em"
            >
              <path
                fill="#FFC107"
                d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
              />
              <path
                fill="#FF3D00"
                d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
              />
              <path
                fill="#1976D2"
                d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
              />
            </svg>
            Google
          </Button>
        </CardContent>

        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

// Export the page component with Suspense boundary to handle useSearchParams in Next.js 15
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
