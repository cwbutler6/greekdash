"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Check, Loader2 } from "lucide-react";

import { createChapterForGoogleUser } from "@/app/actions/auth";

import { createComponentLogger } from "@/lib/logger";
import Link from "next/link";

// Proper TypeScript interfaces
interface CreateChapterResult {
  success: boolean;
  chapterSlug: string;
  redirectUrl: string;
}

interface SlugAvailabilityResponse {
  available: boolean;
}

const socialChapterSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  chapterSlug: z
    .string()
    .min(3, "Chapter URL must be at least 3 characters")
    .max(30, "Chapter URL must be at most 30 characters")
    .regex(/^[a-z0-9-]+$/, "Chapter URL must only contain lowercase letters, numbers, and hyphens")
    .transform(val => val.toLowerCase()),
});

type SocialChapterFormValues = z.infer<typeof socialChapterSchema>;

export function SocialChapterForm() {
  const logger = createComponentLogger('SocialChapterForm');
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Generate a suggested slug from the name if available
  const generateSuggestedSlug = (name: string | null | undefined): string => {
    if (!name) return "";
    
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-')          // Replace spaces with hyphens
      .substring(0, 30);             // Limit length
  };

  // Debug the session data to troubleshoot
  logger.info('Session data loaded', {
    metadata: {
      userName: session?.user?.name,
      userEmail: session?.user?.email,
      userId: session?.user?.id,
      isNewUser: session?.user?.isNewUser
    }
  });

  // Form for creating a new chapter (for social login users)
  const { 
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<SocialChapterFormValues>({
    resolver: zodResolver(socialChapterSchema),
    defaultValues: {
      fullName: session?.user?.name || "",
      email: session?.user?.email || "",
      chapterSlug: generateSuggestedSlug(session?.user?.name),
    },
  });

  // Watch chapterSlug for validation display
  const chapterSlug = watch('chapterSlug');

  // Function to check slug availability
  const checkSlugAvailability = async (slug: string): Promise<void> => {
    try {
      const response = await fetch(`/api/chapters/check-slug?slug=${encodeURIComponent(slug)}`);
      const data = await response.json() as SlugAvailabilityResponse;
      setSlugAvailable(data.available);
    } catch (error: unknown) {
      logger.error('Failed to check slug availability', error instanceof Error ? error : undefined);
      setSlugAvailable(null);
    }
  };
  
  // Add debugging function
  const debugFormState = (): void => {
    console.log('=== FORM DEBUG INFO ===');
    console.log('Form errors:', errors);
    console.log('Form values:', watch());
    console.log('Is form valid:', Object.keys(errors).length === 0);
    console.log('Session:', session);
    console.log('Router:', router);
  };
  
  // Handler for social users creating a new chapter
  const onSubmit = async (data: SocialChapterFormValues): Promise<void> => {
    console.log('🚀 Form submission started with data:', data);
    
    setIsLoading(true);
    setError(null);
  
    try {
      console.log('📝 Checking slug availability...');
      // Check slug availability
      const response = await fetch(`/api/chapters/check-slug?slug=${encodeURIComponent(data.chapterSlug)}`);
      const slugData = await response.json() as SlugAvailabilityResponse;
      
      if (!slugData.available) {
        console.log('❌ Slug not available');
        setError("The chapter URL is already taken. Please choose a different one.");
        return;
      }
  
      console.log('✅ Slug available, creating FormData...');
      // Create FormData for server action
      const formData = new FormData();
      formData.append('fullName', data.fullName);
      formData.append('email', data.email);
      formData.append('chapterSlug', data.chapterSlug);
  
      console.log('📤 Calling createChapterForGoogleUser with data:', {
        fullName: data.fullName,
        email: data.email,
        chapterSlug: data.chapterSlug
      });
  
      const result = await createChapterForGoogleUser(formData) as CreateChapterResult;
      
      console.log('📥 Server action result:', result);
      
      // In the onSubmit function, replace the session update logic (lines 160-180)
      if (result.success) {
        console.log('🎉 Chapter created successfully!');
        logger.info('Chapter created successfully', { 
          chapterSlug: result.chapterSlug,
          metadata: {
            redirectUrl: result.redirectUrl
          }
        });
        
        console.log('🔄 Updating session and waiting for membership data...');
        
        // Update session and poll until we have membership data
        await update();
        
        // Poll for session update with membership data (max 10 seconds)
        let attempts = 0;
        const maxAttempts = 20; // 20 attempts * 500ms = 10 seconds max
        let sessionHasMembership = false;
        
        while (attempts < maxAttempts && !sessionHasMembership) {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const updatedSession = await getSession();
          sessionHasMembership = Boolean(updatedSession?.user?.memberships?.length);
          
          console.log(`📋 Session check attempt ${attempts + 1}:`, {
            hasMemberships: sessionHasMembership,
            membershipCount: updatedSession?.user?.memberships?.length
          });
          
          if (sessionHasMembership) {
            console.log('✅ Session updated with membership data!');
            break;
          }
          
          attempts++;
          
          // Trigger another session update every few attempts
          if (attempts % 4 === 0) {
            console.log('🔄 Triggering additional session update...');
            await update();
          }
        }
        
        if (sessionHasMembership) {
          console.log('🚀 Redirecting to:', result.redirectUrl);
          // Use window.location.href for a hard redirect that bypasses client-side routing
          window.location.href = result.redirectUrl;
        } else {
          console.warn('⚠️ Session update timed out, using fallback redirect');
          // Fallback: construct the URL manually and redirect
          const fallbackUrl = `/${result.chapterSlug}/admin`;
          window.location.href = fallbackUrl;
        }
        
      } else {
        console.error('❌ Chapter creation failed:', result);
        setError('Failed to create chapter. Please try again.');
      }
  
    } catch (err: unknown) {
      console.error('💥 Chapter creation error:', err);
      logger.error('Chapter creation failed', err instanceof Error ? err : undefined);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
      console.log('✅ Form submission completed');
    }
  };

  // Handler for form submission errors
  const onError = (formErrors: Record<string, unknown>): void => {
    console.log('=== FORM VALIDATION ERRORS ===');
    console.log('Validation errors:', formErrors);
    debugFormState();
  };

  // If no session, show loading or redirect
  if (!session?.user) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Loading...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Create Your Chapter</CardTitle>
        <CardDescription>Set up your chapter profile to get started</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Debug tools for development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">Debug Tools</h3>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => {
                console.log('Testing router.push...');
                router.push('/test-redirect');
              }}
            >
              Test Router
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              className="ml-2"
              onClick={debugFormState}
            >
              Debug Form
            </Button>
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4">
          {/* Full Name Field */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              {...register('fullName')}
            />
            {errors.fullName && (
              <p className="text-sm text-red-600">{errors.fullName.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Chapter URL Field */}
          <div className="space-y-2">
            <Label htmlFor="chapterSlug">Chapter URL</Label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">greekdash.com/</span>
              <Input
                id="chapterSlug"
                type="text"
                placeholder="your-chapter-name"
                {...register('chapterSlug')}
                onChange={(e) => {
                  register('chapterSlug').onChange(e);
                  if (e.target.value.length >= 3) {
                    checkSlugAvailability(e.target.value);
                  }
                }}
              />
            </div>
            {errors.chapterSlug && (
              <p className="text-sm text-red-600">{errors.chapterSlug.message}</p>
            )}
            
            {/* Slug availability indicator */}
            {chapterSlug && chapterSlug.length >= 3 && (
              <div className="flex items-center space-x-2">
                {slugAvailable === true && (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Available</span>
                  </>
                )}
                {slugAvailable === false && (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-600">Already taken</span>
                  </>
                )}
                {slugAvailable === null && (
                  <span className="text-sm text-gray-500">Checking availability...</span>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || slugAvailable === false}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Chapter...
              </>
            ) : (
              'Create Chapter'
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-center">
        <p className="text-xs text-gray-500">
          By creating a chapter, you agree to our{' '}
          <Link href="/terms" className="underline">Terms of Service</Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline">Privacy Policy</Link>
        </p>
      </CardFooter>
    </Card>
  );
}
