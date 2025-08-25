import { Metadata } from 'next';
import { DocsLayout } from '@/components/docs/docs-layout';

export const metadata: Metadata = {
  title: 'Documentation | GreekDash',
  description: 'Comprehensive documentation for GreekDash chapter administrators',
  openGraph: {
    title: 'GreekDash Documentation',
    description: 'Learn how to manage your chapter with GreekDash',
    type: 'website',
  },
};

interface DocsLayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: DocsLayoutProps) {
  return <DocsLayout>{children}</DocsLayout>;
}