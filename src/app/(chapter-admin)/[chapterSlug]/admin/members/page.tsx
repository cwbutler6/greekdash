import { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MembersClient from './members-client';
import BulkMemberOperationsClient from './bulk-operations-client';

interface MembersPageProps {
  params: Promise<{ chapterSlug: string }>;
}

export default async function MembersPage({ params }: MembersPageProps) {
  const { chapterSlug } = await params;

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Member Management</h1>
        <p className="text-muted-foreground">
          Manage your chapter members, roles, and perform bulk operations
        </p>
      </div>

      <Tabs defaultValue="members" className="space-y-6">
        <TabsList>
          <TabsTrigger value="members">Members List</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="members">
          <Suspense fallback={<div>Loading members...</div>}>
            <MembersClient chapterSlug={chapterSlug} />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="bulk">
          <Suspense fallback={<div>Loading bulk operations...</div>}>
            <BulkMemberOperationsClient chapterSlug={chapterSlug} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
