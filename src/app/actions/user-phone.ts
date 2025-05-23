'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db';
import { isValidPhoneNumber } from '@/lib/validation';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

const PhoneSettingsSchema = z.object({
  phone: z.string()
    .min(10, { message: 'Phone number must be at least 10 digits' })
    .regex(/^\+?[0-9]+$/, { message: 'Please enter a valid phone number' })
    .refine(val => isValidPhoneNumber(val), {
      message: 'Phone number must be in E.164 format (e.g. +12125551234)',
    }),
  smsEnabled: z.boolean().default(true),
});

export type PhoneSettingsFormData = z.infer<typeof PhoneSettingsSchema>;

export async function updatePhoneSettings(formData: PhoneSettingsFormData, chapterSlug: string) {
  const session = await getSession();
  
  if (!session?.user?.id) {
    return {
      success: false,
      error: 'You must be signed in to update your phone settings',
    };
  }

  try {
    const validatedData = PhoneSettingsSchema.parse(formData);
    
    // Get active membership for the user in the current chapter
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        chapter: {
          slug: chapterSlug,
        },
      },
      include: {
        profile: true,
      },
    });

    if (!membership || !membership.profile) {
      return {
        success: false,
        error: 'User profile not found',
      };
    }

    // Update the profile with new phone settings
    await prisma.profile.update({
      where: {
        id: membership.profile.id,
      },
      data: {
        phone: validatedData.phone,
        // Consider phone as not verified until verification flow is completed
        phoneVerified: false,
        smsEnabled: validatedData.smsEnabled,
      },
    });

    // In a real implementation, we might want to trigger a verification SMS here
    // For now, we'll just update the settings
    
    // Revalidate the path to reflect changes
    revalidatePath(`/${chapterSlug}/settings`);
    
    return {
      success: true,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }
    
    return {
      success: false,
      error: 'Something went wrong updating your phone settings',
    };
  }
}
