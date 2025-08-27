import { Metadata } from 'next';
import { FeatureMatrix } from '@/components/docs/feature-matrix';

export const metadata: Metadata = {
  title: 'Feature Comparison | GreekDash Documentation',
  description: 'Comprehensive feature comparison matrix across all GreekDash plans with detailed capabilities breakdown.',
};

export default function FeaturesPage() {
  return <FeatureMatrix />;
}