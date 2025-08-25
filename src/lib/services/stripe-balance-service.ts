import stripe from '@/lib/stripe'
import { db } from '@/lib/db'

interface StripeBalanceData {
  available: Array<{ amount: number; currency: string }>
  pending: Array<{ amount: number; currency: string }>
}

interface ChapterBalance {
  availableBalance: number
  pendingBalance: number
  currency: string
  lastUpdated: Date
}

export class StripeBalanceService {
  /**
   * Fetch current balance from Stripe API
   */
  static async fetchStripeBalance(): Promise<StripeBalanceData> {
    try {
      const balance = await stripe.balance.retrieve()
      return {
        available: balance.available,
        pending: balance.pending
      }
    } catch (error) {
      console.error('Error fetching Stripe balance:', error)
      throw new Error('Failed to fetch Stripe balance')
    }
  }

  /**
   * Update chapter's cached balance from Stripe
   */
  static async updateChapterBalance(chapterSlug: string): Promise<ChapterBalance> {
    const balanceData = await this.fetchStripeBalance()
    
    // Assuming USD for now - can be extended for multi-currency
    const availableUSD = balanceData.available.find(b => b.currency === 'usd')?.amount || 0
    const pendingUSD = balanceData.pending.find(b => b.currency === 'usd')?.amount || 0
    
    const updatedChapter = await db.chapter.update({
      where: { slug: chapterSlug },
      data: {
        stripeAvailableBalance: availableUSD,
        stripePendingBalance: pendingUSD,
        stripeBalanceLastUpdated: new Date()
      }
    })
    
    return {
      availableBalance: availableUSD,
      pendingBalance: pendingUSD,
      currency: 'usd',
      lastUpdated: updatedChapter.stripeBalanceLastUpdated!
    }
  }

  /**
   * Get chapter balance (from cache or fresh from Stripe)
   */
  static async getChapterBalance(chapterSlug: string, forceRefresh = false): Promise<ChapterBalance> {
    const chapter = await db.chapter.findUnique({
      where: { slug: chapterSlug },
      select: {
        stripeAvailableBalance: true,
        stripePendingBalance: true,
        stripeBalanceLastUpdated: true
      }
    })
    
    if (!chapter) {
      throw new Error('Chapter not found')
    }
    
    // Refresh if forced, no cached data, or data is older than 5 minutes
    const shouldRefresh = forceRefresh || 
      !chapter.stripeBalanceLastUpdated || 
      Date.now() - chapter.stripeBalanceLastUpdated.getTime() > 5 * 60 * 1000
    
    if (shouldRefresh) {
      return await this.updateChapterBalance(chapterSlug)
    }
    
    return {
      availableBalance: chapter.stripeAvailableBalance || 0,
      pendingBalance: chapter.stripePendingBalance || 0,
      currency: 'usd',
      lastUpdated: chapter.stripeBalanceLastUpdated!
    }
  }

  /**
   * Create a payout to transfer funds to bank account
   */
  static async createPayout(amount: number, description?: string): Promise<string> {
    try {
      const payout = await stripe.payouts.create({
        amount,
        currency: 'usd',
        description: description || 'Chapter fund transfer',
        statement_descriptor: 'GREEKDASH'
      })
      
      return payout.id
    } catch (error) {
      console.error('Error creating payout:', error)
      throw new Error('Failed to create payout')
    }
  }

  /**
   * Get payout history
   */
  static async getPayoutHistory(limit = 10) {
    try {
      const payouts = await stripe.payouts.list({ limit })
      return payouts.data.map(payout => ({
        id: payout.id,
        amount: payout.amount,
        currency: payout.currency,
        status: payout.status,
        description: payout.description,
        created: new Date(payout.created * 1000),
        arrivalDate: payout.arrival_date ? new Date(payout.arrival_date * 1000) : null
      }))
    } catch (error) {
      console.error('Error fetching payout history:', error)
      throw new Error('Failed to fetch payout history')
    }
  }
}