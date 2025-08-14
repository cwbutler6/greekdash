"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { joinChapterForSocialUser } from "@/app/actions/auth";

const socialJoinSchema = z.object({
  chapterSlug: z.string().min(3, "Chapter URL must be at least 3 characters"),
  joinCode: z.string().min(1, "Join code is required"),
});

type SocialJoinFormValues = z.infer<typeof socialJoinSchema>;

export function SocialJoinForm() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    formState: { errors },
  } = useForm<SocialJoinFormValues>({
    resolver: zodResolver(socialJoinSchema),
  });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      await joinChapterForSocialUser(formData);
      // The server action handles the redirect
    } catch (err) {
      console.error('Error joining chapter:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
        {/* Hidden fields for user data */}
        <input type="hidden" name="fullName" value={session.user.name || ""} />
        <input type="hidden" name="email" value={session.user.email || ""} />
        
        {/* Chapter URL */}
        <div className="space-y-2">
          <Label htmlFor="chapterSlug">Chapter URL</Label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
              greekdash.com/
            </span>
            <Input
              id="chapterSlug"
              {...register('chapterSlug')}
              placeholder="chapter-name"
              className="rounded-l-none"
            />
          </div>
          {errors.chapterSlug && (
            <p className="text-sm text-red-500">{errors.chapterSlug.message}</p>
          )}
        </div>
        
        {/* Join Code */}
        <div className="space-y-2">
          <Label htmlFor="joinCode">Join Code</Label>
          <Input
            id="joinCode"
            {...register('joinCode')}
            placeholder="Enter the chapter join code"
          />
          {errors.joinCode && (
            <p className="text-sm text-red-500">{errors.joinCode.message}</p>
          )}
          <p className="text-xs text-gray-500">
            Ask your chapter admin for the join code
          </p>
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Joining Chapter...
            </>
          ) : (
            'Join Chapter'
          )}
        </Button>
      </form>
    </div>
  );
}