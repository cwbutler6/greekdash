import { Metadata } from 'next';
import { DocsContentPage } from '@/components/docs/docs-content-page';

export const metadata: Metadata = {
  title: 'Financial Management | GreekDash Documentation',
  description: 'Learn how to manage dues, expenses, and financial reporting',
};

export default function FinancePage() {
  return (
    <DocsContentPage
      title="Financial Management"
      description="Learn how to manage dues, expenses, and financial reporting"
      section="admin-guide"
      subsection="finance"
    />
  );
}