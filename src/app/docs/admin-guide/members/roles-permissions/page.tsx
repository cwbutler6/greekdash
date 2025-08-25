import { Metadata } from 'next';
import { DocsContentPage } from '@/components/docs/docs-content-page';

export const metadata: Metadata = {
  title: 'Member Roles and Permissions | GreekDash Documentation',
  description: 'Complete guide to managing member roles, permissions, and access controls in your chapter',
  keywords: ['member roles', 'permissions', 'access control', 'security', 'chapter management'],
};

export default function MemberRolesPermissionsPage() {
  return (
    <DocsContentPage
      title="Member Roles and Permissions"
      description="Complete guide to managing member roles, permissions, and access controls in your chapter"
      section="admin-guide"
      subsection="members"
    />
  );
}