'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Profile form schema with validation
const profileSchema = z.object({
  name: z.string().min(3, 'Full name must be at least 3 characters'),
  email: z.string().email('Please enter a valid email address').optional(),
  phone: z.string().optional(),
  major: z.string().optional(),
  gradYear: z.string()
    .refine(val => !val || /^\d{4}$/.test(val), {
      message: 'Graduation year must be a 4-digit year'
    })
    .optional(),
  bio: z.string().max(300, 'Bio cannot exceed 300 characters').optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
  membership: {
    role: string;
  };
  chapterSlug: string;
  primaryColor: string;
}

export default function ProfileForm({ user, membership, chapterSlug, primaryColor }: ProfileFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Initialize form with user's current data
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      major: '',
      gradYear: '',
      bio: '',
    },
  });

  // Function to get user initials for the avatar
  const getInitials = (name?: string | null): string => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('');
  };

  // Form submission handler
  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(`/api/chapters/${chapterSlug}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to update profile');
      }
      
      setSuccess('Profile updated successfully');
      
      // Refresh the page to show updated data
      router.refresh();
    } catch (error: unknown) {
      console.error('Error updating profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="bg-green-50 border-green-200 text-green-700">
          <CheckCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      {/* User Avatar Section */}
      <div className="flex items-center space-x-6">
        <Avatar className="h-20 w-20">
          <AvatarImage src={user?.image || undefined} />
          <AvatarFallback 
            className="text-xl"
            style={{ backgroundColor: primaryColor, color: 'white' }}
          >
            {getInitials(user?.name)}
          </AvatarFallback>
        </Avatar>
        
        <div>
          <h2 className="text-xl font-medium">{user?.name}</h2>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <p className="mt-1 text-sm">
            <span 
              className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
              style={{
                backgroundColor: `${primaryColor}20`, // Using hex with 20% opacity
                color: primaryColor
              }}
            >
              {membership.role.toLowerCase()}
            </span>
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Your full name"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
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
            <p className="text-xs text-gray-500">Email cannot be changed</p>
          </div>
          
          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="Your phone number"
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>
          
          {/* Major/Field of Study */}
          <div className="space-y-2">
            <Label htmlFor="major">Major/Field of Study</Label>
            <Input
              id="major"
              {...register('major')}
              placeholder="Your major or field of study"
            />
          </div>
          
          {/* Graduation Year */}
          <div className="space-y-2">
            <Label htmlFor="gradYear">Graduation Year</Label>
            <Input
              id="gradYear"
              {...register('gradYear')}
              placeholder="YYYY"
            />
            {errors.gradYear && (
              <p className="text-sm text-red-500">{errors.gradYear.message}</p>
            )}
          </div>
        </div>
        
        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            {...register('bio')}
            rows={4}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Tell us a bit about yourself"
          />
          {errors.bio && (
            <p className="text-sm text-red-500">{errors.bio.message}</p>
          )}
        </div>
        
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
            style={{ backgroundColor: primaryColor }}
            className="hover:opacity-90"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
