'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { DollarSign, AlertCircle } from 'lucide-react'

interface PayoutFormProps {
  chapterSlug: string
  availableBalance: number
  onSuccess?: () => void
}

export function PayoutForm({ chapterSlug, availableBalance, onSuccess }: PayoutFormProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')

  const createPayoutMutation = useMutation({
    mutationFn: async (data: { amount: number; description?: string }) => {
      const response = await fetch(`/api/chapters/${chapterSlug}/admin/stripe-payouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create payout')
      }
      
      return response.json()
    },
    onSuccess: () => {
      toast.success('Payout created successfully')
      setAmount('')
      setDescription('')
      onSuccess?.()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create payout')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const amountInCents = Math.round(parseFloat(amount) * 100)
    
    if (isNaN(amountInCents) || amountInCents <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    
    if (amountInCents > availableBalance) {
      toast.error('Amount exceeds available balance')
      return
    }
    
    createPayoutMutation.mutate({
      amount: amountInCents,
      description: description.trim() || undefined,
    })
  }

  const maxAmount = availableBalance / 100 // Convert from cents to dollars

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Transfer Funds
        </CardTitle>
        <CardDescription>
          Transfer available funds to your connected bank account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={maxAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              disabled={createPayoutMutation.isPending}
            />
            <p className="text-sm text-muted-foreground">
              Available: {formatCurrency(availableBalance)}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description for this transfer..."
              disabled={createPayoutMutation.isPending}
              maxLength={200}
            />
          </div>
          
          {availableBalance === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No funds available for transfer. Funds become available after payments are processed.
              </AlertDescription>
            </Alert>
          )}
          
          <Button 
            type="submit" 
            disabled={createPayoutMutation.isPending || availableBalance === 0 || !amount}
            className="w-full"
          >
            {createPayoutMutation.isPending ? 'Processing...' : 'Create Transfer'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}