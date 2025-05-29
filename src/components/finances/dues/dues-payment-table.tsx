'use client';

import { useState } from 'react';
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
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatCurrency, formatDate } from '@/lib/utils';
import { MoreHorizontal, CheckCircle, XCircle, CreditCard, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useParams } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';

// Define the types based on our schema
interface DuesPayment {
  id: string;
  amount: number;
  dueDate: Date;
  paidAt: Date | null;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'WAIVED';
  stripePaymentId: string | null;
  stripeInvoiceId: string | null;
  stripeCheckoutUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  notes: string | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  duesPlan: {
    id: string;
    name: string;
  } | null;
}

interface DuesPaymentTableProps {
  payments: DuesPayment[];
  hasPaymentEnabled: boolean;
}

export function DuesPaymentTable({ payments, hasPaymentEnabled }: DuesPaymentTableProps) {
  const params = useParams();
  const chapterSlug = params.chapterSlug as string;
  const queryClient = useQueryClient();
  const [selectedPayment, setSelectedPayment] = useState<DuesPayment | null>(null);
  const [markPaidDialogOpen, setMarkPaidDialogOpen] = useState(false);
  const [markWaivedDialogOpen, setMarkWaivedDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sendReminderDialogOpen, setSendReminderDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');

  // Update dues payment status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ paymentId, status, notes }: { paymentId: string; status: string; notes?: string }) => {
      const response = await fetch(`/api/chapters/${chapterSlug}/finance/dues/payments/${paymentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, notes }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to mark payment as ${status.toLowerCase()}`);
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast.success(`Payment marked as ${variables.status.toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: ['duesPayments'] });
      setMarkPaidDialogOpen(false);
      setMarkWaivedDialogOpen(false);
      setSelectedPayment(null);
      setNotes('');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete dues payment mutation
  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const response = await fetch(`/api/chapters/${chapterSlug}/finance/dues/payments/${paymentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete payment');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast.success('Payment deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['duesPayments'] });
      setDeleteDialogOpen(false);
      setSelectedPayment(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Send reminder mutation
  const sendReminderMutation = useMutation({
    mutationFn: async ({ paymentId, notes }: { paymentId: string; notes?: string }) => {
      const response = await fetch(`/api/chapters/${chapterSlug}/finance/dues/payments/${paymentId}/reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send reminder');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast.success('Reminder sent successfully');
      setSendReminderDialogOpen(false);
      setSelectedPayment(null);
      setNotes('');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Create payment link mutation
  const createPaymentLinkMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const response = await fetch(`/api/chapters/${chapterSlug}/finance/dues/payments/${paymentId}/checkout`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create payment link');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Payment link created');
      queryClient.invalidateQueries({ queryKey: ['duesPayments'] });
      
      // Copy link to clipboard
      navigator.clipboard.writeText(data.checkoutUrl)
        .then(() => toast.success('Payment link copied to clipboard'))
        .catch(() => toast.error('Failed to copy link to clipboard'));
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const getStatusBadgeVariant = (status: DuesPayment['status']) => {
    const variants = {
      'PAID': 'secondary',
      'PENDING': 'default',
      'OVERDUE': 'destructive',
      'WAIVED': 'outline'
    } as const;
    
    return variants[status] || 'default';
  };

  const handleMarkPaid = (payment: DuesPayment) => {
    setSelectedPayment(payment);
    setMarkPaidDialogOpen(true);
  };

  const handleMarkWaived = (payment: DuesPayment) => {
    setSelectedPayment(payment);
    setMarkWaivedDialogOpen(true);
  };

  const handleDelete = (payment: DuesPayment) => {
    setSelectedPayment(payment);
    setDeleteDialogOpen(true);
  };

  const handleSendReminder = (payment: DuesPayment) => {
    setSelectedPayment(payment);
    setSendReminderDialogOpen(true);
  };
  
  const handleCreatePaymentLink = (payment: DuesPayment) => {
    if (payment.id) {
      createPaymentLinkMutation.mutate(payment.id);
    }
  };

  const confirmMarkPaid = () => {
    if (selectedPayment) {
      updateStatusMutation.mutate({ 
        paymentId: selectedPayment.id, 
        status: 'PAID',
        notes: notes || undefined 
      });
    }
  };

  const confirmMarkWaived = () => {
    if (selectedPayment) {
      updateStatusMutation.mutate({ 
        paymentId: selectedPayment.id, 
        status: 'WAIVED',
        notes: notes || undefined
      });
    }
  };

  const confirmDelete = () => {
    if (selectedPayment) {
      deletePaymentMutation.mutate(selectedPayment.id);
    }
  };

  const confirmSendReminder = () => {
    if (selectedPayment) {
      sendReminderMutation.mutate({ 
        paymentId: selectedPayment.id,
        notes: notes || undefined
      });
    }
  };

  const isOverdue = (dueDate: Date) => {
    return new Date(dueDate) < new Date() ? 'Yes' : 'No';
  };

  return (
    <div className="rounded-md border">
      {payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <h3 className="text-lg font-medium">No dues payments found</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Use the &quot;Assign Dues to Members&quot; button to create dues payments for your members.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Dues Plan</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment Date</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{payment.user.name}</div>
                    <div className="text-xs text-muted-foreground">{payment.user.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {payment.duesPlan?.name || 'Manual'}
                </TableCell>
                <TableCell>{formatCurrency(payment.amount)}</TableCell>
                <TableCell>
                  <div>
                    {formatDate(payment.dueDate)}
                    {payment.status === 'PENDING' && isOverdue(payment.dueDate) === 'Yes' && (
                      <Badge variant="destructive" className="ml-2">Overdue</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(payment.status)}>
                    {payment.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {payment.paidAt ? formatDate(payment.paidAt) : '-'}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {payment.status === 'PENDING' && (
                        <>
                          <DropdownMenuItem onClick={() => handleMarkPaid(payment)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Paid
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleMarkWaived(payment)}>
                            <XCircle className="h-4 w-4 mr-2" />
                            Mark as Waived
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSendReminder(payment)}>
                            <Clock className="h-4 w-4 mr-2" />
                            Send Reminder
                          </DropdownMenuItem>
                          {hasPaymentEnabled && (
                            <DropdownMenuItem onClick={() => handleCreatePaymentLink(payment)}>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Create Payment Link
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                      <DropdownMenuItem 
                        onClick={() => handleDelete(payment)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Mark as Paid Dialog */}
      <Dialog open={markPaidDialogOpen} onOpenChange={setMarkPaidDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Dues as Paid</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to mark these dues as paid for
              <span className="font-semibold"> {selectedPayment?.user.name}</span>?
            </p>
            <p className="mt-2 text-muted-foreground text-sm">
              This will update the payment status to PAID and set today as the payment date.
            </p>
            <div className="mt-4">
              <label className="text-sm font-medium" htmlFor="notes">
                Notes (Optional)
              </label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add payment details or reference"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMarkPaidDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmMarkPaid}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? 'Saving...' : 'Mark as Paid'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Waived Dialog */}
      <Dialog open={markWaivedDialogOpen} onOpenChange={setMarkWaivedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Waive Dues Payment</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to waive these dues for
              <span className="font-semibold"> {selectedPayment?.user.name}</span>?
            </p>
            <p className="mt-2 text-muted-foreground text-sm">
              This will mark the payment as WAIVED, and the member will not need to pay.
            </p>
            <div className="mt-4">
              <label className="text-sm font-medium" htmlFor="waive-notes">
                Reason for Waiving (Optional)
              </label>
              <Textarea
                id="waive-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Explain why these dues are being waived"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMarkWaivedDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmMarkWaived}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? 'Saving...' : 'Waive Dues'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Reminder Dialog */}
      <Dialog open={sendReminderDialogOpen} onOpenChange={setSendReminderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Payment Reminder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Send a payment reminder to
              <span className="font-semibold"> {selectedPayment?.user.name}</span> for
              <span className="font-semibold"> {formatCurrency(selectedPayment?.amount || 0)}</span> dues.
            </p>
            <div className="mt-4">
              <label className="text-sm font-medium" htmlFor="reminder-notes">
                Additional Message (Optional)
              </label>
              <Textarea
                id="reminder-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional message to include in the reminder"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSendReminderDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmSendReminder}
              disabled={sendReminderMutation.isPending}
            >
              {sendReminderMutation.isPending ? 'Sending...' : 'Send Reminder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Payment Alert Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Dues Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this dues payment for
              <span className="font-semibold"> {selectedPayment?.user.name}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deletePaymentMutation.isPending}
            >
              {deletePaymentMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
