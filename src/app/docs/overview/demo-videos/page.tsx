import { Metadata } from 'next';
import { DemoVideoGallery } from '@/components/docs/demo-video-gallery';

export const metadata: Metadata = {
  title: 'Demo Videos | GreekDash Documentation',
  description: 'Comprehensive video gallery showcasing GreekDash features and capabilities.',
};

export default function DemoVideosPage() {
  return <DemoVideoGallery />;
}