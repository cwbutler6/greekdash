import { Metadata } from 'next';
import { DocsContentPage } from '@/components/docs/docs-content-page';

export const metadata: Metadata = {
  title: 'Features Overview | GreekDash Documentation',
  description: 'Explore all the features available in GreekDash',
};

export default function FeaturesPage() {
  return (
    <DocsContentPage
      title="Features Overview"
      description="Explore all the features available in GreekDash"
      section="features"
    />
  );
}