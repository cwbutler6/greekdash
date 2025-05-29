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
  DialogTitle
} from '@/components/ui/dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils';
import { MoreHorizontal, Edit2, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

// Importing components from local files
import { EditDuesPlanDialog } from './edit-dues-plan-dialog';
import { AssignDuesDialog } from './assign-dues-dialog';

// Define the DuesPlan type based on our schema
interface DuesPlan {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  frequency: 'ONE_TIME' | 'MONTHLY' | 'QUARTERLY' | 'SEMESTER' | 'ANNUAL';
  isActive: boolean;
  applyToNewMembers: boolean;
  createdAt: Date;
  updatedAt: Date;
  chapterId: string;
}

interface DuesPlansTableProps {
  plans: DuesPlan[];
}

export function DuesPlansTable({ plans }: DuesPlansTableProps) {
  const [selectedPlan, setSelectedPlan] = useState<DuesPlan | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  
  const queryClient = useQueryClient();

  // Delete dues plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await fetch(`/api/chapters/finance/dues/plans/${planId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete dues plan');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast.success('Dues plan deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['duesPlans'] });
      setDeleteDialogOpen(false);
      setSelectedPlan(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Format frequency for display
  const formatFrequency = (frequency: DuesPlan['frequency']) => {
    const mapping = {
      'ONE_TIME': 'One Time',
      'MONTHLY': 'Monthly',
      'QUARTERLY': 'Quarterly',
      'SEMESTER': 'Per Semester',
      'ANNUAL': 'Annual'
    };
    
    return mapping[frequency] || frequency;
  };

  const handleDelete = (plan: DuesPlan) => {
    setSelectedPlan(plan);
    setDeleteDialogOpen(true);
  };

  const handleEdit = (plan: DuesPlan) => {
    setSelectedPlan(plan);
    setEditDialogOpen(true);
  };

  const handleAssign = (plan: DuesPlan) => {
    setSelectedPlan(plan);
    setAssignDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedPlan) {
      deletePlanMutation.mutate(selectedPlan.id);
    }
  };

  return (
    <div className="rounded-md border">
      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <h3 className="text-lg font-medium">No dues plans found</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Create your first dues plan to start collecting dues from members.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Apply to New Members</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{plan.name}</div>
                    {plan.description && (
                      <div className="text-xs text-muted-foreground">{plan.description}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(plan.amount)}</TableCell>
                <TableCell>{formatFrequency(plan.frequency)}</TableCell>
                <TableCell>
                  <Badge variant={plan.isActive ? "default" : "secondary"}>
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {plan.applyToNewMembers ? 'Yes' : 'No'}
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
                      <DropdownMenuItem onClick={() => handleEdit(plan)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit Plan
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAssign(plan)}>
                        <Users className="h-4 w-4 mr-2" />
                        Assign to Members
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(plan)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Plan
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Edit Dialog */}
      {selectedPlan && (
        <EditDuesPlanDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          plan={selectedPlan}
        />
      )}

      {/* Assign Dialog */}
      {selectedPlan && (
        <AssignDuesDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          duesPlans={[selectedPlan]}
        >
          {/* Empty children prop to satisfy type requirements */}
          <span className="hidden" />
        </AssignDuesDialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Dues Plan</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to delete the dues plan
              <span className="font-semibold"> {selectedPlan?.name}</span>?
              This action cannot be undone.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Note: This won&apos;t delete any existing dues payments associated with this plan.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deletePlanMutation.isPending}
            >
              {deletePlanMutation.isPending ? 'Deleting...' : 'Delete Plan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
