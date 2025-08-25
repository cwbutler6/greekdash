import { Metadata } from 'next';
import { DocsContentPage } from '@/components/docs/docs-content-page';

export const metadata: Metadata = {
  title: 'Security & Compliance | GreekDash Documentation',
  description: 'Learn about security best practices and compliance features',
};

export default function SecurityPage() {
  return (
    <DocsContentPage
      title="Security & Compliance"
      description="Learn about security best practices and compliance features"
      section="security"
    />
  );
}