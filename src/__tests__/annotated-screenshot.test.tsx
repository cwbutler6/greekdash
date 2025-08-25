import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { 
  AnnotatedScreenshot, 
  Callout, 
  ImageHighlight,
  type Annotation 
} from '@/components/docs/annotated-screenshot';

describe('AnnotatedScreenshot', () => {
  const mockAnnotations: Annotation[] = [
    {
      id: 'annotation-1',
      x: 25,
      y: 50,
      content: 'Click this button to continue',
      title: 'Continue Button',
      type: 'info'
    },
    {
      id: 'annotation-2',
      x: 75,
      y: 25,
      content: 'This area shows important information',
      type: 'warning'
    },
    {
      id: 'annotation-3',
      x: 50,
      y: 75,
      content: 'Success indicator appears here',
      type: 'success'
    }
  ];

  const defaultProps = {
    src: '/test-screenshot.png',
    alt: 'Test screenshot for documentation',
    annotations: mockAnnotations
  };

  it('renders the screenshot image', () => {
    render(<AnnotatedScreenshot {...defaultProps} />);
    
    const image = screen.getByAltText('Test screenshot for documentation');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/test-screenshot.png');
  });

  it('displays annotation markers', () => {
    render(<AnnotatedScreenshot {...defaultProps} />);
    
    // Should show numbered markers (1, 2, 3) - they appear both as overlay markers and in the list
    expect(screen.getAllByText('1')).toHaveLength(2);
    expect(screen.getAllByText('2')).toHaveLength(2);
    expect(screen.getAllByText('3')).toHaveLength(2);
  });

  it('shows annotation list below the image', () => {
    render(<AnnotatedScreenshot {...defaultProps} />);
    
    expect(screen.getByText('Annotations:')).toBeInTheDocument();
    expect(screen.getByText('Click this button to continue')).toBeInTheDocument();
    expect(screen.getByText('This area shows important information')).toBeInTheDocument();
    expect(screen.getByText('Success indicator appears here')).toBeInTheDocument();
  });

  it('displays annotation titles when provided', () => {
    render(<AnnotatedScreenshot {...defaultProps} />);
    
    expect(screen.getByText('Continue Button')).toBeInTheDocument();
  });

  it('opens tooltip when annotation marker is clicked', () => {
    render(<AnnotatedScreenshot {...defaultProps} />);
    
    // Find the overlay marker (not the one in the list)
    const buttons = screen.getAllByRole('button');
    const overlayMarker = buttons.find(button => 
      button.className.includes('absolute') && button.textContent === '1'
    );
    
    if (overlayMarker) {
      fireEvent.click(overlayMarker);
      
      // Should show tooltip with title and content
      expect(screen.getAllByText('Continue Button')).toHaveLength(2); // One in list, one in tooltip
      expect(screen.getAllByText('Click this button to continue')).toHaveLength(2);
    }
  });

  it('closes tooltip when close button is clicked', () => {
    render(<AnnotatedScreenshot {...defaultProps} />);
    
    // Find and click the overlay marker
    const buttons = screen.getAllByRole('button');
    const overlayMarker = buttons.find(button => 
      button.className.includes('absolute') && button.textContent === '1'
    );
    
    if (overlayMarker) {
      fireEvent.click(overlayMarker);
      
      // Find and click close button (it's the button with the X icon in the tooltip)
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find(button => 
        button.className.includes('h-6 w-6 p-0 shrink-0')
      );
      
      if (closeButton) {
        fireEvent.click(closeButton);
      }
      
      // Should only show content in the list, not in tooltip
      expect(screen.getAllByText('Continue Button')).toHaveLength(1);
    }
  });

  it('highlights active annotation in the list', () => {
    render(<AnnotatedScreenshot {...defaultProps} />);
    
    // Find and click the overlay marker
    const buttons = screen.getAllByRole('button');
    const overlayMarker = buttons.find(button => 
      button.className.includes('absolute') && button.textContent === '1'
    );
    
    if (overlayMarker) {
      fireEvent.click(overlayMarker);
      
      // The annotation list item should have active styling
      const listItems = screen.getAllByRole('button');
      const activeItem = listItems.find(item => 
        item.textContent?.includes('Continue Button') && !item.className.includes('absolute')
      );
      expect(activeItem).toHaveClass('bg-muted', 'border-primary');
    }
  });

  it('applies correct styling for different annotation types', () => {
    render(<AnnotatedScreenshot {...defaultProps} />);
    
    const markers = screen.getAllByRole('button').filter(button => 
      ['1', '2', '3'].includes(button.textContent || '')
    );
    
    // Info annotation (marker 1)
    expect(markers[0]).toHaveClass('bg-primary');
    
    // Warning annotation (marker 2)
    expect(markers[1]).toHaveClass('bg-yellow-500');
    
    // Success annotation (marker 3)
    expect(markers[2]).toHaveClass('bg-green-500');
  });

  it('handles hover behavior when showAnnotationsOnHover is enabled', () => {
    render(<AnnotatedScreenshot {...defaultProps} showAnnotationsOnHover />);
    
    const image = screen.getByAltText('Test screenshot for documentation');
    
    // Hover over image
    fireEvent.mouseEnter(image);
    
    // Should show pulse effects
    const pulseElements = document.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
    
    // Mouse leave
    fireEvent.mouseLeave(image);
  });

  it('handles empty annotations array', () => {
    render(<AnnotatedScreenshot src="/test.png" alt="Test" annotations={[]} />);
    
    const image = screen.getByAltText('Test');
    expect(image).toBeInTheDocument();
    
    // Should not show annotations section
    expect(screen.queryByText('Annotations:')).not.toBeInTheDocument();
  });
});

describe('Callout', () => {
  it('renders info callout by default', () => {
    render(<Callout>This is an info callout</Callout>);
    
    expect(screen.getByText('This is an info callout')).toBeInTheDocument();
    expect(screen.getByText('ℹ️')).toBeInTheDocument();
  });

  it('renders warning callout', () => {
    render(<Callout type="warning">This is a warning</Callout>);
    
    expect(screen.getByText('This is a warning')).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('renders success callout', () => {
    render(<Callout type="success">This is a success message</Callout>);
    
    expect(screen.getByText('This is a success message')).toBeInTheDocument();
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('renders tip callout', () => {
    render(<Callout type="tip">This is a helpful tip</Callout>);
    
    expect(screen.getByText('This is a helpful tip')).toBeInTheDocument();
    expect(screen.getByText('💡')).toBeInTheDocument();
  });

  it('displays title when provided', () => {
    render(
      <Callout type="warning" title="Important Notice">
        Please read this carefully
      </Callout>
    );
    
    expect(screen.getByText('Important Notice')).toBeInTheDocument();
    expect(screen.getByText('Please read this carefully')).toBeInTheDocument();
  });

  it('applies correct styling for each type', () => {
    const { rerender } = render(<Callout type="warning">Warning</Callout>);
    
    // Find the outermost callout div
    let callout = screen.getByText('Warning').closest('.rounded-lg');
    expect(callout).toHaveClass('border-yellow-200', 'bg-yellow-50', 'text-yellow-800');
    
    rerender(<Callout type="success">Success</Callout>);
    callout = screen.getByText('Success').closest('.rounded-lg');
    expect(callout).toHaveClass('border-green-200', 'bg-green-50', 'text-green-800');
    
    rerender(<Callout type="tip">Tip</Callout>);
    callout = screen.getByText('Tip').closest('.rounded-lg');
    expect(callout).toHaveClass('border-blue-200', 'bg-blue-50', 'text-blue-800');
  });
});

describe('ImageHighlight', () => {
  const mockHighlights = [
    {
      x: 10,
      y: 20,
      width: 30,
      height: 40,
      label: 'Important Area'
    },
    {
      x: 50,
      y: 60,
      width: 20,
      height: 15
    }
  ];

  const defaultProps = {
    src: '/test-image.png',
    alt: 'Test image with highlights',
    highlights: mockHighlights
  };

  it('renders the image', () => {
    render(<ImageHighlight {...defaultProps} />);
    
    const image = screen.getByAltText('Test image with highlights');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/test-image.png');
  });

  it('displays highlight overlays', () => {
    render(<ImageHighlight {...defaultProps} />);
    
    const highlights = document.querySelectorAll('.border-yellow-400');
    expect(highlights).toHaveLength(2);
  });

  it('shows labels for highlights when provided', () => {
    render(<ImageHighlight {...defaultProps} />);
    
    expect(screen.getByText('Important Area')).toBeInTheDocument();
  });

  it('positions highlights correctly', () => {
    render(<ImageHighlight {...defaultProps} />);
    
    const highlights = document.querySelectorAll('.border-yellow-400');
    const firstHighlight = highlights[0] as HTMLElement;
    
    expect(firstHighlight.style.left).toBe('10%');
    expect(firstHighlight.style.top).toBe('20%');
    expect(firstHighlight.style.width).toBe('30%');
    expect(firstHighlight.style.height).toBe('40%');
  });

  it('handles highlights without labels', () => {
    const highlightsWithoutLabels = [
      { x: 25, y: 25, width: 50, height: 50 }
    ];
    
    render(
      <ImageHighlight 
        src="/test.png" 
        alt="Test" 
        highlights={highlightsWithoutLabels} 
      />
    );
    
    const highlights = document.querySelectorAll('.border-yellow-400');
    expect(highlights).toHaveLength(1);
    
    // Should not have any label elements
    const labels = document.querySelectorAll('.bg-yellow-400');
    expect(labels).toHaveLength(0);
  });
});

describe('Annotation Accessibility', () => {
  const mockAnnotations: Annotation[] = [
    {
      id: 'annotation-1',
      x: 50,
      y: 50,
      content: 'Accessible annotation',
      title: 'Test Annotation'
    }
  ];

  it('provides proper button roles for interactive elements', () => {
    render(
      <AnnotatedScreenshot 
        src="/test.png" 
        alt="Test" 
        annotations={mockAnnotations} 
      />
    );
    
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('has proper alt text for images', () => {
    render(
      <AnnotatedScreenshot 
        src="/test.png" 
        alt="Accessible screenshot description" 
        annotations={mockAnnotations} 
      />
    );
    
    const image = screen.getByAltText('Accessible screenshot description');
    expect(image).toBeInTheDocument();
  });

  it('supports keyboard navigation', () => {
    render(
      <AnnotatedScreenshot 
        src="/test.png" 
        alt="Test" 
        annotations={mockAnnotations} 
      />
    );
    
    // Find the overlay marker button
    const buttons = screen.getAllByRole('button');
    const overlayMarker = buttons.find(button => 
      button.className.includes('absolute') && button.textContent === '1'
    );
    
    if (overlayMarker) {
      overlayMarker.focus();
      expect(document.activeElement).toBe(overlayMarker);
    }
  });
});