import { PlanType } from '@/generated/prisma';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin, isSupabaseConfigured } from './index';
import path from 'path';
import { prisma } from '@/lib/db';

// Storage limits per plan in bytes
const STORAGE_LIMITS: Record<PlanType, number> = {
  [PlanType.FREE]: 100 * 1024 * 1024, // 100 MB
  [PlanType.BASIC]: 5 * 1024 * 1024 * 1024, // 5 GB
  [PlanType.PRO]: 20 * 1024 * 1024 * 1024, // 20 GB
};

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
  const storageLimit = STORAGE_LIMITS[planType];

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
    // Upload to Supabase Storage
    const { error } = await supabaseAdmin.storage
      .from('chapter-files')
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        cacheControl: '3600',
      });

    if (error) {
      throw new Error(`Supabase storage error: ${error.message}`);
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
