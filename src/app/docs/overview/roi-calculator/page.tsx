import { Metadata } from 'next';
import { ROICalculator } from '@/components/docs/roi-calculator';

export const metadata: Metadata = {
  title: 'ROI Calculator | GreekDash Documentation',
  description: 'Calculate your potential return on investment with GreekDash chapter management platform.',
};

export default function ROICalculatorPage() {
  return <ROICalculator />;
}