import { render, screen } from '@testing-library/react';
import { FeatureComparison } from '@/components/docs/feature-comparison';
import { vi } from 'vitest';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockFeatures = [
  {
    name: 'Active Members',
    description: 'Maximum number of active members',
    plans: {
      FREE: 25,
      BASIC: 100,
      PRO: 500,
      ENTERPRISE: 'Unlimited'
    }
  },
  {
    name: 'File Storage',
    description: 'Total file storage capacity',
    plans: {
      FREE: '1 GB',
      BASIC: '10 GB',
      PRO: '100 GB',
      ENTERPRISE: 'Unlimited'
    }
  },
  {
    name: 'Member Directory',
    plans: {
      FREE: true,
      BASIC: true,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'Advanced Analytics',
    plans: {
      FREE: false,
      BASIC: false,
      PRO: true,
      ENTERPRISE: true
    }
  }
];

describe('FeatureComparison', () => {
  it('renders all plan headers correctly', () => {
    render(<FeatureComparison features={mockFeatures} />);
    
    expect(screen.getAllByText('Free').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Basic').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Pro').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Enterprise').length).toBeGreaterThanOrEqual(2);
  });

  it('renders plan pricing correctly', () => {
    render(<FeatureComparison features={mockFeatures} />);
    
    expect(screen.getAllByText('$0')).toHaveLength(2); // Desktop and mobile
    expect(screen.getAllByText('$29')).toHaveLength(2);
    expect(screen.getAllByText('$79')).toHaveLength(2);
    expect(screen.getAllByText('Custom')).toHaveLength(2);
  });

  it('highlights the specified plan', () => {
    render(<FeatureComparison features={mockFeatures} highlightPlan="PRO" />);
    
    expect(screen.getByText('Most Popular')).toBeInTheDocument();
  });

  it('renders feature names and descriptions', () => {
    render(<FeatureComparison features={mockFeatures} />);
    
    expect(screen.getAllByText('Active Members')).toHaveLength(5); // Desktop table + mobile cards
    expect(screen.getAllByText('Maximum number of active members')).toHaveLength(5);
    expect(screen.getAllByText('File Storage')).toHaveLength(5);
    expect(screen.getAllByText('Total file storage capacity')).toHaveLength(5);
  });

  it('renders feature values correctly', () => {
    render(<FeatureComparison features={mockFeatures} />);
    
    // Check numeric values (desktop + mobile)
    expect(screen.getAllByText('25')).toHaveLength(2);
    expect(screen.getAllByText('100')).toHaveLength(2);
    expect(screen.getAllByText('500')).toHaveLength(2);
    
    // Check string values (desktop + mobile)
    expect(screen.getAllByText('1 GB')).toHaveLength(2);
    expect(screen.getAllByText('10 GB')).toHaveLength(2);
    expect(screen.getAllByText('100 GB')).toHaveLength(2);
    expect(screen.getAllByText('Unlimited')).toHaveLength(4); // 2 features × 2 views
  });

  it('renders CTA buttons when showCTA is true', () => {
    render(<FeatureComparison features={mockFeatures} showCTA={true} />);
    
    expect(screen.getAllByText('Get Started')).toHaveLength(2); // Desktop and mobile
    expect(screen.getAllByText('Start Trial')).toHaveLength(4); // 2 plans × 2 views
    expect(screen.getAllByText('Contact Sales')).toHaveLength(2);
  });

  it('hides CTA buttons when showCTA is false', () => {
    render(<FeatureComparison features={mockFeatures} showCTA={false} />);
    
    expect(screen.queryByText('Get Started')).not.toBeInTheDocument();
    expect(screen.queryByText('Start Trial')).not.toBeInTheDocument();
    expect(screen.queryByText('Contact Sales')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <FeatureComparison features={mockFeatures} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});