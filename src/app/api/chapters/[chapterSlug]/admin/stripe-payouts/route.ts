import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { StripeBalanceService } from '@/lib/services/stripe-balance-service'
import { hasChapterAccess, hasAdminAccess } from '@/lib/auth-utils'
import { z } from 'zod'

const payoutSchema = z.object({
  amount: z.number().min(100), // Minimum $1.00 in cents
  description: z.string().optional()
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chapterSlug: string }> }
) {
  try {
    const { chapterSlug } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const hasAccess = await hasChapterAccess(session.user.email, chapterSlug)
    const isAdmin = await hasAdminAccess(session.user.email, chapterSlug)
    
    if (!hasAccess || !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const body = await request.json()
    const { amount, description } = payoutSchema.parse(body)
    
    // Check available balance
    const balance = await StripeBalanceService.getChapterBalance(chapterSlug)
    if (balance.availableBalance < amount) {
      return NextResponse.json(
        { error: 'Insufficient funds' },
        { status: 400 }
      )
    }
    
    const payoutId = await StripeBalanceService.createPayout(amount, description)
    
    // Refresh balance after payout
    await StripeBalanceService.updateChapterBalance(chapterSlug)
    
    return NextResponse.json({ payoutId, success: true })
  } catch (error) {
    console.error('Error creating payout:', error)
    return NextResponse.json(
      { error: 'Failed to create payout' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chapterSlug: string }> }
) {
  try {
    const { chapterSlug } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const hasAccess = await hasChapterAccess(session.user.email, chapterSlug)
    const isAdmin = await hasAdminAccess(session.user.email, chapterSlug)
    
    if (!hasAccess || !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const payouts = await StripeBalanceService.getPayoutHistory()
    
    return NextResponse.json(payouts)
  } catch (error) {
    console.error('Error fetching payouts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payouts' },
      { status: 500 }
    )
  }
}