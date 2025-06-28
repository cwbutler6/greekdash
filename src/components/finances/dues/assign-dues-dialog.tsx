'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types from our schema
interface DuesPlan {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  frequency: string;
  isActive: boolean;
}

interface Member {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Form schema validation
const assignDuesSchema = z.object({
  duesPlanId: z.string().min(1, 'Dues plan is required'),
  assignmentType: z.enum(['individual', 'role', 'all']),
  memberIds: z.array(z.string()).optional(),
  roles: z.array(z.enum(['MEMBER', 'ADMIN', 'OWNER'])).optional(),
  dueDate: z.date(),
  notes: z.string().optional(),
  customAmount: z.coerce.number().optional(),
  useCustomAmount: z.boolean(),
  createRecurring: z.boolean(), // Remove .default(false)
  recurringFrequency: z.enum(['MONTHLY', 'QUARTERLY', 'SEMESTER', 'ANNUAL']).optional(),
}).refine((data) => {
  if (data.assignmentType === 'individual' && (!data.memberIds || data.memberIds.length === 0)) {
    return false;
  }
  if (data.assignmentType === 'role' && (!data.roles || data.roles.length === 0)) {
    return false;
  }
  return true;
}, {
  message: "Please select members or roles based on assignment type",
});

type AssignDuesFormValues = z.infer<typeof assignDuesSchema>;

type AssignDuesDialogProps = {
  children: React.ReactNode;
  duesPlans: DuesPlan[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function AssignDuesDialog({
  children,
  duesPlans,
  open,
  onOpenChange,
}: AssignDuesDialogProps) {
  const params = useParams();
  const chapterSlug = params.chapterSlug as string;
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Control dialog state with props or internal state
  const isOpen = open !== undefined ? open : dialogOpen;
  const setIsOpen = onOpenChange || setDialogOpen;

  // Setup form
  // Setup form
  const form = useForm<AssignDuesFormValues>({
    resolver: zodResolver(assignDuesSchema),
    defaultValues: {
      duesPlanId: '',
      assignmentType: 'individual', // Add this
      memberIds: [],
      roles: [], // Add this
      dueDate: new Date(),
      notes: '',
      customAmount: undefined,
      useCustomAmount: false,
      createRecurring: false,
      recurringFrequency: undefined, // Add this
    },
  });

  // Watch selected plan to show/calculate amount
  const selectedPlanId = form.watch('duesPlanId');
  const useCustomAmount = form.watch('useCustomAmount');
  
  // Find selected plan details
  const selectedPlan = duesPlans.find(plan => plan.id === selectedPlanId);

  // Fetch members for this chapter
  const { data: members = [], isLoading: isLoadingMembers } = useQuery({
    queryKey: ['members', chapterSlug],
    queryFn: async () => {
      const response = await fetch(`/api/chapters/${chapterSlug}/members`);
      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }
      return response.json();
    },
  });

  // Assign dues mutation
  const assignDuesMutation = useMutation({
    mutationFn: async (values: AssignDuesFormValues) => {
      const response = await fetch(`/api/chapters/${chapterSlug}/finance/dues/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to assign dues');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast.success('Dues assigned successfully to selected members');
      queryClient.invalidateQueries({ queryKey: ['duesPayments'] });
      setIsOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  function onSubmit(data: AssignDuesFormValues) {
    assignDuesMutation.mutate(data);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Dues to Members</DialogTitle>
          <DialogDescription>
            Assign a dues plan to one or more members with a specific due date.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="duesPlanId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dues Plan</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a dues plan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Active Plans</SelectLabel>
                        {duesPlans
                          .filter(plan => plan.isActive)
                          .map((plan) => (
                            <SelectItem key={plan.id} value={plan.id}>
                              {plan.name} (${plan.amount.toFixed(2)})
                            </SelectItem>
                          ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="memberIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign To</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      if (value === 'all') {
                        // Select all members
                        const allMemberIds = members.map((member: Member) => member.id);
                        field.onChange(allMemberIds);
                      } else {
                        // Select individual member
                        field.onChange([value]);
                      }
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select members">
                          {field.value && field.value.length === 1
                            ? members.find((m: Member) => m.id === field.value?.[0])?.name || 'One member'
                            : field.value && field.value.length > 1
                            ? `${field.value.length} members selected`
                            : 'Select members'}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">All Members</SelectItem>
                      <SelectGroup>
                        <SelectLabel>Individual Members</SelectLabel>
                        {isLoadingMembers ? (
                          <div className="flex items-center justify-center py-2">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Loading members...
                          </div>
                        ) : (
                          members.map((member: Member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="useCustomAmount"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Custom Amount</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Override the amount from the selected dues plan
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {useCustomAmount && (
              <FormField
                control={form.control}
                name="customAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder={
                          selectedPlan ? selectedPlan.amount.toString() : "0.00"
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes about this dues assignment"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="submit"
                disabled={assignDuesMutation.isPending}
              >
                {assignDuesMutation.isPending
                  ? 'Assigning...'
                  : 'Assign Dues'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
