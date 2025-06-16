import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Stripe from "stripe";

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil", // Use the appropriate API version
});

export async function POST(request: Request) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const formData = await request.formData();
    const chapterSlug = formData.get("chapterSlug") as string;
    const priceId = formData.get("priceId") as string;
    
    if (!chapterSlug || !priceId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Get the chapter and verify user is an admin
    const chapter = await db.chapter.findUnique({
      where: {
        slug: chapterSlug,
      },
      include: {
        memberships: {
          where: {
            userId: session.user.id,
            role: { in: ['ADMIN', 'OWNER'] },
          },
        },
      },
    });
    
    if (!chapter || chapter.memberships.length === 0) {
      return NextResponse.json(
        { error: "Unauthorized: Only chapter admins can manage subscriptions" },
        { status: 403 }
      );
    }
    
    // Check if the chapter already has a Stripe customer ID
    let customerId = chapter.stripeCustomerId;
    
    // If not, create a new customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email!,
        name: chapter.name,
        metadata: {
          chapterId: chapter.id,
          chapterSlug: chapter.slug,
        },
      });
      
      customerId = customer.id;
      
      // Save the customer ID to the chapter
      await db.chapter.update({
        where: { id: chapter.id },
        data: { stripeCustomerId: customerId },
      });
    }
    
    // Create the checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          chapterId: chapter.id,
          chapterSlug: chapter.slug,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/${chapterSlug}/admin/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/${chapterSlug}/admin/upgrade?canceled=true`,
      metadata: {
        chapterId: chapter.id,
        chapterSlug: chapter.slug,
      },
    });
    
    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
