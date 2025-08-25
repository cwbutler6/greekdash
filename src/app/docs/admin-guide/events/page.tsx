import { Metadata } from 'next';
import { DocsContentPage } from '@/components/docs/docs-content-page';

export const metadata: Metadata = {
  title: 'Event Management | GreekDash Documentation',
  description: 'Learn how to create and manage chapter events',
};

export default function EventsPage() {
  return (
    <DocsContentPage
      title="Event Management"
      description="Learn how to create and manage chapter events"
      section="admin-guide"
      subsection="events"
    />
  );
}