'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter,
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Paintbrush, RefreshCw } from 'lucide-react';

// Define the form schema
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Chapter name must be at least 2 characters.",
  }),
  primaryColor: z.string().regex(/^#([0-9A-F]{6})$/i, {
    message: "Please enter a valid hex color code (e.g. #123ABC)",
  })
});

type FormValues = z.infer<typeof formSchema>;

interface ChapterSettings {
  id: string;
  name: string;
  slug: string;
  joinCode: string;
  primaryColor?: string;
}

// Server action to update chapter settings
async function updateChapterSettings(formData: FormData) {
  try {
    const response = await fetch('/api/chapters/update-settings', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update settings');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('An unexpected error occurred');
  }
}

// Server action to regenerate join code
async function regenerateJoinCode(formData: FormData) {
  try {
    const response = await fetch('/api/chapters/regenerate-join-code', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to regenerate join code');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('An unexpected error occurred');
  }
}

export default function SettingsClient({ chapterSlug }: { chapterSlug: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [chapter, setChapter] = useState<ChapterSettings | null>(null);
  
  // Initialize the form with empty values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      primaryColor: '#4F46E5', // Default indigo color
    }
  });
  
  // Fetch chapter data on component mount
  useEffect(() => {
    const fetchChapter = async () => {
      try {
        const response = await fetch(`/api/chapters/${chapterSlug}?auth=true`);
        if (!response.ok) {
          throw new Error('Failed to fetch chapter');
        }
        const data = await response.json();
        setChapter(data.chapter);
        
        // Set form values
        form.reset({
          name: data.chapter.name,
          primaryColor: data.chapter.primaryColor || '#4F46E5',
        });
      } catch (error) {
        toast.error('Failed to load chapter settings');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChapter();
  }, [chapterSlug, form]);

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('primaryColor', values.primaryColor);
      formData.append('chapterSlug', chapterSlug);

      await updateChapterSettings(formData);
      
      // Update local state
      setChapter(prev => prev ? { ...prev, ...values } : null);
      
      toast.success('Chapter settings updated');
      router.refresh();
    } catch (error) {
      toast.error('Failed to update settings');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle join code regeneration
  const handleRegenerateJoinCode = async () => {
    if (!chapter) return;
    
    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('chapterSlug', chapterSlug);

      const result = await regenerateJoinCode(formData);
      
      // Update local state
      setChapter(prev => prev ? { ...prev, joinCode: result.joinCode } : null);
      
      toast.success('Join code regenerated');
    } catch (error) {
      toast.error('Failed to regenerate join code');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !chapter) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Chapter Settings</CardTitle>
          <CardDescription>
            Customize your chapter&apos;s profile and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chapter Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      The name of your chapter as it will appear throughout the platform.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="primaryColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Color</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <div 
                          className="w-10 h-10 rounded-md border"
                          style={{ backgroundColor: field.value }}
                        />
                        <Input {...field} placeholder="#4F46E5" />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Enter a hex color code (e.g. #123ABC) for your chapter&apos;s brand color.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Paintbrush className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Chapter Join Code</CardTitle>
          <CardDescription>
            Members use this code to join your chapter directly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-slate-50 rounded-md font-mono text-center text-xl">
            {chapter?.joinCode || 'Loading...'}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            variant="outline"
            onClick={handleRegenerateJoinCode}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate Join Code
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
