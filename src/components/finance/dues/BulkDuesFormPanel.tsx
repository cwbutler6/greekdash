'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Form schema
const bulkDuesSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  dueDate: z.date({
    required_error: 'Due date is required',
  }),
  memberIds: z.array(z.string()).nonempty('Select at least one member'),
});

type FormValues = z.infer<typeof bulkDuesSchema>;

interface BulkDuesFormPanelProps {
  chapterSlug: string;
}

export function BulkDuesFormPanel({ chapterSlug }: BulkDuesFormPanelProps) {
  // Define member interface
  interface ChapterMember {
    userId: string;
    user: {
      name: string;
      email: string;
      image?: string;
    };
    role?: string;
    // Add other member properties as needed
  }

  // Fetch chapter members
  const { data: members, isLoading: loadingMembers } = useQuery<ChapterMember[]>({
    queryKey: ['chapter-members', chapterSlug],
    queryFn: async () => {
      const res = await fetch(`/api/chapters/${chapterSlug}/members`);
      if (!res.ok) {
        throw new Error('Failed to fetch chapter members');
      }
      return res.json();
    },
  });

  // Initialize form with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(bulkDuesSchema),
    defaultValues: {
      amount: 0,
      memberIds: [] as unknown as [string, ...string[]], // Type cast for initialization
    },
  });

  // Create bulk dues mutation
  const createBulkDues = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await fetch('/api/finance/dues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          memberIds: data.memberIds,
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create dues payments');
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast.success('Dues payments created successfully');
      form.reset();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // Handle form submission
  const onSubmit = (data: FormValues) => {
    createBulkDues.mutate(data);
  };

  // Toggle selection of all members
  const toggleSelectAll = () => {
    const allMemberIds = members?.map((member: ChapterMember) => member.userId) || [];
    const currentlySelected = form.getValues('memberIds');
    
    if (currentlySelected.length === allMemberIds.length) {
      // Deselect all - using a string to prevent validation on intermediate state
      // We'll let the form validation handle the error when the form is submitted
      form.setValue('memberIds', [] as unknown as [string, ...string[]], { shouldValidate: false });
    } else {
      // Select all
      if (allMemberIds.length > 0) {
        // When we have members, we can safely cast because we know it's non-empty
        form.setValue('memberIds', allMemberIds as [string, ...string[]], { shouldValidate: true });
      } else {
        // Empty placeholder - using a type assertion
        form.setValue('memberIds', [] as unknown as [string, ...string[]], { shouldValidate: false });
      }
    }
  };

  // Helper to get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n: string) => n?.[0] || '')
      .join('')
      .toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Bulk Dues Payments</CardTitle>
        <CardDescription>
          Create dues payments for multiple members at once
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0.00"
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                      />
                    </FormControl>
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
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <FormLabel className="text-base">Select Members</FormLabel>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={toggleSelectAll}
                >
                  <p className="text-muted-foreground">Selected: {form.getValues('memberIds').length} / {members?.length || 0}</p>
                  {form.getValues('memberIds').length === (members?.length || 0)
                    ? 'Deselect All'
                    : 'Select All'
                  }
                </Button>
              </div>
              
              <FormField
                control={form.control}
                name="memberIds"
                render={() => (
                  <FormItem>
                    <div className="max-h-[300px] overflow-y-auto border rounded-md p-2">
                      {loadingMembers ? (
                        <div className="flex justify-center items-center h-[200px]">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : members && members.length > 0 ? (
                        <div className="space-y-2">
                          {members?.map((member) => (
                            <FormField
                              key={member.userId}
                              control={form.control}
                              name="memberIds"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={member.userId}
                                    className="flex flex-row items-start space-x-3 space-y-0 p-2 hover:bg-accent rounded-md"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(member.userId)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, member.userId])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== member.userId
                                                )
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <div className="flex items-center space-x-2">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={member.user.image} alt={member.user.name || 'User'} />
                                        <AvatarFallback>{getInitials(member.user.name || 'U')}</AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <div className="font-medium">{member.user.name}</div>
                                        <div className="text-sm text-muted-foreground">{member.user.email}</div>
                                      </div>
                                    </div>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="flex justify-center items-center h-[200px] text-muted-foreground">
                          No members found
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={createBulkDues.isPending}
            >
              {createBulkDues.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Dues Payments'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
