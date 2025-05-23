import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireChapterAccess } from "@/lib/auth";
import { MembershipRole } from "@/generated/prisma";
import stripe from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const chapterSlug = formData.get('chapterSlug') as string;

    if (!chapterSlug) {
      return NextResponse.json(
        { error: "Missing chapter slug" },
        { status: 400 }
      );
    }

    // Get the authenticated user and membership with access check
    const { membership } = await requireChapterAccess(chapterSlug);

    // Check if the user has admin privileges
    if (
      membership.role !== MembershipRole.ADMIN &&
      membership.role !== MembershipRole.OWNER
    ) {
      return NextResponse.json(
        { error: "You must be an admin to perform this action" },
        { status: 403 }
      );
    }

    // Get the chapter with its Stripe customer ID
    const chapter = await db.chapter.findUnique({
      where: { slug: chapterSlug }
    });

    if (!chapter) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      );
    }

    // Check if the chapter has a Stripe customer ID
    if (!chapter.stripeCustomerId) {
      return NextResponse.json(
        { error: "This chapter doesn't have a Stripe account yet" },
        { status: 400 }
      );
    }

    // Create a billing portal session
    const sessionParams = {
      customer: chapter.stripeCustomerId,
      return_url: `${request.headers.get('origin')}/${chapterSlug}/admin/billing`,
      ...(process.env.STRIPE_PORTAL_CONFIG_ID ? { configuration: process.env.STRIPE_PORTAL_CONFIG_ID } : {})
    };
    
    const session = await stripe.billingPortal.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating Stripe portal link:", error);
    return NextResponse.json(
      { error: "Failed to create Stripe portal link" },
      { status: 500 }
    );
  }
}
