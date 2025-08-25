import { Metadata } from 'next';
import { DocsContentPage } from '@/components/docs/docs-content-page';

export const metadata: Metadata = {
  title: 'Member Management Troubleshooting | GreekDash Documentation',
  description: 'Solutions to common member management issues and problems',
  keywords: ['troubleshooting', 'member issues', 'support', 'solutions', 'chapter management'],
};

export default function MemberTroubleshootingPage() {
  return (
    <DocsContentPage
      title="Member Management Troubleshooting"
      description="Solutions to common member management issues and problems"
      section="admin-guide"
      subsection="members"
    />
  );
}