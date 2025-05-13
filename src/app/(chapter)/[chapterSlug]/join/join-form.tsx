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
import { AlertCircle } from "lucide-react";

// Schema for join form
const joinFormSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
  joinCode: z.string().min(1, "Join code is required"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type JoinFormValues = z.infer<typeof joinFormSchema>;

export default function JoinForm({ chapterSlug }: { chapterSlug: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [chapterName, setChapterName] = useState<string | null>(null);
  const [isInviteValid, setIsInviteValid] = useState<boolean | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<JoinFormValues>({
    resolver: zodResolver(joinFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      joinCode: "",
    },
  });

  // Check for invite token in URL on component mount
  useEffect(() => {
    // Define the validation function inside useEffect
    const validateInviteToken = async (token: string, slug: string) => {
      try {
        const response = await fetch(`/api/invites/validate?token=${token}&chapterSlug=${slug}`);
        const data = await response.json();
        
        if (response.ok) {
          setIsInviteValid(true);
          setChapterName(data.chapterName);
          setValue("email", data.email); // Pre-fill the email from invite
          setValue("joinCode", "invite"); // Bypass the join code since we have a valid invite
        } else {
          setIsInviteValid(false);
          setError(data.message || "Invalid or expired invite token");
        }
      } catch {
        setIsInviteValid(false);
        setError("An error occurred validating the invite");
      }
    };
    
    // Define the fetch chapter info function inside useEffect
    const fetchChapterInfo = async () => {
      try {
        const response = await fetch(`/api/chapters/${chapterSlug}`);
        
        if (!response.ok) {
          setError("Chapter not found");
          return;
        }
        
        const data = await response.json();
        setChapterName(data.name);
      } catch {
        setError("An error occurred while fetching chapter information");
      }
    };

    // Check if there's an invite token in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      setInviteToken(token);
      // Validate the invite token
      validateInviteToken(token, chapterSlug);
    } else {
      // Fetch chapter name
      fetchChapterInfo();
    }
  }, [chapterSlug, setValue]);

  const onSubmit = async (data: JoinFormValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Define the endpoint based on whether using invite token or join code
      const endpoint = inviteToken 
        ? `/api/invites/accept` 
        : `/api/chapters/${chapterSlug}/join`;
      
      // Prepare the payload
      const payload = {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        ...(inviteToken 
          ? { inviteToken } 
          : { joinCode: data.joinCode }
        ),
      };
      
      // Submit registration request
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        setError(responseData.message || "An error occurred during registration");
        setIsLoading(false);
        return;
      }
      
      // Sign in with credentials after successful registration
      const signInResult = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });
      
      if (signInResult?.error) {
        setError("Registration successful, but could not sign in automatically. Please try logging in.");
        router.push("/login");
        return;
      }
      
      // Redirect based on whether this was an invite (approved) or join code (pending approval)
      if (inviteToken) {
        router.push(`/${chapterSlug}/dashboard`);
      } else {
        router.push(`/${chapterSlug}/pending`);
      }
    } catch (err) {
      console.error("Join error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
              <Link href="/">Return to Homepage</Link>
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
          <CardTitle className="text-center text-2xl">
            Join {chapterName || "Your Chapter"}
          </CardTitle>
          <CardDescription className="text-center">
            {inviteToken ? "Complete your account to join" : "Create an account to join this chapter"}
          </CardDescription>
        </CardHeader>
        
        {error && (
          <CardContent className="pt-0">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        )}
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                placeholder="Enter your email"
                {...register("email")}
                disabled={isInviteValid === true}
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
                placeholder="Create a password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input 
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>
            
            {!inviteToken && (
              <div className="space-y-2">
                <Label htmlFor="joinCode">Chapter Join Code</Label>
                <Input 
                  id="joinCode"
                  placeholder="Enter your chapter join code"
                  {...register("joinCode")}
                />
                {errors.joinCode && (
                  <p className="text-sm text-red-500">{errors.joinCode.message}</p>
                )}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>Loading...</>
              ) : (
                <>Create Account</>
              )}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-[#00b894] hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
