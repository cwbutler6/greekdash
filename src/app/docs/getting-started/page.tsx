import { Metadata } from 'next';
import { DocsContentPage } from '@/components/docs/docs-content-page';

export const metadata: Metadata = {
  title: 'Getting Started | GreekDash Documentation',
  description: 'Quick start guide for new GreekDash administrators',
};

export default function GettingStartedPage() {
  return (
    <DocsContentPage
      title="Getting Started"
      description="Quick start guide for new GreekDash administrators"
      section="getting-started"
    />
  );
}