'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils'
import { History, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PayoutRecord {
  id: string
  amount: number
  currency: string
  status: string
  description: string | null
  created: Date
  arrivalDate: Date | null
}

interface PayoutHistoryProps {
  chapterSlug: string
}

export function PayoutHistory({ chapterSlug }: PayoutHistoryProps) {
  const { data: payouts, isLoading, error } = useQuery({
    queryKey: ['payout-history', chapterSlug],
    queryFn: async (): Promise<PayoutRecord[]> => {
      const response = await fetch(`/api/chapters/${chapterSlug}/admin/stripe-payouts`)
      if (!response.ok) {
        throw new Error('Failed to fetch payout history')
      }
      const data = await response.json()
      return data.map((payout: PayoutRecord) => ({
        ...payout,
        created: new Date(payout.created),
        arrivalDate: payout.arrivalDate ? new Date(payout.arrivalDate) : null,
      }))
    },
  })

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'in_transit':
        return 'outline'
      case 'canceled':
      case 'failed':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Completed'
      case 'pending':
        return 'Pending'
      case 'in_transit':
        return 'In Transit'
      case 'canceled':
        return 'Canceled'
      case 'failed':
        return 'Failed'
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  if (error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load payout history. Please try again.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Payout History
        </CardTitle>
        <CardDescription>
          Track the status of your fund transfers
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : !payouts || payouts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No payout history available</p>
            <p className="text-sm">Your fund transfers will appear here</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Arrival Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell>
                      {formatDate(payout.created)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(payout.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(payout.status)}>
                        {getStatusLabel(payout.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payout.description || 'Chapter fund transfer'}
                    </TableCell>
                    <TableCell>
                      {payout.arrivalDate ? formatDate(payout.arrivalDate) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}