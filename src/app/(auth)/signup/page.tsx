"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
// Import next/image for proper image handling
import Image from "next/image";
// Import the logo as a static import
import LogoImage from "../../greekdash-icon.svg";

// Import server actions
import { createChapterForGoogleUser } from "@/app/actions/auth";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Check, Loader2, Plus, Users } from "lucide-react";

// Schema for creating a new chapter (admin flow)
const createChapterSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  chapterSlug: z
    .string()
    .min(3, "Chapter URL must be at least 3 characters")
    .max(30, "Chapter URL must be at most 30 characters")
    .regex(/^[a-z0-9-]+$/, "Chapter URL must only contain lowercase letters, numbers, and hyphens")
    .transform(val => val.toLowerCase()),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Schema for joining an existing chapter (member flow)
const joinChapterSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  chapterSlug: z
    .string()
    .min(3, "Chapter slug must be at least 3 characters")
    .max(30, "Chapter slug must be at most 30 characters")
    .regex(/^[a-z0-9-]+$/, "Chapter slug must only contain lowercase letters, numbers, and hyphens")
    .transform(val => val.toLowerCase()),
  joinCode: z.string().min(1, "Join code is required"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Define the types for both forms
type CreateChapterFormValues = z.infer<typeof createChapterSchema>;
type JoinChapterFormValues = z.infer<typeof joinChapterSchema>;

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const isGoogleRedirect = searchParams?.get('google') === 'true';
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('tab') === 'join' ? 'join' : 'create');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  // Form for creating a new chapter (admin flow)
  const createChapterForm = useForm<CreateChapterFormValues>({
    resolver: zodResolver(createChapterSchema),
    defaultValues: {
      fullName: "",
      email: "",
      chapterSlug: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Form for joining an existing chapter (member flow)
  const joinChapterForm = useForm<JoinChapterFormValues>({
    resolver: zodResolver(joinChapterSchema),
    defaultValues: {
      fullName: "",
      email: "",
      chapterSlug: "",
      joinCode: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Reference to the Google signup form for server actions
  const googleFormRef = useRef<HTMLFormElement>(null);
  
  // Watch for chapter slug changes
  const chapterSlug = createChapterForm.watch("chapterSlug");

  // Check if this is a Google user being redirected to signup
  useEffect(() => {
    // Only run this effect if session is loaded
    if (status === 'loading') return;
    
    // If this is a user coming from Google sign-in
    if (isGoogleRedirect && session?.user) {
      setIsGoogleUser(true);
      
      // Pre-populate the form with data from session
      createChapterForm.setValue('fullName', session.user.name || '');
      createChapterForm.setValue('email', session.user.email || '');
      
      // Generate a suggested slug from the name if available
      if (session.user.name) {
        const suggestedSlug = session.user.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
          .replace(/\s+/g, '-')        // Replace spaces with hyphens
          .substring(0, 30);           // Limit length
        
        createChapterForm.setValue('chapterSlug', suggestedSlug);
      }
      
      // Note: We no longer generate passwords on the client side
      // The server will handle password generation securely
    }
  }, [session, status, isGoogleRedirect, createChapterForm]);
  
  // Check slug availability with the server
  useEffect(() => {
    // Only verify on Google redirect user with a valid slug
    if (!isGoogleUser || !chapterSlug || chapterSlug.length < 3) {
      return;
    }
    
    // Use a timeout to avoid too many requests while typing
    const timeoutId = setTimeout(async () => {
      try {
        // Fetch availability from server-side API
        const response = await fetch(`/api/auth/google-signup?slug=${encodeURIComponent(chapterSlug)}`);
        const data = await response.json();
        
        setSlugAvailable(data.available);
        
        if (!data.available) {
          createChapterForm.setError('chapterSlug', { 
            type: 'manual', 
            message: data.message 
          });
        } else {
          createChapterForm.clearErrors('chapterSlug');
        }
      } catch (error) {
        console.error('Error checking slug availability:', error);
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [chapterSlug, isGoogleUser, createChapterForm]);
  
  // Don't check availability in real-time - only validate client-side format
  useEffect(() => {
    if (activeTab !== 'create' || !chapterSlug) {
      setSlugAvailable(null);
      return;
    }
    
    // Only do client-side validation for now
    const isValidFormat = /^[a-z0-9-]+$/.test(chapterSlug) && 
                         chapterSlug.length >= 3 && 
                         chapterSlug.length <= 30;
    
    // No need to hit the API for basic validation issues
    if (!isValidFormat) {
      setSlugAvailable(null);
      return;
    }
    
    // Mark as available for UI feedback, will be validated during form submission
    setSlugAvailable(true);
  }, [chapterSlug, activeTab]);
  
  // We'll only verify slug availability during actual form submission
  // This avoids the JSON parsing errors during typing

  // Handler for Google users creating a new chapter using server actions
  const handleGoogleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // For Google users, we use server actions which handle all the logic server-side
      // The form should be valid already from React Hook Form's validation
      const formData = new FormData(e.currentTarget);
      await createChapterForGoogleUser(formData);
      
      // Note: The server action handles the redirect, so we shouldn't reach this point
      // If we do, we'll show a success message
      setError(null);
    } catch (err) {
      console.error('Error in Google chapter creation:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsLoading(false);
    }
  };

  // Note: We're using server actions for Google sign-in users
  // An API endpoint approach is also available at '/api/auth/google-signup'

  // Handler for regular users creating a new chapter
  const onCreateSubmit = async (data: CreateChapterFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      // We'll skip the separate slug check API call and rely on the server-side validation
      // during registration, which will return an error if the slug is already taken
      console.log("Submitting registration without separate slug check...");

      // Submit registration request to create new chapter with robust error handling
      try {
        // Use a timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            fullName: data.fullName,
            email: data.email,
            chapterSlug: data.chapterSlug,
            password: data.password,
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Get response as text first to handle any parsing issues
        const responseText = await response.text();
        console.log("Registration response text:", responseText && responseText.substr(0, 100) + "...");
        
        // If not OK, handle error
        if (!response.ok) {
          // Try to parse as JSON if possible
          try {
            const errorData = JSON.parse(responseText);
            setError(errorData.message || "An error occurred during registration");
          } catch (parseError) {
            console.error("Error parsing registration error response:", parseError);
            setError(`Registration failed: ${response.status} ${response.statusText}`);
          }
          setIsLoading(false);
          return;
        }
        
        // Handle empty response
        if (!responseText.trim()) {
          console.error("Empty response from registration API");
          setError("Server returned an empty response. Please try again.");
          setIsLoading(false);
          return;
        }
        
        // Parse successful response
        let responseData;
        try {
          responseData = JSON.parse(responseText);
          console.log("Registration successful:", responseData);
        } catch (parseError) {
          console.error("Error parsing successful registration response:", parseError, "Response text:", responseText);
          setError("Registration may have succeeded but the response couldn't be processed");
          setIsLoading(false);
          return;
        }
      } catch (requestError) {
        console.error("Network error during registration:", requestError);
        setError("Network error during registration. Please check your connection and try again.");
        setIsLoading(false);
        return;
      }

      // Sign in with credentials after successful registration with improved error handling
      try {
        console.log("Attempting sign in after registration...");
        const signInResult = await signIn("credentials", {
          redirect: false,
          email: data.email,
          password: data.password,
          callbackUrl: `/${data.chapterSlug}/admin`
        });
        
        console.log("Sign in result:", signInResult);

        if (signInResult?.error) {
          console.error("Sign in error after registration:", signInResult.error);
          setError("Registration successful, but could not sign in automatically. Please try logging in.");
          router.push("/login");
          return;
        }

        // Redirect to chapter admin - use signInResult.url if available, otherwise fallback
        if (signInResult?.url) {
          router.push(signInResult.url);
        } else {
          router.push(`/${data.chapterSlug}/admin`);
        }
      } catch (signInError) {
        console.error("Exception during sign in after registration:", signInError);
        setError("Registration successful, but encountered an error during automatic sign in. Please try logging in.");
        router.push("/login");
        return;
      }
    } catch (err) {
      console.error("Chapter creation error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for joining an existing chapter
  const onJoinSubmit = async (data: JoinChapterFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      // Submit request to join an existing chapter
      const response = await fetch(`/api/chapters/${data.chapterSlug}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: data.fullName,
          email: data.email,
          joinCode: data.joinCode,
          password: data.password,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        setError(responseData.message || "An error occurred while trying to join the chapter");
        setIsLoading(false);
        return;
      }

      // Sign in with credentials after successful join request
      const signInResult = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (signInResult?.error) {
        setError("Join request successful, but could not sign in automatically. Please try logging in.");
        router.push("/login");
        return;
      }

      // Redirect to portal page (as they'll start as pending_member)
      router.push(`/${data.chapterSlug}/portal`);
    } catch (err) {
      console.error("Chapter join error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl font-bold">
            <div className="flex justify-center">
              {/* Using statically imported image */}
              <Image 
                src={LogoImage} 
                alt="GreekDash Logo"
                width={150}
                height={150}
                priority
              />
            </div>
          </CardTitle>
          <CardDescription className="text-center">
            Join the premier platform for fraternity and sorority chapter management
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="create" disabled={isLoading} className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Create Chapter
              </TabsTrigger>
              <TabsTrigger value="join" disabled={isLoading} className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Join Chapter
              </TabsTrigger>
            </TabsList>
            
            {/* Create Chapter Form (Admin Flow) */}
            <TabsContent value="create" className="space-y-4 mt-4">
              <div className="bg-muted/50 p-4 rounded-lg mb-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Create a New Chapter
                </h3>
                <p className="text-sm text-muted-foreground">
                  Create your own chapter and become its administrator. You&apos;ll have full control over chapter settings and member management.
                </p>
              </div>
              
              <form 
                ref={googleFormRef}
                onSubmit={isGoogleUser 
                  ? handleGoogleCreateSubmit 
                  : createChapterForm.handleSubmit(onCreateSubmit)} 
                className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="create-fullName">Full Name</Label>
                  <Input
                    id="create-fullName"
                    type="text"
                    placeholder="John Doe"
                    {...createChapterForm.register("fullName")}
                    aria-invalid={!!createChapterForm.formState.errors.fullName}
                  />
                  {createChapterForm.formState.errors.fullName && (
                    <p className="text-sm text-destructive">{createChapterForm.formState.errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-email">Email Address</Label>
                  <Input
                    id="create-email"
                    type="email"
                    placeholder="you@example.com"
                    {...createChapterForm.register("email")}
                    aria-invalid={!!createChapterForm.formState.errors.email}
                  />
                  {createChapterForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{createChapterForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="create-chapterSlug">Chapter URL</Label>
                    {slugAvailable === true && (
                      <div className="flex items-center text-xs text-green-600">
                        <Check className="h-3 w-3 mr-1" />
                        Looks Good
                      </div>
                    )}
                    {slugAvailable === false && !createChapterForm.formState.errors.chapterSlug && (
                      <div className="text-xs text-destructive">
                        Already taken
                      </div>
                    )}
                  </div>
                  <div className="flex rounded-md shadow-sm">
                    <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-muted-foreground text-sm">
                      greekdash.com/
                    </span>
                    <Input
                      id="create-chapterSlug"
                      placeholder="your-chapter"
                      className="rounded-l-none"
                      {...createChapterForm.register("chapterSlug")}
                      onBlur={() => {
                        createChapterForm.trigger("chapterSlug");
                      }}
                      aria-invalid={!!createChapterForm.formState.errors.chapterSlug}
                    />
                  </div>
                  {createChapterForm.formState.errors.chapterSlug && (
                    <p className="text-sm text-destructive">{createChapterForm.formState.errors.chapterSlug.message}</p>
                  )}
                </div>

                {!isGoogleUser && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="create-password">Password</Label>
                      <Input
                        id="create-password"
                        type="password"
                        {...createChapterForm.register("password")}
                        aria-invalid={!!createChapterForm.formState.errors.password}
                      />
                      {createChapterForm.formState.errors.password && (
                        <p className="text-sm text-destructive">{createChapterForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="create-confirmPassword">Confirm Password</Label>
                      <Input
                        id="create-confirmPassword"
                        type="password"
                        {...createChapterForm.register("confirmPassword")}
                        aria-invalid={!!createChapterForm.formState.errors.confirmPassword}
                      />
                      {createChapterForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-destructive">{createChapterForm.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {isGoogleUser && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg mb-4">
                    <h3 className="font-medium flex items-center gap-2 text-green-700 dark:text-green-400">
                      Google Account Connected
                    </h3>
                    <p className="text-sm text-green-600 dark:text-green-500">
                      You&apos;ve successfully signed in with Google. Create your chapter to continue.
                    </p>
                    
                    {/* Hidden password fields */}
                    <input type="hidden" {...createChapterForm.register("password")} />
                    <input type="hidden" {...createChapterForm.register("confirmPassword")} />
                  </div>
                )}

                {/* We have two approaches implemented for Google users */}
                {/* 1. Server Action approach (default) */}
                {isGoogleUser ? (
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || slugAvailable === false}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating chapter...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Chapter with Google Account
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || slugAvailable === false}
                  >
                    {isLoading && activeTab === 'create' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating chapter...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create New Chapter
                      </>
                    )}
                  </Button>
                )}
                
                {/* Note: We're using the server action approach above */}
                {/* API endpoint approach is also available at '/api/auth/google-signup' */}
              </form>
            </TabsContent>
            
            {/* Join Chapter Form (Member Flow) */}
            <TabsContent value="join" className="space-y-4 mt-4">
              <div className="bg-muted/50 p-4 rounded-lg mb-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" /> Join an Existing Chapter
                </h3>
                <p className="text-sm text-muted-foreground">
                  Use a chapter&apos;s join code to request access. Your membership will be pending until approved by a chapter admin.
                </p>
              </div>
              
              <form onSubmit={joinChapterForm.handleSubmit(onJoinSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="join-fullName">Full Name</Label>
                  <Input
                    id="join-fullName"
                    type="text"
                    placeholder="John Doe"
                    {...joinChapterForm.register("fullName")}
                    aria-invalid={!!joinChapterForm.formState.errors.fullName}
                  />
                  {joinChapterForm.formState.errors.fullName && (
                    <p className="text-sm text-destructive">{joinChapterForm.formState.errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="join-email">Email Address</Label>
                  <Input
                    id="join-email"
                    type="email"
                    placeholder="you@example.com"
                    {...joinChapterForm.register("email")}
                    aria-invalid={!!joinChapterForm.formState.errors.email}
                  />
                  {joinChapterForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{joinChapterForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="join-chapterSlug">Chapter URL</Label>
                  <div className="flex rounded-md shadow-sm">
                    <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-muted-foreground text-sm">
                      greekdash.com/
                    </span>
                    <Input
                      id="join-chapterSlug"
                      placeholder="chapter-to-join"
                      className="rounded-l-none"
                      {...joinChapterForm.register("chapterSlug")}
                      aria-invalid={!!joinChapterForm.formState.errors.chapterSlug}
                    />
                  </div>
                  {joinChapterForm.formState.errors.chapterSlug && (
                    <p className="text-sm text-destructive">{joinChapterForm.formState.errors.chapterSlug.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="join-joinCode">Join Code</Label>
                  <Input
                    id="join-joinCode"
                    type="text"
                    placeholder="Enter chapter join code"
                    {...joinChapterForm.register("joinCode")}
                    aria-invalid={!!joinChapterForm.formState.errors.joinCode}
                  />
                  {joinChapterForm.formState.errors.joinCode && (
                    <p className="text-sm text-destructive">{joinChapterForm.formState.errors.joinCode.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Contact your chapter administrator for the join code
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="join-password">Password</Label>
                    <Input
                      id="join-password"
                      type="password"
                      {...joinChapterForm.register("password")}
                      aria-invalid={!!joinChapterForm.formState.errors.password}
                    />
                    {joinChapterForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{joinChapterForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="join-confirmPassword">Confirm Password</Label>
                    <Input
                      id="join-confirmPassword"
                      type="password"
                      {...joinChapterForm.register("confirmPassword")}
                      aria-invalid={!!joinChapterForm.formState.errors.confirmPassword}
                    />
                    {joinChapterForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">{joinChapterForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading && activeTab === 'join' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting request...
                    </>
                  ) : (
                    <>
                      <Users className="mr-2 h-4 w-4" />
                      Request to Join Chapter
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-lg flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </Card>
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}
