import { PlanType } from '@/generated/prisma';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin, isSupabaseConfigured } from './index';
import path from 'path';
import { prisma } from '@/lib/db';
import { getStorageLimit } from '@/lib/storage-limits';

interface UploadFileParams {
  chapterId: string;
  uploaderId: string;
  fileName: string;
  mimeType: string;
  fileBuffer: Buffer;
  fileSize: number;
  folderPath?: string; // Optional path for folder organization
}

export async function uploadFile({
  chapterId,
  uploaderId,
  fileName,
  mimeType,
  fileBuffer,
  fileSize,
  folderPath = '/', // Default to root folder if not specified
}: UploadFileParams) {
  // Get chapter's subscription plan to determine storage limit
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: { subscription: true },
  });

  if (!chapter) {
    throw new Error('Chapter not found');
  }

  const planType: PlanType = chapter.subscription?.plan || PlanType.FREE;
  const storageLimit = getStorageLimit(planType);

  // Calculate current storage usage
  const currentUsage = await prisma.file.aggregate({
    where: { chapterId },
    _sum: { size: true },
  });

  const totalUsed = currentUsage._sum.size || 0;

  // Check if upload would exceed limit
  if (totalUsed + fileSize > storageLimit) {
    throw new Error('Storage limit exceeded for your subscription plan');
  }

  // Generate a unique filename to avoid collisions
  const fileExtension = path.extname(fileName);
  const uniqueFilename = `${uuidv4()}${fileExtension}`;
  const filePath = `${chapterId}/${uniqueFilename}`;

  // Check if Supabase is configured (skip during build time)
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured - skipping storage upload');
  } else {
    try {
      // Try to ensure the bucket exists
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === 'chapter-files');
      
      if (!bucketExists) {
        console.log('Creating chapter-files bucket in Supabase...');
        await supabaseAdmin.storage.createBucket('chapter-files', {
          public: true,
          fileSizeLimit: 52428800, // 50MB in bytes
        });
        console.log('Bucket created successfully');
      }

      // Upload to Supabase Storage
      const { error } = await supabaseAdmin.storage
        .from('chapter-files')
        .upload(filePath, fileBuffer, {
          contentType: mimeType,
          cacheControl: '3600',
        });

      if (error) {
        if (error.message?.includes('Bucket not found')) {
          console.error('Bucket not found even after creation attempt');
          throw new Error('Unable to create or access storage bucket');
        }
        throw new Error(`Supabase storage error: ${error.message}`);
      }
    } catch (err) {
      console.error('Error with Supabase storage operation:', err);
      throw new Error(`Storage operation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  // Create file record in the database
  return prisma.file.create({
    data: {
      name: fileName,
      path: filePath,
      displayPath: folderPath || '/', // Use the specified folder path or root
      mimeType,
      size: fileSize,
      chapterId,
      uploaderId,
    },
  });
}
