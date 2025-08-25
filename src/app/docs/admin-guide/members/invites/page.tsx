import { Metadata } from 'next';
import { DocsContentPage } from '@/components/docs/docs-content-page';

export const metadata: Metadata = {
  title: 'Inviting Members | GreekDash Documentation',
  description: 'Learn how to invite new members to your chapter',
};

export default function InvitingMembersPage() {
  return (
    <DocsContentPage
      title="Inviting Members"
      description="Learn how to invite new members to your chapter"
      section="admin-guide"
      subsection="members"
    >
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <h2>Overview</h2>
        <p>
          This page demonstrates the hierarchical navigation structure. You should see:
        </p>
        <ul>
          <li>Breadcrumbs showing: Documentation → Admin Guide → Members → Inviting Members</li>
          <li>The Members section expanded in the sidebar</li>
          <li>The "Inviting Members" item highlighted as active</li>
        </ul>
        
        <h2>Navigation Features</h2>
        <p>The documentation navigation includes:</p>
        <ul>
          <li><strong>Hierarchical sidebar</strong> - Matches the admin interface structure</li>
          <li><strong>Mobile responsive</strong> - Toggle functionality for mobile devices</li>
          <li><strong>Breadcrumb navigation</strong> - Shows current location and path</li>
          <li><strong>Active highlighting</strong> - Current page and section are highlighted</li>
          <li><strong>Auto-expansion</strong> - Parent sections expand when child pages are active</li>
        </ul>
        
        <h2>Testing the Navigation</h2>
        <p>Try these actions to test the navigation:</p>
        <ol>
          <li>Click on different sidebar items to see active state changes</li>
          <li>Use breadcrumb links to navigate up the hierarchy</li>
          <li>Resize the browser to test mobile responsiveness</li>
          <li>Use the mobile menu toggle on smaller screens</li>
        </ol>
      </div>
    </DocsContentPage>
  );
}