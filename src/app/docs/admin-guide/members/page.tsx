import { Metadata } from 'next';
import { DocsContentPage } from '@/components/docs/docs-content-page';

export const metadata: Metadata = {
  title: 'Member Management | GreekDash Documentation',
  description: 'Learn how to manage chapter members, invitations, and roles',
};

export default function MembersPage() {
  return (
    <DocsContentPage
      title="Member Management"
      description="Learn how to manage chapter members, invitations, and roles"
      section="admin-guide"
      subsection="members"
    />
  );
}