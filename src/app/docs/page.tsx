import { Metadata } from 'next';
import { DocsHomePage } from '@/components/docs/docs-home-page';

export const metadata: Metadata = {
  title: 'Documentation Home | GreekDash',
  description: 'Welcome to GreekDash documentation - your guide to effective chapter management',
};

export default function DocsPage() {
  return <DocsHomePage />;
}