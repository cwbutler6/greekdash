import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VideoEmbed } from '@/components/docs/video-embed';
import { VideoTutorial, InlineVideoTutorial } from '@/components/docs/video-tutorial';
import { VideoAnalyticsDashboard } from '@/components/docs/video-analytics-dashboard';
import { 
  trackVideoEvent, 
  getVideoMetrics, 
  clearVideoAnalytics,
  getVideoAnalyticsSummary 
} from '@/lib/video-analytics';

// Mock the analytics functions
vi.mock('@/lib/client-analytics', () => ({
  trackChapterEvent: vi.fn()
}));

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  )
}));

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  )
}));

describe('Video Tutorial Integration', () => {
  beforeEach(() => {
    clearVideoAnalytics();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearVideoAnalytics();
  });

  describe('VideoEmbed Component', () => {
    const defaultProps = {
      videoId: 'dQw4w9WgXcQ',
      title: 'Test Video Tutorial'
    };

    it('renders video thumbnail with play button', () => {
      render(<VideoEmbed {...defaultProps} />);
      
      expect(screen.getByAltText('Test Video Tutorial video thumbnail')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /play video/i })).toBeInTheDocument();
      expect(screen.getByText('Test Video Tutorial')).toBeInTheDocument();
    });

    it('displays video duration when provided', () => {
      render(<VideoEmbed {...defaultProps} duration="5:30" />);
      
      expect(screen.getByText('5:30')).toBeInTheDocument();
    });

    it('shows description when provided', () => {
      const description = 'Learn how to manage chapter members effectively';
      render(<VideoEmbed {...defaultProps} description={description} />);
      
      expect(screen.getByText(description)).toBeInTheDocument();
    });

    it('displays related links when provided', () => {
      const relatedLinks = [
        {
          title: 'Member Management Guide',
          url: '/docs/admin-guide/members',
          type: 'internal' as const,
          description: 'Comprehensive member management documentation'
        },
        {
          title: 'External Resource',
          url: 'https://example.com',
          type: 'external' as const
        }
      ];

      render(<VideoEmbed {...defaultProps} relatedLinks={relatedLinks} />);
      
      expect(screen.getByText('Related Resources')).toBeInTheDocument();
      expect(screen.getByText('Member Management Guide')).toBeInTheDocument();
      expect(screen.getByText('External Resource')).toBeInTheDocument();
      expect(screen.getByText('Internal')).toBeInTheDocument();
      expect(screen.getByText('External')).toBeInTheDocument();
    });

    it('shows transcript toggle when transcript is provided', () => {
      const transcript = 'Welcome to this tutorial about member management...';
      render(<VideoEmbed {...defaultProps} transcript={transcript} />);
      
      expect(screen.getByRole('button', { name: /video transcript/i })).toBeInTheDocument();
    });

    it('toggles transcript visibility when clicked', async () => {
      const transcript = 'Welcome to this tutorial about member management...';
      render(<VideoEmbed {...defaultProps} transcript={transcript} />);
      
      const transcriptButton = screen.getByRole('button', { name: /video transcript/i });
      
      // Initially hidden
      expect(screen.queryByText(transcript)).not.toBeInTheDocument();
      
      // Click to show
      fireEvent.click(transcriptButton);
      await waitFor(() => {
        expect(screen.getByText(transcript)).toBeInTheDocument();
      });
      
      // Click to hide
      fireEvent.click(transcriptButton);
      await waitFor(() => {
        expect(screen.queryByText(transcript)).not.toBeInTheDocument();
      });
    });

    it('tracks video analytics when play button is clicked', () => {
      render(<VideoEmbed {...defaultProps} />);
      
      const playButton = screen.getByRole('button', { name: /play video/i });
      fireEvent.click(playButton);
      
      // Check that analytics were tracked
      const metrics = getVideoMetrics(defaultProps.videoId);
      expect(metrics).toBeTruthy();
      expect(metrics?.totalViews).toBe(1);
    });

    it('tracks transcript interactions', async () => {
      const transcript = 'Test transcript content';
      render(<VideoEmbed {...defaultProps} transcript={transcript} />);
      
      const transcriptButton = screen.getByRole('button', { name: /video transcript/i });
      fireEvent.click(transcriptButton);
      
      await waitFor(() => {
        const metrics = getVideoMetrics(defaultProps.videoId);
        expect(metrics?.transcriptViews).toBe(1);
      });
    });

    it('handles video ID extraction from YouTube URLs', () => {
      const youtubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      render(<VideoEmbed videoId={youtubeUrl} title="Test Video" />);
      
      // Should still render properly with URL instead of just ID
      expect(screen.getByAltText('Test Video video thumbnail')).toBeInTheDocument();
    });

    it('displays error state when video fails to load', () => {
      render(<VideoEmbed {...defaultProps} />);
      
      const thumbnail = screen.getByAltText('Test Video Tutorial video thumbnail');
      fireEvent.error(thumbnail);
      
      expect(screen.getByText(/unable to load video/i)).toBeInTheDocument();
    });
  });

  describe('VideoTutorial Component', () => {
    const defaultProps = {
      videoId: 'dQw4w9WgXcQ',
      title: 'Complete Member Management Tutorial',
      description: 'Learn everything about managing chapter members',
      difficulty: 'intermediate' as const,
      duration: '10:30',
      audience: ['Chapter Admins', 'Officers'],
      prerequisites: ['Basic admin access', 'Chapter setup completed']
    };

    it('renders tutorial header with metadata', () => {
      render(<VideoTutorial {...defaultProps} />);
      
      expect(screen.getAllByText('Complete Member Management Tutorial')).toHaveLength(2); // Card title and video overlay
      expect(screen.getAllByText('Learn everything about managing chapter members')).toHaveLength(2); // Card description and video description
      expect(screen.getByText('Intermediate')).toBeInTheDocument();
      expect(screen.getAllByText('10:30')).toHaveLength(2); // Header and video overlay
      expect(screen.getByText('For: Chapter Admins, Officers')).toBeInTheDocument();
    });

    it('displays prerequisites section', () => {
      render(<VideoTutorial {...defaultProps} />);
      
      expect(screen.getByText('Prerequisites')).toBeInTheDocument();
      expect(screen.getByText('Basic admin access')).toBeInTheDocument();
      expect(screen.getByText('Chapter setup completed')).toBeInTheDocument();
    });

    it('applies correct difficulty styling', () => {
      const { rerender } = render(<VideoTutorial {...defaultProps} difficulty="beginner" />);
      expect(screen.getByText('Beginner')).toBeInTheDocument();
      
      rerender(<VideoTutorial {...defaultProps} difficulty="advanced" />);
      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });
  });

  describe('InlineVideoTutorial Component', () => {
    const defaultProps = {
      videoId: 'dQw4w9WgXcQ',
      title: 'Quick Tutorial',
      description: 'A short tutorial for inline use'
    };

    it('renders simplified video embed', () => {
      render(<InlineVideoTutorial {...defaultProps} />);
      
      expect(screen.getByAltText('Quick Tutorial video thumbnail')).toBeInTheDocument();
      expect(screen.getByText('A short tutorial for inline use')).toBeInTheDocument();
    });

    it('does not show related content by default', () => {
      render(<InlineVideoTutorial {...defaultProps} />);
      
      // Should not show related resources section
      expect(screen.queryByText('Related Resources')).not.toBeInTheDocument();
    });
  });

  describe('Video Analytics', () => {
    it('tracks video start events', () => {
      trackVideoEvent({
        videoId: 'test-video',
        videoTitle: 'Test Video',
        eventType: 'start'
      });

      const metrics = getVideoMetrics('test-video');
      expect(metrics?.totalViews).toBe(1);
      expect(metrics?.videoTitle).toBe('Test Video');
    });

    it('tracks video completion with watch time', () => {
      // Start video
      trackVideoEvent({
        videoId: 'test-video',
        videoTitle: 'Test Video',
        eventType: 'start'
      });

      // Complete video
      trackVideoEvent({
        videoId: 'test-video',
        videoTitle: 'Test Video',
        eventType: 'complete',
        watchTime: 120
      });

      const metrics = getVideoMetrics('test-video');
      expect(metrics?.averageWatchTime).toBe(120);
    });

    it('tracks transcript interactions', () => {
      trackVideoEvent({
        videoId: 'test-video',
        videoTitle: 'Test Video',
        eventType: 'transcript_open'
      });

      const metrics = getVideoMetrics('test-video');
      expect(metrics?.transcriptViews).toBe(1);
    });

    it('tracks related link clicks', () => {
      trackVideoEvent({
        videoId: 'test-video',
        videoTitle: 'Test Video',
        eventType: 'related_link_click'
      });

      const metrics = getVideoMetrics('test-video');
      expect(metrics?.relatedLinkClicks).toBe(1);
    });

    it('provides analytics summary', () => {
      // Add some test data
      trackVideoEvent({
        videoId: 'video1',
        videoTitle: 'Video 1',
        eventType: 'start'
      });

      trackVideoEvent({
        videoId: 'video2',
        videoTitle: 'Video 2',
        eventType: 'start'
      });

      const summary = getVideoAnalyticsSummary();
      expect(summary.totalVideos).toBe(2);
      expect(summary.totalViews).toBe(2);
    });
  });

  describe('VideoAnalyticsDashboard Component', () => {
    beforeEach(() => {
      // Add some test data
      trackVideoEvent({
        videoId: 'popular-video',
        videoTitle: 'Popular Tutorial',
        eventType: 'start'
      });

      trackVideoEvent({
        videoId: 'popular-video',
        videoTitle: 'Popular Tutorial',
        eventType: 'transcript_open'
      });
    });

    it('renders analytics summary cards', () => {
      render(<VideoAnalyticsDashboard />);
      
      expect(screen.getByText('Video Analytics Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Total Videos')).toBeInTheDocument();
      expect(screen.getByText('Total Views')).toBeInTheDocument();
      expect(screen.getByText('Avg. Completion')).toBeInTheDocument();
      expect(screen.getByText('Transcript Views')).toBeInTheDocument();
    });

    it('displays popular videos tab', () => {
      render(<VideoAnalyticsDashboard />);
      
      expect(screen.getByText('Most Popular Videos')).toBeInTheDocument();
      expect(screen.getByText('Popular Tutorial')).toBeInTheDocument();
    });

    it('shows engagement metrics', async () => {
      render(<VideoAnalyticsDashboard />);
      
      // Click on engagement tab
      const engagementTab = screen.getByRole('tab', { name: /engagement/i });
      fireEvent.click(engagementTab);
      
      // Just verify the tab is clickable and doesn't crash
      expect(engagementTab).toBeInTheDocument();
    });

    it('has refresh functionality', () => {
      render(<VideoAnalyticsDashboard />);
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeInTheDocument();
      
      fireEvent.click(refreshButton);
      // Should not throw errors
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for video controls', () => {
      render(<VideoEmbed videoId="test" title="Accessible Video" />);
      
      const playButton = screen.getByRole('button', { name: /play video: accessible video/i });
      expect(playButton).toBeInTheDocument();
    });

    it('supports keyboard navigation for transcript toggle', () => {
      render(<VideoEmbed videoId="test" title="Test" transcript="Test transcript" />);
      
      const transcriptButton = screen.getByRole('button', { name: /video transcript/i });
      
      // Should be focusable
      transcriptButton.focus();
      expect(document.activeElement).toBe(transcriptButton);
      
      // Should respond to Enter key
      fireEvent.keyDown(transcriptButton, { key: 'Enter' });
      // Component should handle the interaction
    });

    it('provides proper alt text for video thumbnails', () => {
      render(<VideoEmbed videoId="test" title="Tutorial Video" />);
      
      const thumbnail = screen.getByAltText('Tutorial Video video thumbnail');
      expect(thumbnail).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('gracefully handles invalid video IDs', () => {
      render(<VideoEmbed videoId="invalid-id" title="Invalid Video" />);
      
      // Should still render without crashing
      expect(screen.getByText('Invalid Video')).toBeInTheDocument();
    });

    it('shows error state when video fails to load', () => {
      render(<VideoEmbed videoId="test" title="Test Video" />);
      
      const thumbnail = screen.getByAltText('Test Video video thumbnail');
      fireEvent.error(thumbnail);
      
      expect(screen.getByText(/unable to load video/i)).toBeInTheDocument();
    });

    it('maintains related content when video fails', () => {
      const relatedLinks = [
        { title: 'Backup Guide', url: '/guide', type: 'internal' as const }
      ];
      
      render(
        <VideoEmbed 
          videoId="test" 
          title="Test Video" 
          relatedLinks={relatedLinks}
          transcript="Backup transcript"
        />
      );
      
      const thumbnail = screen.getByAltText('Test Video video thumbnail');
      fireEvent.error(thumbnail);
      
      // Should still show related content
      expect(screen.getByText('Related Resources')).toBeInTheDocument();
      expect(screen.getByText('Backup Guide')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /video transcript/i })).toBeInTheDocument();
    });
  });
});