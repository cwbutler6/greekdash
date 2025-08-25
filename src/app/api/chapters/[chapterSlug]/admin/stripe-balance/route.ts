import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { StripeBalanceService } from '@/lib/services/stripe-balance-service'
import { hasChapterAccess, hasAdminAccess } from '@/lib/auth-utils'

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
    
    const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true'
    const balance = await StripeBalanceService.getChapterBalance(chapterSlug, forceRefresh)
    
    return NextResponse.json(balance)
  } catch (error) {
    console.error('Error fetching balance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    )
  }
}