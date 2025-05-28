'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from '@/components/ui/form';
import { MembersList } from './members-list';
import { Skeleton } from '@/components/ui/skeleton';

// Define the form schema
const searchFormSchema = z.object({
  query: z.string().optional(),
});

type SearchFormValues = z.infer<typeof searchFormSchema>;

interface MemberSearchProps {
  chapterSlug: string;
}

export function MemberSearch({ chapterSlug }: MemberSearchProps) {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Setup form
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      query: '',
    },
  });

  // Handle search submission
  const onSubmit = (data: SearchFormValues) => {
    // Normalize empty searches - if the query is empty or just whitespace, set it to empty string
    const normalizedQuery = data.query?.trim() || '';
    setSearchQuery(normalizedQuery);
    setPage(1); // Reset to first page on new search
  };

  // Fetch members using React Query
  const { data, isLoading, error } = useQuery({
    queryKey: ['members', chapterSlug, searchQuery, page],
    queryFn: async () => {
      const response = await axios.post('/api/members/search', {
        chapterSlug,
        query: searchQuery,
        page,
        limit: 10,
      });
      return response.data;
    },
  });

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full space-x-2">
          <FormField
            control={form.control}
            name="query"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search members by name, email, phone, or major..."
                      className="w-full pl-9"
                      {...field}
                    />
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
          <Button type="submit">Search</Button>
        </form>
      </Form>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : error ? (
        <div className="rounded-md bg-destructive/15 p-4">
          <p className="text-sm text-destructive">Error loading members. Please try again.</p>
        </div>
      ) : (
        <MembersList 
          members={data?.members || []} 
          pagination={data?.pagination}
          onPageChange={handlePageChange}
          chapterSlug={chapterSlug}
        />
      )}
    </div>
  );
}
