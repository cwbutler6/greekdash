import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin, isSupabaseConfigured } from './index';
import path from 'path';
import { prisma } from '@/lib/db';

interface UploadProfileImageParams {
  profileId: string;
  chapterId: string;
  fileName: string;
  mimeType: string;
  fileBuffer: Buffer;
}

export async function uploadProfileImage({
  profileId,
  chapterId,
  fileName,
  mimeType,
  fileBuffer,
}: UploadProfileImageParams) {
  // Validate file type is an image
  if (!mimeType.startsWith('image/')) {
    throw new Error('Only image files are allowed for profile pictures');
  }

  // Limit file size to 5MB
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (fileBuffer.length > maxSize) {
    throw new Error('Profile image must be less than 5MB');
  }

  // Generate a unique filename to avoid collisions
  const fileExtension = path.extname(fileName);
  const uniqueFilename = `${uuidv4()}${fileExtension}`;
  const filePath = `profiles/${chapterId}/${uniqueFilename}`;

  // Check if Supabase is configured (skip during build time)
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured - skipping profile image upload');
    return null;
  }

  try {
    // Try to ensure the bucket exists
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === 'profile-images');
    
    if (!bucketExists) {
      console.log('Creating profile-images bucket in Supabase...');
      await supabaseAdmin.storage.createBucket('profile-images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB in bytes
      });
      console.log('Bucket created successfully');
    }

    // Upload to Supabase Storage
    const { error } = await supabaseAdmin.storage
      .from('profile-images')
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      if (error.message?.includes('Bucket not found')) {
        console.error('Bucket not found even after creation attempt');
        // Return null instead of throwing to avoid breaking the profile update
        console.warn('Unable to upload profile image, but continuing with profile update');
        return null;
      }
      throw new Error(`Supabase storage error: ${error.message}`);
    }
  } catch (err) {
    console.error('Error with Supabase storage operation:', err);
    // Return null instead of throwing to allow profile updates to continue even if image upload fails
    return null;
  }

  // Important: We need to generate a URL that will work reliably across environments
  // Option 1: Use Supabase's getPublicUrl function
  const { data } = supabaseAdmin.storage
    .from('profile-images')
    .getPublicUrl(filePath);
  
  // Option 2: Construct URL manually using environment variable (fallback)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!data?.publicUrl || !supabaseUrl) {
    console.error('Failed to generate public URL from Supabase or missing NEXT_PUBLIC_SUPABASE_URL');
    return null;
  }
  
  // Use the publicUrl from Supabase, but add a timestamp query parameter to prevent caching issues
  const timestamp = Date.now();
  const fullUrl = `${data.publicUrl}?t=${timestamp}`;
  
  // Log both URLs for debugging
  console.log('Original Supabase URL:', data.publicUrl);
  console.log('Final URL with cache-busting:', fullUrl);

  // Update the profile record with the new image URL
  // First log what we're trying to save to ensure it's correct
  console.log('About to update profile', { profileId, imageUrl: fullUrl });
  
  try {
    // Update the profile record with the new image URL
    const updatedProfile = await prisma.profile.update({
      where: { id: profileId },
      data: {
        profileImage: fullUrl,
        updatedAt: new Date(),
      },
    });
    
    // Verify the update was successful
    console.log('Profile updated successfully with image URL', updatedProfile.profileImage);
    
    return updatedProfile;
  } catch (error) {
    console.error('Failed to update profile with image URL:', error);
    throw new Error(`Failed to update profile with image URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Function to remove a profile image
export async function removeProfileImage(profileId: string) {
  // Get the current profile
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { profileImage: true },
  });

  if (!profile?.profileImage) {
    return null; // No image to remove
  }

  // Extract the path from the URL
  const url = new URL(profile.profileImage);
  const pathParts = url.pathname.split('/');
  const filePath = pathParts.slice(pathParts.indexOf('profile-images') + 1).join('/');

  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured - skipping profile image removal');
  } else {
    // Remove from Supabase storage
    await supabaseAdmin.storage
      .from('profile-images')
      .remove([filePath]);
  }

  // Update the profile record to remove the image URL
  return prisma.profile.update({
    where: { id: profileId },
    data: {
      profileImage: null,
      updatedAt: new Date(),
    },
  });
}
