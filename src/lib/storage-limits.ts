import { PlanType } from '@/generated/prisma';

// Storage limits per plan in bytes
export const STORAGE_LIMITS: Record<PlanType, number> = {
  [PlanType.FREE]: 100 * 1024 * 1024, // 100 MB
  [PlanType.BASIC]: 3 * 1024 * 1024 * 1024, // 3 GB
  [PlanType.PRO]: 20 * 1024 * 1024 * 1024, // 20 GB
  [PlanType.ENTERPRISE]: 100 * 1024 * 1024 * 1024, // 100 GB
};

// Maximum file size per plan in bytes
export const MAX_FILE_SIZE: Record<PlanType, number> = {
  [PlanType.FREE]: 20 * 1024 * 1024, // 20 MB
  [PlanType.BASIC]: 50 * 1024 * 1024, // 50 MB
  [PlanType.PRO]: 100 * 1024 * 1024, // 100 MB
  [PlanType.ENTERPRISE]: 500 * 1024 * 1024, // 500 MB
};

// Helper functions
export function getStorageLimit(planType: PlanType): number {
  return STORAGE_LIMITS[planType];
}

export function getMaxFileSize(planType: PlanType): number {
  return MAX_FILE_SIZE[planType];
}

export function formatStorageLimitText(planType: PlanType): string {
  const limit = STORAGE_LIMITS[planType];
  if (limit >= 1024 * 1024 * 1024) {
    return `${limit / (1024 * 1024 * 1024)}GB`;
  }
  return `${limit / (1024 * 1024)}MB`;
}