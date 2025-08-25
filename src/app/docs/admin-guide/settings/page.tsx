import { Metadata } from 'next';
import { DocsContentPage } from '@/components/docs/docs-content-page';

export const metadata: Metadata = {
  title: 'Chapter Settings | GreekDash Documentation',
  description: 'Learn how to configure your chapter settings and preferences',
};

export default function SettingsPage() {
  return (
    <DocsContentPage
      title="Chapter Settings"
      description="Learn how to configure your chapter settings and preferences"
      section="admin-guide"
      subsection="settings"
    />
  );
}