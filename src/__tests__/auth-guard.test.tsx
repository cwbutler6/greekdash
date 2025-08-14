import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import AuthGuard from '@/components/auth/auth-guard';

// Mock the hooks
vi.mock('next-auth/react');
vi.mock('next/navigation');

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockUseRouter = vi.mocked(useRouter);
const mockUseSession = vi.mocked(useSession);
const mockUsePathname = vi.mocked(usePathname);

interface MockRouter {
  push: ReturnType<typeof vi.fn>;
  replace: ReturnType<typeof vi.fn>;
  back: ReturnType<typeof vi.fn>;
  forward: ReturnType<typeof vi.fn>;
  refresh: ReturnType<typeof vi.fn>;
  prefetch: ReturnType<typeof vi.fn>;
}

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    } as MockRouter);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Social User Redirect Bug', () => {
    it('should redirect social users without memberships to /social-signup instead of /signup', async () => {
      // Mock a social user (authenticated via OAuth) with no memberships
      const socialUserSession = {
        user: {
          id: 'social-user-1',
          name: 'Social User',
          email: 'social@example.com',
          memberships: [], // No memberships
          isNewUser: true, // This indicates they came from social login
        },
        expires: '2024-12-31T23:59:59.999Z',
      };

      mockUseSession.mockReturnValue({
        data: socialUserSession,
        status: 'authenticated',
        update: vi.fn(),
      });

      // Mock pathname as a protected route (not signup or social-signup)
      mockUsePathname.mockReturnValue('/dashboard');

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        // Fix: AuthGuard uses router.push(), not router.replace()
        expect(mockPush).toHaveBeenCalledWith('/social-signup');
      });
    });

    it('should redirect regular users without memberships to /signup (correct behavior)', async () => {
      // Mock a regular user (credentials login) with no memberships
      const regularUserSession = {
        user: {
          id: 'regular-user-1',
          name: 'Regular User',
          email: 'regular@example.com',
          memberships: [], // No memberships
          isNewUser: false, // Not a new social user
        },
        expires: '2024-12-31T23:59:59.999Z',
      };

      mockUseSession.mockReturnValue({
        data: regularUserSession,
        status: 'authenticated',
        update: vi.fn(),
      });

      mockUsePathname.mockReturnValue('/dashboard');

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        // Fix: AuthGuard uses router.push(), not router.replace()
        expect(mockPush).toHaveBeenCalledWith('/signup');
      });
    });

    it('should allow social users to stay on /social-signup page', async () => {
      const socialUserSession = {
        user: {
          id: 'social-user-1',
          name: 'Social User',
          email: 'social@example.com',
          memberships: [],
          isNewUser: true,
        },
        expires: '2024-12-31T23:59:59.999Z',
      };

      mockUseSession.mockReturnValue({
        data: socialUserSession,
        status: 'authenticated',
        update: vi.fn().mockResolvedValue(undefined), // Fix: Return a resolved Promise
      });

      // User is already on social-signup page
      mockUsePathname.mockReturnValue('/social-signup');

      render(
        <AuthGuard>
          <div>Social Signup Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        // Should not redirect when already on the correct page
        expect(mockPush).not.toHaveBeenCalled();
        expect(mockReplace).not.toHaveBeenCalled();
      });
    });

    it('should allow regular users to stay on /signup page', async () => {
      const regularUserSession = {
        user: {
          id: 'regular-user-1',
          name: 'Regular User',
          email: 'regular@example.com',
          memberships: [],
          isNewUser: false,
        },
        expires: '2024-12-31T23:59:59.999Z',
      };

      mockUseSession.mockReturnValue({
        data: regularUserSession,
        status: 'authenticated',
        update: vi.fn(),
      });

      // User is already on signup page
      mockUsePathname.mockReturnValue('/signup');

      render(
        <AuthGuard>
          <div>Signup Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        // Should not redirect when already on the correct page
        expect(mockPush).not.toHaveBeenCalled();
        expect(mockReplace).not.toHaveBeenCalled();
      });
    });

    it('should redirect users with memberships to their appropriate dashboard', async () => {
      const userWithMembership = {
        user: {
          id: 'member-user-1',
          name: 'Member User',
          email: 'member@example.com',
          memberships: [{
            id: 'membership-1',
            role: 'MEMBER',
            chapterId: 'chapter-1',
            chapterSlug: 'test-chapter',
            userId: 'member-user-1'
          }],
          isNewUser: false,
        },
        expires: '2024-12-31T23:59:59.999Z',
      };

      mockUseSession.mockReturnValue({
        data: userWithMembership,
        status: 'authenticated',
        update: vi.fn(),
      });

      mockUsePathname.mockReturnValue('/signup');

      render(
        <AuthGuard>
          <div>Signup Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        // Fix: AuthGuard uses router.push() and redirects to portal for MEMBER role
        expect(mockPush).toHaveBeenCalledWith('/test-chapter/portal');
      });
    });
  });
});