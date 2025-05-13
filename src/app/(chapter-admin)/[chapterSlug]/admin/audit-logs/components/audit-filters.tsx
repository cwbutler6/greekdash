'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
// Audit types are used in data structures but not directly referenced
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface AuditFiltersProps {
  chapterSlug: string;
}

const filterSchema = z.object({
  action: z.string().optional(),
  targetType: z.string().optional(),
  userId: z.string().optional(),
  fromDate: z.date().optional(),
  toDate: z.date().optional(),
});

type FilterValues = z.infer<typeof filterSchema>;

const auditActionOptions = [
  { label: 'Login', value: 'user.login' },
  { label: 'Logout', value: 'user.logout' },
  { label: 'Password Changed', value: 'user.password_changed' },
  { label: 'Profile Updated', value: 'user.profile_updated' },
  { label: 'Member Invited', value: 'member.invited' },
  { label: 'Invitation Accepted', value: 'member.invitation_accepted' },
  { label: 'Role Changed', value: 'member.role_changed' },
  { label: 'Member Removed', value: 'member.removed' },
  { label: 'Chapter Settings Updated', value: 'chapter.settings_updated' },
  { label: 'Subscription Changed', value: 'chapter.subscription_changed' },
  { label: 'Event Created', value: 'event.created' },
  { label: 'Event Updated', value: 'event.updated' },
  { label: 'Event Deleted', value: 'event.deleted' },
  { label: 'RSVP Created', value: 'event.rsvp_created' },
  { label: 'RSVP Updated', value: 'event.rsvp_updated' },
];

const targetTypeOptions = [
  { label: 'User', value: 'user' },
  { label: 'Chapter', value: 'chapter' },
  { label: 'Membership', value: 'membership' },
  { label: 'Event', value: 'event' },
  { label: 'RSVP', value: 'rsvp' },
  { label: 'Invite', value: 'invite' },
  { label: 'Subscription', value: 'subscription' },
];

export function AuditFilters({ chapterSlug }: AuditFiltersProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  
  const form = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      action: '',
      targetType: '',
      userId: '',
      fromDate: undefined,
      toDate: undefined,
    },
  });
  
  function onSubmit(values: FilterValues) {
    const queryParams = new URLSearchParams();
    
    if (values.action) queryParams.set('action', values.action);
    if (values.targetType) queryParams.set('targetType', values.targetType);
    if (values.userId) queryParams.set('userId', values.userId);
    if (values.fromDate) queryParams.set('from', values.fromDate.toISOString());
    if (values.toDate) queryParams.set('to', values.toDate.toISOString());
    
    const query = queryParams.toString();
    router.push(`/${chapterSlug}/admin/audit-logs${query ? `?${query}` : ''}`);
    
    setIsOpen(false);
  }
  
  function clearFilters() {
    form.reset({
      action: '',
      targetType: '',
      userId: '',
      fromDate: undefined,
      toDate: undefined,
    });
    
    router.push(`/${chapterSlug}/admin/audit-logs`);
    setIsOpen(false);
  }
  
  return (
    <div className="flex items-center justify-between">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline">Filter Logs</Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="action"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="All actions" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">All actions</SelectItem>
                        {auditActionOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="targetType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="All target types" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">All target types</SelectItem>
                        {targetTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Filter by user ID" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fromDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>From Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
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
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="toDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>To Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
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
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-between">
                <Button type="button" variant="ghost" onClick={clearFilters}>
                  Clear Filters
                </Button>
                <Button type="submit">Apply Filters</Button>
              </div>
            </form>
          </Form>
        </PopoverContent>
      </Popover>
    </div>
  );
}
