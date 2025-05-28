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

  // Upload to Supabase Storage
  const { error } = await supabaseAdmin.storage
    .from('profile-images')
    .upload(filePath, fileBuffer, {
      contentType: mimeType,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Supabase storage error: ${error.message}`);
  }

  // Get the public URL
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('profile-images')
    .getPublicUrl(filePath);

  // Update the profile record with the new image URL
  return prisma.profile.update({
    where: { id: profileId },
    data: {
      profileImage: publicUrl,
      updatedAt: new Date(),
    },
  });
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
