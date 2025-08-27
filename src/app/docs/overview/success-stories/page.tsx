import { Metadata } from 'next';
import { SuccessStories } from '@/components/docs/success-stories';

export const metadata: Metadata = {
  title: 'Success Stories | GreekDash Documentation',
  description: 'Real chapter success stories, testimonials, and use cases showcasing GreekDash impact.',
};

export default function SuccessStoriesPage() {
  return <SuccessStories />;
}