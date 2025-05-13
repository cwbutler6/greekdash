// This file helps Next.js understand that this route group
// should be treated independently from the regular chapter routes

export const dynamic = 'force-dynamic';

// This ensures this route has its own layout hierarchy and doesn't inherit from parent
export const revalidate = 0;
