'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProfileImageUpload } from '@/components/profile/profile-image-upload';

// Profile form schema with validation
const profileSchema = z.object({
  name: z.string().min(3, 'Full name must be at least 3 characters'),
  email: z.string().email('Please enter a valid email address').optional(),
  phone: z.string().optional(),
  major: z.string().optional(),
  discipline: z.string().optional(),
  schoolName: z.string().optional(),
  gradYear: z.string()
    .refine(val => !val || /^\d{4}$/.test(val), {
      message: 'Graduation year must be a 4-digit year'
    })
    .optional(),
  lineName: z.string().optional(),
  lineGroup: z.string().optional(),
  crossingDate: z.string().optional(),
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
    profile?: {
      id: string;
      profileImage: string | null;
      phone?: string | null;
      major?: string | null;
      discipline?: string | null;
      schoolName?: string | null;
      gradYear?: number | null;
      lineName?: string | null;
      lineGroup?: string | null;
      crossingDate?: string | null;
      bio?: string | null;
    } | null;
  };
  chapterSlug: string;
  primaryColor: string;
}

export default function ProfileForm({ user, membership, chapterSlug, primaryColor }: ProfileFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Ensure we have the current profileImage value from the server
  const [profileImage, setProfileImage] = useState<string | null>(membership.profile?.profileImage || null);
  
  // Debug logging
  console.log('ProfileForm - Full membership profile data:', JSON.stringify(membership.profile, null, 2));
  console.log('ProfileForm initial profileImage:', membership.profile?.profileImage);
  
  // Update profileImage state when membership.profile.profileImage changes
  useEffect(() => {
    if (membership.profile?.profileImage) {
      console.log('ProfileForm useEffect - Updating profileImage from props:', membership.profile.profileImage);
      setProfileImage(membership.profile.profileImage);
    }
  }, [membership.profile?.profileImage]);
  
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
      phone: membership.profile?.phone || '',
      major: membership.profile?.major || '',
      discipline: membership.profile?.discipline || '',
      schoolName: membership.profile?.schoolName || '',
      gradYear: membership.profile?.gradYear ? String(membership.profile.gradYear) : '',
      lineName: membership.profile?.lineName || '',
      lineGroup: membership.profile?.lineGroup || '',
      crossingDate: membership.profile?.crossingDate ? new Date(membership.profile.crossingDate).toISOString().split('T')[0] : '',
      bio: membership.profile?.bio || '',
    },
  });



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
      
      {/* Profile Image Upload */}
      <div className="flex flex-col items-center pb-6 border-b">
        <ProfileImageUpload
          chapterSlug={chapterSlug}
          profileImage={profileImage || membership.profile?.profileImage || null}
          userName={user.name}
          size="lg"
          onImageUpdate={(newImageUrl) => {
            console.log('Image updated with new URL:', newImageUrl);
            // Set the image URL in state
            setProfileImage(newImageUrl);
            setSuccess('Profile image updated successfully');
            
            // Force a router refresh to ensure server data is updated
            setTimeout(() => {
              router.refresh();
            }, 1000);
          }}
        />
        <p className="text-sm text-gray-500 mt-4">
          Upload a profile photo to personalize your account
        </p>
      </div>
      
      {/* User Info Section */}
      <div className="flex items-center space-x-6">
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
          
          {/* School Name */}
          <div className="space-y-2">
            <Label htmlFor="schoolName">School/University</Label>
            <Input
              id="schoolName"
              {...register('schoolName')}
              placeholder="Your school or university"
            />
          </div>
          
          {/* Major */}
          <div className="space-y-2">
            <Label htmlFor="major">Major</Label>
            <Input
              id="major"
              {...register('major')}
              placeholder="Your major"
            />
          </div>
          
          {/* Discipline */}
          <div className="space-y-2">
            <Label htmlFor="discipline">Discipline/Field of Study</Label>
            <Input
              id="discipline"
              {...register('discipline')}
              placeholder="Your discipline or field of study"
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
          
          {/* Line Name */}
          <div className="space-y-2">
            <Label htmlFor="lineName">Line Name</Label>
            <Input
              id="lineName"
              {...register('lineName')}
              placeholder="Your individual line name"
            />
          </div>
          
          {/* Line Group */}
          <div className="space-y-2">
            <Label htmlFor="lineGroup">Line Group</Label>
            <Input
              id="lineGroup"
              {...register('lineGroup')}
              placeholder="Your whole line name/group"
            />
          </div>
          
          {/* Crossing Date */}
          <div className="space-y-2">
            <Label htmlFor="crossingDate">Crossing/Initiation Date</Label>
            <Input
              id="crossingDate"
              type="date"
              {...register('crossingDate')}
            />
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
