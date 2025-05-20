"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

// Helper function to get user initials
const getInitials = (name?: string | null): string => {
  if (!name) return "U";
  return name
    .split(" ")
    .map(part => part.charAt(0))
    .join("");
};

interface UserMenuProps {
  primaryColor?: string;
  secondaryColor?: string;
}

export default function UserMenu({ 
  primaryColor = "#1d4ed8", // Default blue if no color provided
  secondaryColor = "#ffffff" 
}: UserMenuProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  if (!session?.user) {
    return (
      <div className="flex items-center space-x-4">
        <Link
          href="/login"
          className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        className="flex items-center space-x-2 rounded-full focus:outline-none focus:ring-2 focus:ring-white px-4 py-1"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="relative h-8 w-8 overflow-hidden rounded-full">
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt="User avatar"
              fill
              className="object-cover"
            />
          ) : (
            <div 
              className="flex h-full w-full items-center justify-center text-sm font-medium"
              style={{
                backgroundColor: secondaryColor,
                color: primaryColor
              }}
            >
              {getInitials(session.user.name) || session.user.email?.charAt(0) || "U"}
            </div>
          )}
        </div>
        <span className="hidden text-sm font-medium md:block">
          {getInitials(session.user.name) || session.user.email?.split("@")[0]}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-gray-200 focus:outline-none z-50">
          <div className="px-4 py-3 text-black">
            <p className="text-sm">Signed in as</p>
            <p className="truncate text-sm font-medium">
              {session.user.email}
            </p>
          </div>
          <div className="border-t border-gray-200">
            <div className="py-1">
              {session.user.memberships && session.user.memberships.length > 0 && (
                <div className="px-4 py-2">
                  <p className="text-xs font-semibold uppercase text-gray-500">Chapters</p>
                  <div className="mt-1 space-y-1">
                    {session.user.memberships.map((membership) => (
                      <Link
                        key={membership.id}
                        href={membership.role === 'OWNER' || membership.role === 'ADMIN'
                          ? `/${membership.chapterSlug}/admin`
                          : `/${membership.chapterSlug}/portal`}
                        className="block rounded-md px-2 py-1 text-sm hover:bg-gray-100"
                        onClick={() => setIsOpen(false)}
                      >
                        <span className="text-black">{membership.chapterSlug}</span>
                        <span 
                          className="ml-2 rounded px-1.5 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: `${primaryColor}20`, // Using hex with 20% opacity
                            color: primaryColor
                          }}
                        >
                          {membership.role.toLowerCase()}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              
              {session.user.memberships && session.user.memberships.length > 0 && (
                <Link
                  href={`/${session.user.memberships[0].chapterSlug}/profile`}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  Profile
                </Link>
              )}
              
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
