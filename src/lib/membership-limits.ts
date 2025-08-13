import { prisma } from '@/lib/db';
import { PlanType, MembershipRole } from '@/generated/prisma';

export async function checkMemberLimit(chapterId: string, planType: PlanType): Promise<boolean> {
  const memberCount = await prisma.membership.count({
    where: { 
      chapterId,
      role: {
        not: MembershipRole.PENDING_MEMBER // Exclude pending members from count
      }
    }
  });
  
  const limits: Record<PlanType, number> = {
    [PlanType.FREE]: 30, // Per pricing document
    [PlanType.BASIC]: 30, // Per pricing document  
    [PlanType.PRO]: Infinity, // Unlimited
    [PlanType.ENTERPRISE]: Infinity // Unlimited
  };
  
  return memberCount < limits[planType];
}