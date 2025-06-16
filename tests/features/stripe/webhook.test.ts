import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { buffer } from 'micro';
import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/db';
import { MembershipRole, Membership, Subscription } from '@/generated/prisma';
import { constructEvent, handleCheckoutSessionCompleted, handleSubscriptionUpdated } from '@/app/api/webhooks/stripe/handler';

// Mock dependencies
type BufferMock = jest.MockedFunction<typeof buffer>;

jest.mock('micro', () => {
  return {
    buffer: jest.fn().mockImplementation(async () => Buffer.from(''))
  };
});

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: jest.fn(),
    },
  }));
});

jest.mock('@/lib/db', () => ({
  prisma: {
    membership: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    chapter: {
      findUnique: jest.fn(),
    },
    subscription: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    payment: {
      create: jest.fn(),
    },
    $transaction: jest.fn(<T>(callback: () => Promise<T> | T) => Promise.resolve(callback())),
  },
}));

describe('Stripe Webhook Handler', () => {
  const mockStripeSignature = 'whsec_test_signature';
  const mockRawBody = JSON.stringify({ type: 'test_event' });
  const mockEvent = {
    id: 'evt_test123',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test123',
        customer: 'cus_test123',
        subscription: 'sub_test123',
        client_reference_id: 'membership_123|chapter_abc',
        metadata: {
          membershipId: 'membership_123',
          chapterId: 'chapter_abc',
          userId: 'user_123',
          createdAt: new Date(),
        updatedAt: new Date(),
        },
      },
    },
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default stripe constructor mock
    (Stripe as unknown as jest.Mock).mockClear();
    
    // Default buffer mock
    (buffer as BufferMock).mockImplementation(async () => Buffer.from(mockRawBody));
    
    // Default constructEvent mock
    const stripeMock = new Stripe('fake_key');
    (stripeMock.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);
  });
  
  describe('constructEvent', () => {
    it('should properly validate Stripe signature and construct event', async () => {
      // Create a proper mock of NextRequest with required methods
      const mockReq = {
        headers: {
          get: (name: string) => name === 'stripe-signature' ? mockStripeSignature : null,
        },
        text: () => Promise.resolve(mockRawBody),
        // Add other required NextRequest properties as needed
        cookies: { getAll: () => [] },
        nextUrl: { pathname: '/api/webhooks/stripe' },
      } as unknown as NextRequest;
      
      const result = await constructEvent(mockReq);
      
      expect(result).toEqual({
        success: true,
        event: mockEvent,
      });
      
      // Verify signature validation occurred
      const stripeMock = new Stripe('');
      expect(stripeMock.webhooks.constructEvent).toHaveBeenCalledWith(
        expect.any(Buffer),
        mockStripeSignature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    });
    
    it('should handle invalid Stripe signature', async () => {
      const mockReq = {
        headers: {
          get: (name: string) => name === 'stripe-signature' ? 'invalid_signature' : null,
          getAll: () => [],
        },
        text: () => Promise.resolve(''),
        nextUrl: { pathname: '/api/webhooks/stripe' },
      } as unknown as NextRequest;
      
      // Mock signature verification failure
      const stripeMock = new Stripe('fake_key');
      (stripeMock.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid signature');
      });
      
      const result = await constructEvent(mockReq);
      
      expect(result).toEqual({
        success: false,
        error: expect.stringContaining('Invalid signature'),
      });
    });
  });
  
  describe('handleCheckoutSessionCompleted', () => {
    const checkoutEvent = {
      id: 'evt_checkout123',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test123',
          customer: 'cus_test123',
          subscription: 'sub_test123',
          metadata: {
            membershipId: 'membership_123',
            chapterId: 'chapter_abc',
            userId: 'user_123',
            createdAt: new Date(),
        updatedAt: new Date(),
          },
        },
      },
    };
    
    it('should create subscription and update membership tier', async () => {
      // Mock membership lookup
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue({
        id: 'membership_123',
        userId: 'user_123',
        chapterId: 'chapter_abc',
        role: MembershipRole.MEMBER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Mock subscription creation
      (prisma.subscription.create as jest.Mock).mockResolvedValue({
        id: 'db_sub_123',
        stripeSubscriptionId: 'sub_test123',
        stripeCustomerId: 'cus_test123',
        membershipId: 'membership_123',
        role: MembershipRole.MEMBER,
        tier: 'PRO',
      });
      
      // Mock membership update
      (prisma.membership.update as jest.Mock).mockResolvedValue({
        id: 'membership_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      const result = await handleCheckoutSessionCompleted(checkoutEvent);
      
      expect(result.success).toBe(true);
      
      // Verify tenant isolation checks
      expect(prisma.membership.findUnique).toHaveBeenCalledWith({
        where: { id: 'membership_123' },
        include: { chapter: true },
      });
      
      // Verify subscription was created with stripe details
      expect(prisma.subscription.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          stripeSubscriptionId: 'sub_test123',
          stripeCustomerId: 'cus_test123',
          membershipId: 'membership_123',
          tier: 'PRO',
        }),
      });
      
      // Verify membership tier was updated
      expect(prisma.membership.update).toHaveBeenCalledWith({
        where: { id: 'membership_123' },
        data: { createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
    
    it('should handle when metadata is missing', async () => {
      const invalidEvent = {
        ...checkoutEvent,
        data: {
          object: {
            id: 'cs_test123',
            customer: 'cus_test123',
            subscription: 'sub_test123',
            // Missing metadata
          },
        },
      };
      
      const result = await handleCheckoutSessionCompleted(invalidEvent);
      
      expect(result).toEqual({
        success: false,
        error: 'Missing required metadata',
      });
      
      // Verify no database operations were performed
      expect(prisma.subscription.create).not.toHaveBeenCalled();
      expect(prisma.membership.update).not.toHaveBeenCalled();
    });
    
    it('should handle membership not found error', async () => {
      // Mock membership not found
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue(null);
      
      const result = await handleCheckoutSessionCompleted(checkoutEvent);
      
      expect(result).toEqual({
        success: false,
        error: 'Membership not found',
      });
      
      // Verify no further database operations were performed
      expect(prisma.subscription.create).not.toHaveBeenCalled();
      expect(prisma.membership.update).not.toHaveBeenCalled();
    });
    
    it('should handle duplicate subscription idempotently', async () => {
      // Mock membership lookup
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue({
        id: 'membership_123',
        userId: 'user_123',
        chapterId: 'chapter_abc',
        role: MembershipRole.MEMBER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Mock subscription creation throwing a unique constraint error
      (prisma.subscription.create as jest.Mock).mockRejectedValue({
        code: 'P2002', // Prisma unique constraint violation
        meta: { target: ['stripeSubscriptionId'] },
      });
      
      const result = await handleCheckoutSessionCompleted(checkoutEvent);
      
      // Should still succeed for idempotency
      expect(result.success).toBe(true);
      expect(result.message).toContain('already exists');
    });
  });
  
  describe('handleSubscriptionUpdated', () => {
    const subscriptionEvent = {
      id: 'evt_sub_update123',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_test123',
          customer: 'cus_test123',
          status: 'active',
          items: {
            data: [{
              price: {
                metadata: {
                  tier: 'BASIC',
                },
              },
            }],
          },
        },
      },
    };
    
    it('should update subscription status and membership tier', async () => {
      // Mock subscription lookup
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        id: 'db_sub_123',
        stripeSubscriptionId: 'sub_test123',
        stripeCustomerId: 'cus_test123',
        membershipId: 'membership_123',
        role: MembershipRole.MEMBER,
        tier: 'FREE',
      });
      
      // Mock membership lookup
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue({
        id: 'membership_123',
        userId: 'user_123',
        chapterId: 'chapter_abc',
        role: MembershipRole.MEMBER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      const result = await handleSubscriptionUpdated(subscriptionEvent);
      
      expect(result.success).toBe(true);
      
      // Verify subscription was updated
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: 'sub_test123' },
        data: {
          status: 'active',
          tier: 'BASIC',
        },
      });
      
      // Verify membership tier was synced
      expect(prisma.membership.update).toHaveBeenCalledWith({
        where: { id: 'membership_123' },
        data: { createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
    
    it('should handle subscription not found', async () => {
      // Mock subscription not found
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(null);
      
      const result = await handleSubscriptionUpdated(subscriptionEvent);
      
      expect(result).toEqual({
        success: false,
        error: 'Subscription not found in database',
      });
      
      // Verify no update operations were performed
      expect(prisma.subscription.update).not.toHaveBeenCalled();
      expect(prisma.membership.update).not.toHaveBeenCalled();
    });
    
    it('should handle subscription cancellation', async () => {
      const cancelEvent = {
        ...subscriptionEvent,
        data: {
          object: {
            ...subscriptionEvent.data.object,
            status: 'canceled',
          },
        },
      };
      
      // Mock subscription lookup
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        id: 'db_sub_123',
        stripeSubscriptionId: 'sub_test123',
        stripeCustomerId: 'cus_test123',
        membershipId: 'membership_123',
        role: MembershipRole.MEMBER,
        tier: 'PRO',
      });
      
      // Mock membership lookup
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue({
        id: 'membership_123',
        userId: 'user_123',
        chapterId: 'chapter_abc',
        role: MembershipRole.MEMBER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      const result = await handleSubscriptionUpdated(cancelEvent);
      
      expect(result.success).toBe(true);
      
      // Verify subscription status was updated
      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'canceled',
          }),
        })
      );
      
      // Verify membership tier was downgraded to FREE
      expect(prisma.membership.update).toHaveBeenCalledWith({
        where: { id: 'membership_123' },
        data: { createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
  });
});
