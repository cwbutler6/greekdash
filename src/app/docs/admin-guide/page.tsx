import { Metadata } from 'next';
import { DocsContentPage } from '@/components/docs/docs-content-page';

export const metadata: Metadata = {
  title: 'Admin Guide | GreekDash Documentation',
  description: 'Comprehensive guide for chapter administrators',
};

export default function AdminGuidePage() {
  return (
    <DocsContentPage
      title="Admin Guide"
      description="Comprehensive guide for chapter administrators"
      section="admin-guide"
    />
  );
}