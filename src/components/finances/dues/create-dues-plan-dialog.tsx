'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

// Form schema validation
const duesPlanSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  amount: z.coerce.number().positive('Amount must be positive'),
  frequency: z.enum(['ONE_TIME', 'MONTHLY', 'QUARTERLY', 'SEMESTER', 'ANNUAL']),
  // Make these required (not optional with defaults) to avoid TypeScript errors
  isActive: z.boolean(),
  applyToNewMembers: z.boolean(),
});

// Define the form values type using zod schema inference
type DuesPlanFormValues = z.infer<typeof duesPlanSchema>;

type CreateDuesPlanDialogProps = {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function CreateDuesPlanDialog({
  children,
  open,
  onOpenChange,
}: CreateDuesPlanDialogProps) {
  const params = useParams();
  const chapterSlug = params.chapterSlug as string;
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Control dialog state with props or internal state
  const isOpen = open !== undefined ? open : dialogOpen;
  const setIsOpen = onOpenChange || setDialogOpen;

  // Setup form with default values
  const form = useForm<DuesPlanFormValues>({
    resolver: zodResolver(duesPlanSchema),
    defaultValues: {
      name: '',
      description: '',
      amount: 0,
      frequency: 'SEMESTER' as const,
      isActive: true,
      applyToNewMembers: true,
    },
  });

  // Define response type for the API
  type DuesPlanResponse = {
    id: string;
    name: string;
    amount: number;
    frequency: "ONE_TIME" | "MONTHLY" | "QUARTERLY" | "SEMESTER" | "ANNUAL";
    isActive: boolean;
    applyToNewMembers: boolean;
    description?: string;
  }

  // Create dues plan mutation
  const createDuesPlanMutation = useMutation<DuesPlanResponse, Error, DuesPlanFormValues>({
    mutationFn: async (values) => {
      const response = await fetch(`/api/chapters/${chapterSlug}/finance/dues/plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create dues plan');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast.success('Dues plan created successfully');
      queryClient.invalidateQueries({ queryKey: ['duesPlans'] });
      setIsOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Type-safe form submission handler
  const onSubmit = form.handleSubmit((values) => {
    // Since the form is validated with Zod schema, the values will match our type
    const formData: DuesPlanFormValues = {
      name: values.name as string,
      amount: values.amount as number,
      frequency: values.frequency as "ONE_TIME" | "MONTHLY" | "QUARTERLY" | "SEMESTER" | "ANNUAL",
      isActive: Boolean(values.isActive),
      applyToNewMembers: Boolean(values.applyToNewMembers),
      description: values.description as string | undefined,
    };
    createDuesPlanMutation.mutate(formData);
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Dues Plan</DialogTitle>
          <DialogDescription>
            Create a new dues plan for your members. This plan can be assigned to
            existing members or automatically applied to new members.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Spring 2025 Dues" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Details about the dues plan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="100.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ONE_TIME">One Time</SelectItem>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                        <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                        <SelectItem value="SEMESTER">Per Semester</SelectItem>
                        <SelectItem value="ANNUAL">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-start space-x-2 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel>Active</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Only active plans can be assigned to members
                    </p>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="applyToNewMembers"
              render={({ field }) => (
                <FormItem className="flex items-start space-x-2 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel>Apply to New Members</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Automatically assign this dues plan to new members when they join
                    </p>
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="submit"
                disabled={createDuesPlanMutation.isPending}
              >
                {createDuesPlanMutation.isPending
                  ? 'Creating...'
                  : 'Create Plan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
