'use client';

interface DuesPayment {
  id: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid';
  paidAt: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null | undefined;
  };
}

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Filter, Eye, CreditCard, Trash2 } from 'lucide-react';
import { formatCurrency } from "@/lib/utils/format";
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface DuesListProps {
  chapterSlug: string;
  status?: 'pending' | 'paid';
}

export function DuesList({ chapterSlug, status }: DuesListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedDuesId, setSelectedDuesId] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'pending' | 'paid' | 'all'>(status || 'all');

  // Fetch dues data
  const { data: duesPayments, isLoading, error, refetch } = useQuery<DuesPayment[]>({
    queryKey: ['dues', chapterSlug, filterStatus],
    queryFn: async () => {
      const url = filterStatus === 'all' 
        ? `/api/chapters/${chapterSlug}/finance/dues` 
        : `/api/chapters/${chapterSlug}/finance/dues?status=${filterStatus}`;
      
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to fetch dues payments');
      }
      return res.json();
    },
  });

  // Delete dues payment mutation
  const deleteDuesMutation = useMutation({
    mutationFn: async (duesId: string) => {
      const res = await fetch(`/api/chapters/${chapterSlug}/finance/dues/${duesId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete dues payment');
      }
      return res.json();
    },
  });

  // Handle dues deletion
  const handleDelete = async () => {
    if (!selectedDuesId) return;
    
    try {
      await deleteDuesMutation.mutateAsync(selectedDuesId);
      toast.success('Dues payment deleted successfully');
      refetch();
    } catch (error) {
      toast.error('Error deleting dues payment');
      console.error(error);
    } finally {
      setDeleteDialogOpen(false);
      setSelectedDuesId(null);
    }
  };

  // Handle payment initiation
  const handlePayment = async () => {
    if (!selectedDuesId) return;
    
    setPaymentProcessing(true);
    
    try {
      const res = await fetch(`/api/chapters/${chapterSlug}/finance/dues/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duesPaymentId: selectedDuesId,
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to create payment session');
      }
      
      const data = await res.json();
      
      if (data.url) {
        setPaymentUrl(data.url);
      } else {
        throw new Error('No payment URL returned');
      }
    } catch (error) {
      toast.error('Error creating payment session');
      console.error(error);
      setPayDialogOpen(false);
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Helper to get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center p-4">
            <AlertCircle className="h-8 w-8 text-destructive mr-2" />
            <p>Failed to load dues payments. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0 sm:p-6">
          <div className="flex justify-between items-center mb-4 p-4 sm:p-0">
            <h3 className="text-lg font-medium">Dues Payments</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  {filterStatus === 'all' ? 'All' : filterStatus === 'pending' ? 'Pending' : 'Paid'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                  All
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('pending')}>
                  Pending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('paid')}>
                  Paid
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {isLoading ? (
            <div className="space-y-4 p-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : duesPayments?.length === 0 ? (
            <div className="text-center py-12 px-4">
              <h3 className="text-lg font-medium mb-2">No dues payments found</h3>
              <p className="text-muted-foreground mb-4">
                {filterStatus === 'all' 
                  ? 'Start by creating dues payments for members.' 
                  : `No ${filterStatus} dues payments found.`}
              </p>
              <Link href={`/${chapterSlug}/admin/finance/dues/new`}>
                <Button>Create Dues Payment</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {duesPayments?.map((payment: DuesPayment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={payment.user.image || undefined} alt={payment.user.name || 'User'} />
                            <AvatarFallback>{getInitials(payment.user.name || 'U')}</AvatarFallback>
                          </Avatar>
                          <span>{payment.user.name || payment.user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>{new Date(payment.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={payment.paidAt 
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                        }>
                          {payment.paidAt ? 'PAID' : 'PENDING'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!payment.paidAt && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Process Payment"
                              className="text-green-600"
                              onClick={() => {
                                setSelectedDuesId(payment.id);
                                setPaymentUrl(null);
                                setPayDialogOpen(true);
                              }}
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                          )}
                          <Link href={`/${chapterSlug}/admin/finance/dues/${payment.id}`}>
                            <Button variant="ghost" size="icon" title="View Details">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Delete Payment"
                            onClick={() => {
                              setSelectedDuesId(payment.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Dues Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this dues payment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              {!paymentUrl ? (
                "Process this dues payment using Stripe's secure payment system."
              ) : (
                "Payment session created successfully. Click the button below to proceed to the payment page."
              )}
            </DialogDescription>
          </DialogHeader>
          
          {!paymentUrl ? (
            <DialogFooter>
              <Button variant="outline" onClick={() => setPayDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="default" 
                onClick={handlePayment}
                disabled={paymentProcessing}
              >
                {paymentProcessing ? 'Creating payment...' : 'Continue to Payment'}
              </Button>
            </DialogFooter>
          ) : (
            <DialogFooter>
              <Button variant="outline" onClick={() => setPayDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="default" 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  window.open(paymentUrl, '_blank');
                  setPayDialogOpen(false);
                }}
              >
                Go to Payment Page
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
