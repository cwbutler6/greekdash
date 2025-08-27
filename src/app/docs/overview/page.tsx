import { Metadata } from 'next';
import { PlatformOverview } from '@/components/docs/platform-overview';

export const metadata: Metadata = {
  title: 'Platform Overview | GreekDash Documentation',
  description: 'Comprehensive overview of GreekDash capabilities, features, and pricing plans for chapter management.',
};

export default function OverviewPage() {
  return <PlatformOverview />;
}