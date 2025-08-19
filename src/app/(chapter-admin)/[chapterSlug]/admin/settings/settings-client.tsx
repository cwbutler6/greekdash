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
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { LogoUpload } from '@/components/ui/logo-upload';
import { ColorPicker } from '@/components/ui/color-picker';

// Define the form schema
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Chapter name must be at least 2 characters.",
  }),
  primaryColor: z.string().regex(/^#([0-9A-F]{6})$/i, {
    message: "Please enter a valid hex color code (e.g. #123ABC)",
  }),
  secondaryColor: z.string().regex(/^#([0-9A-F]{6})$/i, {
    message: "Please enter a valid hex color code (e.g. #123ABC)",
  }),
  publicInfo: z.string().max(1000, {
    message: "Public information must be less than 1000 characters.",
  }).optional(),
  logoUrl: z.string().nullable().optional(),
});

// Single ChapterSettings interface with consistent typing
interface ChapterSettings {
  id: string;
  name: string;
  slug: string;
  joinCode: string;
  primaryColor?: string;
  secondaryColor?: string;
  publicInfo?: string;
  logoUrl?: string | null; // Keep this as is
}

type FormValues = z.infer<typeof formSchema>;

// Remove the duplicate interface definition that was here

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
      primaryColor: '#4F46E5',
      secondaryColor: '#10B981', // Added missing secondaryColor
      publicInfo: '',
      logoUrl: null,
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
          secondaryColor: data.chapter.secondaryColor || '#10B981', // Added missing secondaryColor
          publicInfo: data.chapter.publicInfo || '',
          logoUrl: data.chapter.logoUrl || null,
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

  // Update local state with proper typing
  const updateChapterState = (values: FormValues) => {
    setChapter(prev => prev ? { 
      ...prev, 
      name: values.name,
      primaryColor: values.primaryColor,
      secondaryColor: values.secondaryColor, // Added missing secondaryColor
      publicInfo: values.publicInfo,
      logoUrl: values.logoUrl 
    } : null);
  };

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('primaryColor', values.primaryColor);
      formData.append('secondaryColor', values.secondaryColor); // Added missing secondaryColor
      formData.append('publicInfo', values.publicInfo || '');
      formData.append('logoUrl', values.logoUrl || '');
      formData.append('chapterSlug', chapterSlug);

      await updateChapterSettings(formData);
      
      // Update local state with proper typing
      updateChapterState(values);
      
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
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chapter Logo</FormLabel>
                    <FormControl>
                      <LogoUpload
                        chapterSlug={chapterSlug}
                        logoUrl={field.value}
                        onLogoUpdate={(logoUrl: string | null) => {
                          field.onChange(logoUrl);
                          setChapter(prev => prev ? { ...prev, logoUrl: logoUrl } : null);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Upload a logo to represent your chapter. This will be displayed on your public page and throughout the platform.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Color picker sections */}
              <FormField
                control={form.control}
                name="primaryColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Color</FormLabel>
                    <FormControl>
                      <ColorPicker
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Choose your chapter&apos;s primary brand color. This will be used for headers, buttons, and key UI elements.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="secondaryColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secondary Color</FormLabel>
                    <FormControl>
                      <ColorPicker
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Choose your chapter&apos;s secondary brand color. This will be used for accents, backgrounds, and complementary elements.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="publicInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Public Information</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        content={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Enter public information about your chapter that will be displayed on your public page..."
                        maxLength={5000}
                        className="w-full"
                      />
                    </FormControl>
                    <FormDescription>
                      This information will be displayed on your chapter&apos;s public page. You can use formatting, links, and emojis.
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
