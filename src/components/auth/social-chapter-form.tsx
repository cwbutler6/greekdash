"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Check, Loader2 } from "lucide-react";

// Import server actions
import { createChapterForGoogleUser } from "@/app/actions/auth";

// Schema for creating a new chapter for social users (simplified)
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

  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const initialValuesSet = useRef(false); // Add this ref

  // Generate a suggested slug from the name if available
  const generateSuggestedSlug = (name: string | null | undefined) => {
    if (!name) return "";
    
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-')          // Replace spaces with hyphens
      .substring(0, 30);             // Limit length
  };

  // Debug the session data to troubleshoot
  console.log('Social Chapter Form - Session Data:', {
    userName: session?.user?.name,
    userEmail: session?.user?.email,
    userId: session?.user?.id,
    isNewUser: session?.user?.isNewUser
  });

  // Form for creating a new chapter (for social login users)
  const { 
    register, 
    watch,
    formState: { errors },
    setError: setFormError,
    clearErrors,
    setValue
  } = useForm<SocialChapterFormValues>({
    resolver: zodResolver(socialChapterSchema),
    defaultValues: {
      fullName: session?.user?.name || "",
      email: session?.user?.email || "",
      chapterSlug: generateSuggestedSlug(session?.user?.name),
    },
  });
  
  // Update form values if session changes
  useEffect(() => {
    if (session?.user && !initialValuesSet.current) {
      if (session.user.name) setValue('fullName', session.user.name);
      if (session.user.email) setValue('email', session.user.email);
      const currentSlug = watch('chapterSlug');
      if (!currentSlug && session.user.name) {
        setValue('chapterSlug', generateSuggestedSlug(session.user.name));
      }
      initialValuesSet.current = true;
    }
  }, [session, setValue]);

  // Watch for chapter slug changes
  const chapterSlug = watch("chapterSlug");

  // Check slug availability in real-time
  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null);
      return;
    }
    
    // Only proceed with API validation if the format is valid
    const isValidFormat = /^[a-z0-9-]+$/.test(slug) && 
                         slug.length >= 3 && 
                         slug.length <= 30;
    
    if (!isValidFormat) {
      setSlugAvailable(null);
      return;
    }
    
    try {
      const response = await fetch(`/api/chapters/check-slug?slug=${encodeURIComponent(slug)}`);
      const data = await response.json();
      
      setSlugAvailable(data.available);
      
      if (!data.available) {
        setFormError('chapterSlug', { 
          type: 'manual', 
          message: 'This chapter URL is already taken' 
        });
      } else {
        clearErrors('chapterSlug');
      }
    } catch (error) {
      console.error('Error checking slug availability:', error);
    }
  };

  // Handler for social users creating a new chapter
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // First, check if the slug is available
      if (chapterSlug) {
        // Wait for the slug availability check to complete
        const response = await fetch(`/api/chapters/check-slug?slug=${encodeURIComponent(chapterSlug)}`);
        const data = await response.json();
        
        if (!data.available) {
          setError("The chapter URL is already taken. Please choose a different one.");
          setIsLoading(false);
          return;
        }
      }

      // Get form data using the form ref instead of e.currentTarget
      if (!formRef.current) {
        throw new Error('Form reference not found');
      }

      // For social users, we use server actions which handle the logic server-side
      const formData = new FormData(formRef.current);
      await createChapterForGoogleUser(formData);
  
      // Force session update to include new membership
      await update();
  
      // Small delay to ensure session is fully updated before AuthGuard processes redirect
      await new Promise(resolve => setTimeout(resolve, 500));
  
      // The AuthGuard will now handle the redirect with updated session
    } catch (err) {
      console.error('Error in social chapter creation:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
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
      
      <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
        {/* Full Name (editable) */}
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            {...register('fullName')}
            placeholder="Enter your full name"
          />
          {errors.fullName && (
            <p className="text-sm text-red-500">{errors.fullName.message}</p>
          )}
          <p className="text-xs text-gray-500">You can edit the name from your social account</p>
        </div>
          
          {/* Email Address (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              {...register('email')}
              readOnly
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500">Email from your social account</p>
          </div>
          
          {/* Chapter URL (editable) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="chapterSlug">Chapter URL</Label>
              {slugAvailable === true && (
                <span className="text-xs text-green-600 flex items-center">
                  <Check className="h-3 w-3 mr-1" />
                  Available
                </span>
              )}
            </div>
            <div className="flex items-center">
              <div className="bg-gray-100 p-2 rounded-l-md text-gray-500 border border-r-0">
                greekdash.com/
              </div>
              <Input
                id="chapterSlug"
                {...register('chapterSlug')}
                className={`rounded-l-none ${errors.chapterSlug ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                placeholder="your-chapter"
                onChange={(e) => {
                  const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                  e.target.value = value;
                  if (value.length >= 3) {
                    checkSlugAvailability(value);
                  } else {
                    setSlugAvailable(null);
                  }
                }}
                aria-invalid={errors.chapterSlug ? 'true' : 'false'}
                aria-describedby="chapterSlug-error"
              />
            </div>
            {errors.chapterSlug && (
              <p id="chapterSlug-error" className="text-sm text-red-500">{errors.chapterSlug.message}</p>
            )}
            <div className="flex items-center mt-1">
              {slugAvailable === false && (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  This chapter URL is already taken
                </p>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1 space-y-1">
              <p>This will be your chapter&apos;s unique URL. Must be:</p>
              <ul className="list-disc list-inside pl-2 space-y-0.5">
                <li className={chapterSlug?.length >= 3 && chapterSlug?.length <= 30 ? 'text-green-600' : ''}>Between 3-30 characters</li>
                <li className={/^[a-z0-9-]+$/.test(chapterSlug || '') ? 'text-green-600' : ''}>Only lowercase letters, numbers, and hyphens</li>
                <li className={slugAvailable === true ? 'text-green-600' : ''}>Available for use</li>
              </ul>
            </div>
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Chapter...
              </>
            ) : (
              "Create Chapter"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t p-4">
        <p className="text-xs text-center text-gray-500">
          By creating a chapter, you agree to our Terms of Service and Privacy Policy.
        </p>
      </CardFooter>
    </Card>
  );
}
