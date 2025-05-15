'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Pencil, Trash2, Eye, Filter, CheckCircle, XCircle } from 'lucide-react';
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
import { ExpenseStatus } from '@/generated/prisma';

interface Expense {
  id: string;
  title: string;
  description?: string;
  amount: number;
  receiptUrl?: string;
  status: ExpenseStatus;
  submittedAt: Date;
  approvedAt?: Date;
  paidAt?: Date;
  budget?: {
    id: string;
    name: string;
  } | null;
  submittedBy: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  approvedBy?: {
    id: string;
    name?: string | null;
    image?: string | null;
  } | null;
}
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

interface ExpensesListProps {
  chapterSlug: string;
}

const statusColors: Record<ExpenseStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
  APPROVED: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100',
  DENIED: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
  PAID: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
};

export function ExpensesList({ chapterSlug }: ExpensesListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [denyDialogOpen, setDenyDialogOpen] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | 'ALL'>('ALL');

  // Fetch expenses data
  const { data: expenses, isLoading, error, refetch } = useQuery({
    queryKey: ['expenses', chapterSlug, statusFilter],
    queryFn: async () => {
      const url = statusFilter === 'ALL' 
        ? `/api/chapters/${chapterSlug}/finance/expenses` 
        : `/api/chapters/${chapterSlug}/finance/expenses?status=${statusFilter}`;
      
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to fetch expenses');
      }
      return res.json();
    },
  });

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const res = await fetch(`/api/chapters/${chapterSlug}/finance/expenses/${expenseId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete expense');
      }
      return res.json();
    },
  });

  // Handle expense deletion
  const handleDelete = async () => {
    if (!selectedExpenseId) return;
    
    try {
      await deleteExpenseMutation.mutateAsync(selectedExpenseId);
      toast.success('Expense deleted successfully');
      refetch();
    } catch (error) {
      toast.error('Error deleting expense');
      console.error(error);
    } finally {
      setDeleteDialogOpen(false);
      setSelectedExpenseId(null);
    }
  };

  // Approve expense mutation
  const approveExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const res = await fetch(`/api/chapters/${chapterSlug}/finance/expenses/${expenseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      if (!res.ok) {
        throw new Error('Failed to approve expense');
      }
      return res.json();
    },
  });

  // Handle expense approval
  const handleApprove = async () => {
    if (!selectedExpenseId) return;
    
    try {
      await approveExpenseMutation.mutateAsync(selectedExpenseId);
      toast.success('Expense approved successfully');
      refetch();
    } catch (error) {
      toast.error('Error approving expense');
      console.error(error);
    } finally {
      setApproveDialogOpen(false);
      setSelectedExpenseId(null);
    }
  };

  // Reject expense mutation
  const rejectExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const res = await fetch(`/api/chapters/${chapterSlug}/finance/expenses/${expenseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DENIED' }),
      });
      if (!res.ok) {
        throw new Error('Failed to reject expense');
      }
      return res.json();
    },
  });

  // Handle expense denial
  const handleDeny = async () => {
    if (!selectedExpenseId) return;
    
    try {
      await rejectExpenseMutation.mutateAsync(selectedExpenseId);
      toast.success('Expense denied');
      refetch();
    } catch (error) {
      toast.error('Error updating expense');
      console.error(error);
    } finally {
      setDenyDialogOpen(false);
      setSelectedExpenseId(null);
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
            <p>Failed to load expenses. Please try again later.</p>
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
            <h3 className="text-lg font-medium">Expense Requests</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  {statusFilter === 'ALL' ? 'All Statuses' : statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter('ALL')}>
                  All Statuses
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('PENDING')}>
                  Pending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('APPROVED')}>
                  Approved
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('PAID')}>
                  Paid
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('DENIED')}>
                  Denied
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
          ) : expenses?.length === 0 ? (
            <div className="text-center py-12 px-4">
              <h3 className="text-lg font-medium mb-2">No expenses found</h3>
              <p className="text-muted-foreground mb-4">
                {statusFilter === 'ALL' 
                  ? 'Start by submitting your first expense request.' 
                  : `No expenses with ${statusFilter} status found.`}
              </p>
              <Link href={`/${chapterSlug}/admin/finance/expenses/new`}>
                <Button>Submit Expense</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses?.map((expense: Expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={expense.submittedBy.image || undefined} alt={expense.submittedBy.name || 'User'} />
                            <AvatarFallback>{getInitials(expense.submittedBy.name || 'U')}</AvatarFallback>
                          </Avatar>
                          <span>{expense.submittedBy.name || expense.submittedBy.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(expense.amount)}</TableCell>
                      <TableCell>{expense.budget?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[expense.status]}>
                          {expense.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {expense.status === 'PENDING' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                title="Approve Expense"
                                className="text-green-600"
                                onClick={() => {
                                  setSelectedExpenseId(expense.id);
                                  setApproveDialogOpen(true);
                                }}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                title="Deny Expense"
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedExpenseId(expense.id);
                                  setDenyDialogOpen(true);
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Link href={`/${chapterSlug}/admin/finance/expenses/${expense.id}`}>
                            <Button variant="ghost" size="icon" title="View Details">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/${chapterSlug}/admin/finance/expenses/${expense.id}/edit`}>
                            <Button variant="ghost" size="icon" title="Edit Expense">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Delete Expense"
                            onClick={() => {
                              setSelectedExpenseId(expense.id);
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
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
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

      {/* Approve Confirmation Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this expense?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={handleApprove}>
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deny Confirmation Dialog */}
      <Dialog open={denyDialogOpen} onOpenChange={setDenyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deny Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to deny this expense?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDenyDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeny}>
              Deny
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
