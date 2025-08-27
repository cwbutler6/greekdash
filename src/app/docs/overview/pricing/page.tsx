import { Metadata } from 'next';
import { PricingPlans } from '@/components/docs/pricing-plans';

export const metadata: Metadata = {
  title: 'Pricing Plans | GreekDash Documentation',
  description: 'Detailed pricing plans with feature breakdowns and value propositions for chapter management.',
};

export default function PricingPage() {
  return <PricingPlans />;
}