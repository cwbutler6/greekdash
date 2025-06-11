# task: treasury-defi-integration

## Goal

Build a full-featured Chapter Treasury system for GreekDash. This lets chapter admins:

- View their treasury balance and yield
- Deposit idle dues into Aave to earn interest
- Enable “auto-invest” mode via Morpheus to optimize yield passively
- Manage all treasury actions via a secure, easy-to-use admin dashboard

---

## Tech Stack

- Next.js 15 App Router
- Tailwind CSS + shadcn/ui
- Supabase + Prisma
- Blockchain interaction via ethers.js
- Contracts deployed on Polygon or Mumbai

---

## 🔧 Backend: Prisma Schema Changes

Extend `Chapter` model:

```prisma
model Chapter {
  id                      Int      @id @default(autoincrement())
  slug                    String   @unique
  name                    String
  ...
  chapterTreasuryBalance  Float    @default(0)
  autoInvestEnabled       Boolean  @default(false)
  autoInvestStrategy      String?  // 'balanced', 'conservative', etc.
  treasuryTransactions    TreasuryTransaction[]
}

model TreasuryTransaction {
  id          Int      @id @default(autoincrement())
  chapter     Chapter  @relation(fields: [chapterId], references: [id])
  chapterId   Int
  amount      Float
  type        String   // 'deposit', 'withdraw', 'autoinvest'
  txHash      String
  createdAt   DateTime @default(now())
}
