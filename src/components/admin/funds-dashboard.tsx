'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RefreshCw, DollarSign, Clock, TrendingUp } from 'lucide-react'
import { PayoutForm } from './payout-form'
import { PayoutHistory } from './payout-history'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface ChapterBalance {
  availableBalance: number
  pendingBalance: number
  currency: string
  lastUpdated: Date
}

interface FundsDashboardProps {
  chapterSlug: string
}

export function FundsDashboard({ chapterSlug }: FundsDashboardProps) {
  const queryClient = useQueryClient()
  
  const { data: balance, isLoading, error } = useQuery({
    queryKey: ['stripe-balance', chapterSlug],
    queryFn: async (): Promise<ChapterBalance> => {
      const response = await fetch(`/api/chapters/${chapterSlug}/admin/stripe-balance`)
      if (!response.ok) {
        throw new Error('Failed to fetch balance')
      }
      const data = await response.json()
      return {
        ...data,
        lastUpdated: new Date(data.lastUpdated)
      }
    },
    refetchInterval: 5 * 60 * 1000 // Refetch every 5 minutes
  })
  
  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/chapters/${chapterSlug}/admin/stripe-balance?refresh=true`)
      if (!response.ok) {
        throw new Error('Failed to refresh balance')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stripe-balance', chapterSlug] })
    }
  })
  
  const formatCurrency = (amountInCents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amountInCents / 100)
  }
  
  const formatLastUpdated = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return date.toLocaleDateString()
  }
  
  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            Failed to load balance information. Please try again.
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Balance Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : formatCurrency(balance?.availableBalance || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for payout
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : formatCurrency(balance?.pendingBalance || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Processing payments
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : formatCurrency((balance?.availableBalance || 0) + (balance?.pendingBalance || 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Available + Pending
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Last Updated & Refresh */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fund Management</CardTitle>
              <CardDescription>
                {balance && (
                  <>Last updated: {formatLastUpdated(balance.lastUpdated)}</>
                )}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="payout" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="payout">Transfer Funds</TabsTrigger>
              <TabsTrigger value="history">Payout History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="payout" className="space-y-4">
              <PayoutForm 
                chapterSlug={chapterSlug}
                availableBalance={balance?.availableBalance || 0}
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ['stripe-balance', chapterSlug] })
                  queryClient.invalidateQueries({ queryKey: ['payout-history', chapterSlug] })
                }}
              />
            </TabsContent>
            
            <TabsContent value="history">
              <PayoutHistory chapterSlug={chapterSlug} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}