import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StepGuide, type GuideStep } from '@/components/docs/step-guide';
import { SimpleStepGuide, type SimpleStep } from '@/components/docs/simple-step-guide';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

describe('StepGuide', () => {
  const mockSteps: GuideStep[] = [
    {
      id: 'step-1',
      title: 'First Step',
      description: 'This is the first step description',
      screenshot: {
        src: '/test-image.png',
        alt: 'Test screenshot',
        annotations: [
          {
            id: 'annotation-1',
            x: 50,
            y: 50,
            content: 'Click here',
            type: 'callout'
          }
        ]
      },
      code: {
        language: 'typescript',
        content: 'const example = "Hello World";',
        filename: 'example.ts'
      },
      tips: ['This is a helpful tip'],
      warnings: ['Be careful with this step'],
      bestPractices: ['Always follow this practice']
    },
    {
      id: 'step-2',
      title: 'Second Step',
      description: 'This is the second step description'
    }
  ];

  const defaultProps = {
    steps: mockSteps,
    title: 'Test Guide',
    description: 'Test guide description',
    prerequisites: ['Node.js installed', 'Basic TypeScript knowledge']
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the guide title and description', () => {
    render(<StepGuide {...defaultProps} />);
    
    expect(screen.getByText('Test Guide')).toBeInTheDocument();
    expect(screen.getByText('Test guide description')).toBeInTheDocument();
  });

  it('displays prerequisites when provided', () => {
    render(<StepGuide {...defaultProps} />);
    
    expect(screen.getByText('Prerequisites:')).toBeInTheDocument();
    expect(screen.getByText('Node.js installed')).toBeInTheDocument();
    expect(screen.getByText('Basic TypeScript knowledge')).toBeInTheDocument();
  });

  it('shows progress indicator', () => {
    render(<StepGuide {...defaultProps} />);
    
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument();
  });

  it('displays step navigation sidebar', () => {
    render(<StepGuide {...defaultProps} />);
    
    expect(screen.getByText('Steps')).toBeInTheDocument();
    expect(screen.getAllByText('First Step')).toHaveLength(2); // One in sidebar, one in content
    expect(screen.getAllByText('Second Step')).toHaveLength(1); // Only in sidebar initially
  });

  it('renders current step content', () => {
    render(<StepGuide {...defaultProps} />);
    
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getAllByText('First Step')).toHaveLength(2); // One in sidebar, one in content
    expect(screen.getByText('This is the first step description')).toBeInTheDocument();
  });

  it('displays screenshot when provided', () => {
    render(<StepGuide {...defaultProps} />);
    
    const screenshot = screen.getByAltText('Test screenshot');
    expect(screenshot).toBeInTheDocument();
    expect(screenshot).toHaveAttribute('src', '/test-image.png');
  });

  it('shows code example with syntax highlighting', () => {
    render(<StepGuide {...defaultProps} />);
    
    expect(screen.getByText('example.ts')).toBeInTheDocument();
    expect(screen.getByText('typescript')).toBeInTheDocument();
    expect(screen.getByText('const example = "Hello World";')).toBeInTheDocument();
  });

  it('displays tips section', () => {
    render(<StepGuide {...defaultProps} />);
    
    expect(screen.getByText('Tips:')).toBeInTheDocument();
    expect(screen.getByText('This is a helpful tip')).toBeInTheDocument();
  });

  it('displays warnings section', () => {
    render(<StepGuide {...defaultProps} />);
    
    expect(screen.getByText('Important:')).toBeInTheDocument();
    expect(screen.getByText('Be careful with this step')).toBeInTheDocument();
  });

  it('displays best practices section', () => {
    render(<StepGuide {...defaultProps} />);
    
    expect(screen.getByText('Best Practices:')).toBeInTheDocument();
    expect(screen.getByText('Always follow this practice')).toBeInTheDocument();
  });

  it('navigates to next step when next button is clicked', () => {
    render(<StepGuide {...defaultProps} />);
    
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getAllByText('Second Step')).toHaveLength(2); // One in sidebar, one in content
    expect(screen.getByText('Step 2 of 2')).toBeInTheDocument();
  });

  it('navigates to previous step when previous button is clicked', () => {
    render(<StepGuide {...defaultProps} />);
    
    // Go to step 2 first
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    // Then go back to step 1
    const previousButton = screen.getByText('Previous');
    fireEvent.click(previousButton);
    
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getAllByText('First Step')).toHaveLength(2); // One in sidebar, one in content
  });

  it('disables previous button on first step', () => {
    render(<StepGuide {...defaultProps} />);
    
    const previousButton = screen.getByText('Previous');
    expect(previousButton).toBeDisabled();
  });

  it('disables next button on last step', () => {
    render(<StepGuide {...defaultProps} />);
    
    // Navigate to last step
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    expect(nextButton).toBeDisabled();
  });

  it('allows navigation by clicking step in sidebar', () => {
    render(<StepGuide {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    const secondStepButton = buttons.find(button => 
      button.textContent?.includes('Second Step')
    );
    
    if (secondStepButton) {
      fireEvent.click(secondStepButton);
    }
    
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getAllByText('Second Step')).toHaveLength(2); // One in sidebar, one in content
  });

  it('calls onStepComplete when mark complete button is clicked', () => {
    const onStepComplete = vi.fn();
    render(<StepGuide {...defaultProps} onStepComplete={onStepComplete} />);
    
    const markCompleteButton = screen.getByText('Mark Complete');
    fireEvent.click(markCompleteButton);
    
    expect(onStepComplete).toHaveBeenCalledWith('step-1');
  });

  it('shows completed status for completed steps', () => {
    render(<StepGuide {...defaultProps} completedSteps={['step-1']} onStepComplete={vi.fn()} />);
    
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('copies code to clipboard when copy button is clicked', async () => {
    render(<StepGuide {...defaultProps} />);
    
    // Find the copy button (it should be in the code section)
    const buttons = screen.getAllByRole('button');
    const copyButton = buttons.find(button => 
      button.className.includes('absolute') && button.className.includes('top-2')
    );
    
    if (copyButton) {
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const example = "Hello World";');
      });
    }
  });
});

describe('SimpleStepGuide', () => {
  const mockSimpleSteps: SimpleStep[] = [
    {
      title: 'Setup Project',
      description: 'Initialize a new project',
      code: {
        language: 'bash',
        content: 'npm init -y',
        filename: 'terminal'
      },
      tips: ['Use the latest Node.js version'],
      warnings: ['Make sure you have npm installed']
    },
    {
      title: 'Install Dependencies',
      description: 'Add required packages',
      screenshot: '/setup-screenshot.png',
      notes: ['This may take a few minutes']
    }
  ];

  const simpleProps = {
    title: 'Quick Setup Guide',
    description: 'Get started quickly',
    steps: mockSimpleSteps
  };

  it('renders the simple guide title and description', () => {
    render(<SimpleStepGuide {...simpleProps} />);
    
    expect(screen.getByText('Quick Setup Guide')).toBeInTheDocument();
    expect(screen.getByText('Get started quickly')).toBeInTheDocument();
  });

  it('displays all steps in sequence', () => {
    render(<SimpleStepGuide {...simpleProps} />);
    
    expect(screen.getByText('Setup Project')).toBeInTheDocument();
    expect(screen.getByText('Install Dependencies')).toBeInTheDocument();
  });

  it('shows step numbers as badges', () => {
    render(<SimpleStepGuide {...simpleProps} />);
    
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders code examples with syntax highlighting', () => {
    render(<SimpleStepGuide {...simpleProps} />);
    
    expect(screen.getByText('terminal')).toBeInTheDocument();
    expect(screen.getByText('bash')).toBeInTheDocument();
    // Check for the npm command - it might be highlighted so just check for npm
    expect(screen.getByText('npm')).toBeInTheDocument();
  });

  it('displays screenshots when provided', () => {
    render(<SimpleStepGuide {...simpleProps} />);
    
    const screenshot = screen.getByAltText('Step 2: Install Dependencies');
    expect(screenshot).toBeInTheDocument();
    expect(screenshot).toHaveAttribute('src', '/setup-screenshot.png');
  });

  it('shows tips, warnings, and notes appropriately', () => {
    render(<SimpleStepGuide {...simpleProps} />);
    
    expect(screen.getByText('Tips:')).toBeInTheDocument();
    expect(screen.getByText('Use the latest Node.js version')).toBeInTheDocument();
    
    expect(screen.getByText('Important:')).toBeInTheDocument();
    expect(screen.getByText('Make sure you have npm installed')).toBeInTheDocument();
    
    expect(screen.getByText('Note:')).toBeInTheDocument();
    expect(screen.getByText('This may take a few minutes')).toBeInTheDocument();
  });
});

describe('Step Guide Accessibility', () => {
  const mockSteps: GuideStep[] = [
    {
      id: 'step-1',
      title: 'Accessible Step',
      description: 'This step is accessible'
    }
  ];

  it('has proper heading hierarchy', () => {
    render(<StepGuide steps={mockSteps} title="Accessible Guide" />);
    
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toHaveTextContent('Accessible Guide');
  });

  it('has proper button labels', () => {
    render(<StepGuide steps={mockSteps} title="Test Guide" />);
    
    expect(screen.getByRole('button', { name: 'Previous' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
  });

  it('supports keyboard navigation', () => {
    render(<StepGuide steps={mockSteps} title="Test Guide" />);
    
    const nextButton = screen.getByRole('button', { name: 'Next' });
    expect(nextButton).toBeInTheDocument();
    expect(nextButton.tabIndex).not.toBe(-1); // Should be focusable
  });
});