import React from "react";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { db } from "@/lib/db";
import { MembershipRole } from "@/generated/prisma";
import { Container } from "@/components/ui/container";
import TreasuryDashboard from "./treasury-dashboard";

export const metadata: Metadata = {
  title: "Treasury DeFi | GreekDash",
  description: "Manage your chapter treasury and DeFi investments",
};

export default async function TreasuryPage({
  params,
}: {
  params: Promise<{ chapterSlug: string }>;
}) {
  const { chapterSlug } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return notFound();
  }

  // Check if the user has permission to access treasury features
  const membership = await db.membership.findFirst({
    where: {
      user: { id: session.user.id },
      chapter: { slug: chapterSlug },
      role: { in: [MembershipRole.ADMIN, MembershipRole.OWNER] },
    },
  });

  if (!membership) {
    return notFound();
  }

  // Get chapter information
  const chapter = await db.chapter.findUnique({
    where: { slug: chapterSlug },
    select: {
      id: true,
      name: true,
      chapterTreasuryBalance: true,
      autoInvestEnabled: true,
      autoInvestStrategy: true,
      walletAddress: true,
      treasuryLastYield: true,
      treasuryLastYieldDate: true,
    },
  });

  if (!chapter) {
    return notFound();
  }

  // Get treasury transactions
  const transactions = await db.treasuryTransaction.findMany({
    where: { chapterId: chapter.id },
    orderBy: { createdAt: "desc" },
    take: 10, // Limit to recent transactions
  });

  return (
    <Container>
      <TreasuryDashboard 
        chapterSlug={chapterSlug}
        initialTreasuryData={{
          details: chapter,
          transactions,
        }}
      />
    </Container>
  );
}
