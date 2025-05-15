'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Pencil, Trash2, Eye, Filter } from 'lucide-react';
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
import { BudgetStatus } from '@/generated/prisma';

interface Budget {
  id: string;
  name: string;
  startDate: string | Date;
  endDate: string | Date;
  amount: number;
  status: BudgetStatus;
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

interface BudgetsListProps {
  chapterSlug: string;
}

const statusColors: Record<BudgetStatus, string> = {
  PLANNING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
  COMPLETED: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100',
  ARCHIVED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
};

export function BudgetsList({ chapterSlug }: BudgetsListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BudgetStatus | 'ALL'>('ALL');

  // Fetch budgets data
  const { data: budgets, isLoading, error, refetch } = useQuery({
    queryKey: ['budgets', chapterSlug, statusFilter],
    queryFn: async () => {
      const url = statusFilter === 'ALL' 
        ? `/api/chapters/${chapterSlug}/finance/budgets` 
        : `/api/chapters/${chapterSlug}/finance/budgets?status=${statusFilter}`;
      
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to fetch budgets');
      }
      return res.json();
    },
  });

  // Delete budget mutation
  const deleteBudgetMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      const res = await fetch(`/api/chapters/${chapterSlug}/finance/budgets/${budgetId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete budget');
      }
      return res.json();
    },
  });

  // Handle budget deletion
  const handleDelete = async () => {
    if (!selectedBudgetId) return;
    
    try {
      await deleteBudgetMutation.mutateAsync(selectedBudgetId);
      toast.success('Budget deleted successfully');
      refetch();
    } catch (error) {
      toast.error('Error deleting budget');
      console.error(error);
    } finally {
      setDeleteDialogOpen(false);
      setSelectedBudgetId(null);
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center p-4">
            <AlertCircle className="h-8 w-8 text-destructive mr-2" />
            <p>Failed to load budgets. Please try again later.</p>
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
            <h3 className="text-lg font-medium">Budget Plans</h3>
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
                <DropdownMenuItem onClick={() => setStatusFilter('PLANNING')}>
                  Planning
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('ACTIVE')}>
                  Active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('COMPLETED')}>
                  Completed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('ARCHIVED')}>
                  Archived
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
          ) : budgets?.length === 0 ? (
            <div className="text-center py-12 px-4">
              <h3 className="text-lg font-medium mb-2">No budgets found</h3>
              <p className="text-muted-foreground mb-4">
                {statusFilter === 'ALL' 
                  ? 'Start by creating your first budget plan.' 
                  : `No budgets with ${statusFilter} status found.`}
              </p>
              <Link href={`/${chapterSlug}/admin/finance/budgets/new`}>
                <Button>Create Budget</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgets?.map((budget: Budget) => (
                    <TableRow key={budget.id}>
                      <TableCell className="font-medium">{budget.name}</TableCell>
                      <TableCell>
                        {new Date(budget.startDate).toLocaleDateString()} - {new Date(budget.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{formatCurrency(budget.amount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[budget.status]}>
                          {budget.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/${chapterSlug}/admin/finance/budgets/${budget.id}`}>
                            <Button variant="ghost" size="icon" title="View Details">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/${chapterSlug}/admin/finance/budgets/${budget.id}/edit`}>
                            <Button variant="ghost" size="icon" title="Edit Budget">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Delete Budget"
                            onClick={() => {
                              setSelectedBudgetId(budget.id);
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
            <DialogTitle>Delete Budget</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this budget? This action cannot be undone.
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
    </>
  );
}
