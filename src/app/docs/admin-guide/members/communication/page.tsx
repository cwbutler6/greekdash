import { Metadata } from 'next';
import { DocsContentPage } from '@/components/docs/docs-content-page';

export const metadata: Metadata = {
  title: 'Member Communication & Broadcasts | GreekDash Documentation',
  description: 'Complete guide to communicating with chapter members through broadcasts, messages, and notifications',
  keywords: ['member communication', 'broadcasts', 'messaging', 'notifications', 'chapter management'],
};

export default function MemberCommunicationPage() {
  return (
    <DocsContentPage
      title="Member Communication & Broadcasts"
      description="Complete guide to communicating with chapter members through broadcasts, messages, and notifications"
      section="admin-guide"
      subsection="members"
    />
  );
}