"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import Link from "next/link";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Shield } from "lucide-react";

// Enhanced schema with spam protection
const joinFormSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  joinCode: z.string().min(1, "Join code is required"),
  // Honeypot fields (hidden from users)
  website: z.string().optional(),
  phone: z.string().optional(),
});

type JoinFormValues = z.infer<typeof joinFormSchema>;

export default function JoinForm({ chapterSlug }: { chapterSlug: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [chapterName, setChapterName] = useState<string | null>(null);
  const [isInviteValid, setIsInviteValid] = useState<boolean | null>(null);
  const [formStartTime, setFormStartTime] = useState<number>(0);
  const [isRateLimited, setIsRateLimited] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<JoinFormValues>({
    resolver: zodResolver(joinFormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      joinCode: '',
      website: '', // Honeypot
      phone: '', // Honeypot
    },
  });
  
  // Record form start time for timing validation
  useEffect(() => {
    setFormStartTime(Date.now());
  }, []);

  // Define the validation function inside useEffect
  const validateInviteToken = async (token: string, slug: string) => {
    try {
      const response = await fetch(`/api/invites/validate?token=${token}&chapterSlug=${slug}`);
      const data = await response.json();
      
      if (response.ok && data.valid) {
        setChapterName(data.chapterName);
        setIsInviteValid(true);
        setValue('email', data.email || '');
        setValue('fullName', data.fullName || '');
      } else {
        setError(data.message || 'Invalid or expired invite token');
        setIsInviteValid(false);
      }
    } catch (err) {
      console.error('Error validating invite token:', err);
      setError('Failed to validate invite token');
      setIsInviteValid(false);
    }
  };

  useEffect(() => {
    // Check for invite token in URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      setInviteToken(token);
      validateInviteToken(token, chapterSlug);
    } else {
      setIsInviteValid(false);
    }
  }, [chapterSlug]);

  const onSubmit = async (data: JoinFormValues) => {
    if (isRateLimited) {
      setError('Please wait before submitting again.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/chapters/${chapterSlug}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          formStartTime,
        }),
      });
      
      const result = await response.json();
      
      if (response.status === 429) {
        setIsRateLimited(true);
        setError(result.message || 'Too many attempts. Please try again later.');
        // Reset rate limit flag after the retry period
        setTimeout(() => setIsRateLimited(false), result.retryAfter || 60000);
        return;
      }
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to join chapter');
      }
      
      if (result.isPending) {
        // Redirect to pending page or show success message
        router.push(`/${chapterSlug}/pending`);
      } else {
        // Sign in the user and redirect
        const signInResult = await signIn('credentials', {
          email: data.email,
          password: data.password,
          redirect: false,
        });
        
        if (signInResult?.ok) {
          router.push(`/${chapterSlug}/portal`);
        } else {
          router.push('/login');
        }
      }
    } catch (err) {
      console.error('Join error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while validating invite
  if (isInviteValid === null) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">Validating invite...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error states
  if (error === "Chapter not found") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Chapter Not Found</CardTitle>
            <CardDescription className="text-center">The chapter you&apos;re looking for does not exist.</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button asChild variant="outline">
              <Link href="/">Go Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {inviteToken ? `Join ${chapterName || 'Chapter'}` : 'Join Chapter'}
          </CardTitle>
          <CardDescription className="text-center">
            {inviteToken 
              ? 'Complete your registration using the invite link'
              : 'Enter the join code to request membership'
            }
          </CardDescription>
          {/* Spam protection indicator */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-2">
            <Shield className="h-3 w-3" />
            <span>Protected by spam prevention</span>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Honeypot fields - hidden from users */}
            <input
              type="text"
              {...register('website')}
              style={{ display: 'none' }}
              tabIndex={-1}
              autoComplete="off"
            />
            <input
              type="text"
              {...register('phone')}
              style={{ display: 'none' }}
              tabIndex={-1}
              autoComplete="off"
            />
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input 
                id="fullName"
                placeholder="Enter your full name"
                {...register("fullName")}
              />
              {errors.fullName && (
                <p className="text-sm text-red-500">{errors.fullName.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email"
                type="email"
                placeholder="Enter your email address"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password"
                type="password"
                placeholder="Create a password (min 8 characters)"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
            
            {!inviteToken && (
              <div className="space-y-2">
                <Label htmlFor="joinCode">Join Code</Label>
                <Input 
                  id="joinCode"
                  placeholder="Enter the chapter join code"
                  {...register("joinCode")}
                />
                {errors.joinCode && (
                  <p className="text-sm text-red-500">{errors.joinCode.message}</p>
                )}
              </div>
            )}
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || isRateLimited}
            >
              {isLoading ? 'Submitting...' : (inviteToken ? 'Complete Registration' : 'Request to Join')}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
