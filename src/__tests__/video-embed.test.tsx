import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VideoEmbed } from '@/components/docs/video-embed';
import { vi } from 'vitest';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

describe('VideoEmbed', () => {
  const mockProps = {
    videoId: 'dQw4w9WgXcQ',
    title: 'Test Video'
  };

  it('renders video thumbnail initially', () => {
    render(<VideoEmbed {...mockProps} />);
    
    expect(screen.getByAltText('Test Video video thumbnail')).toBeInTheDocument();
    expect(screen.getByText('Test Video')).toBeInTheDocument();
  });

  it('shows play button overlay', () => {
    render(<VideoEmbed {...mockProps} />);
    
    const playButton = screen.getByRole('button');
    expect(playButton).toBeInTheDocument();
  });

  it('loads iframe when play button is clicked', async () => {
    render(<VideoEmbed {...mockProps} />);
    
    const playButton = screen.getByRole('button');
    fireEvent.click(playButton);
    
    await waitFor(() => {
      expect(screen.getByTitle('Test Video')).toBeInTheDocument();
      expect(screen.getByTitle('Test Video')).toHaveAttribute('src');
    });
  });

  it('extracts video ID from YouTube URL', () => {
    render(
      <VideoEmbed 
        videoId="https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
        title="Test Video" 
      />
    );
    
    expect(screen.getByAltText('Test Video video thumbnail')).toHaveAttribute(
      'src',
      'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
    );
  });

  it('extracts video ID from youtu.be URL', () => {
    render(
      <VideoEmbed 
        videoId="https://youtu.be/dQw4w9WgXcQ" 
        title="Test Video" 
      />
    );
    
    expect(screen.getByAltText('Test Video video thumbnail')).toHaveAttribute(
      'src',
      'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
    );
  });

  it('handles autoplay prop', async () => {
    render(<VideoEmbed {...mockProps} autoplay={true} />);
    
    // With autoplay, clicking play should load the iframe with autoplay enabled
    const playButton = screen.getByRole('button');
    fireEvent.click(playButton);
    
    await waitFor(() => {
      const iframe = screen.getByTitle('Test Video');
      expect(iframe).toBeInTheDocument();
      expect(iframe.getAttribute('src')).toContain('autoplay=1');
    });
  });

  it('handles showControls prop', async () => {
    render(<VideoEmbed {...mockProps} showControls={false} />);
    
    const playButton = screen.getByRole('button');
    fireEvent.click(playButton);
    
    await waitFor(() => {
      const iframe = screen.getByTitle('Test Video');
      expect(iframe).toHaveAttribute('src');
      expect(iframe.getAttribute('src')).toContain('controls=0');
    });
  });

  it('applies custom className', () => {
    const { container } = render(
      <VideoEmbed {...mockProps} className="custom-video-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-video-class');
  });

  it('shows error message when image fails to load', () => {
    render(<VideoEmbed {...mockProps} />);
    
    const image = screen.getByAltText('Test Video video thumbnail');
    fireEvent.error(image);
    
    expect(screen.getByText(/Unable to load video/)).toBeInTheDocument();
  });

  it('shows error alert when video fails to load', () => {
    render(<VideoEmbed {...mockProps} />);
    
    const image = screen.getByAltText('Test Video video thumbnail');
    fireEvent.error(image);
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});