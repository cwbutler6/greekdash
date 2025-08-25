import { render, screen } from '@testing-library/react';
import { CTAButton, TrialSignupCTA, ContactCTA, FeatureCTA } from '@/components/docs/cta-components';
import { vi } from 'vitest';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('CTAButton', () => {
  it('renders internal link correctly', () => {
    render(
      <CTAButton href="/test">
        Test Button
      </CTAButton>
    );
    
    expect(screen.getByText('Test Button')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/test');
  });

  it('renders external link correctly', () => {
    render(
      <CTAButton href="https://example.com" external>
        External Button
      </CTAButton>
    );
    
    expect(screen.getByText('External Button')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com');
    expect(screen.getByRole('link')).toHaveAttribute('target', '_blank');
  });
});

describe('TrialSignupCTA', () => {
  it('renders with default props', () => {
    render(<TrialSignupCTA />);
    
    expect(screen.getByText('Ready to get started?')).toBeInTheDocument();
    expect(screen.getByText('Start Free Trial')).toBeInTheDocument();
    expect(screen.getByText('Contact Sales')).toBeInTheDocument();
  });

  it('renders with custom props', () => {
    render(
      <TrialSignupCTA 
        title="Custom Title"
        description="Custom description"
        buttonText="Custom Button"
      />
    );
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom description')).toBeInTheDocument();
    expect(screen.getByText('Custom Button')).toBeInTheDocument();
  });
});

describe('ContactCTA', () => {
  it('renders with default props', () => {
    render(<ContactCTA />);
    
    expect(screen.getByText('Need help getting started?')).toBeInTheDocument();
    expect(screen.getByText('Contact Support')).toBeInTheDocument();
  });

  it('renders with custom props', () => {
    render(
      <ContactCTA 
        title="Custom Contact Title"
        description="Custom contact description"
        buttonText="Custom Contact Button"
      />
    );
    
    expect(screen.getByText('Custom Contact Title')).toBeInTheDocument();
    expect(screen.getByText('Custom contact description')).toBeInTheDocument();
    expect(screen.getByText('Custom Contact Button')).toBeInTheDocument();
  });
});

describe('FeatureCTA', () => {
  const mockProps = {
    title: 'Test Feature',
    description: 'Test description',
    features: ['Feature 1', 'Feature 2', 'Feature 3'],
    ctaText: 'Get Started',
    ctaHref: '/test'
  };

  it('renders all props correctly', () => {
    render(<FeatureCTA {...mockProps} />);
    
    expect(screen.getByText('Test Feature')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('Feature 1')).toBeInTheDocument();
    expect(screen.getByText('Feature 2')).toBeInTheDocument();
    expect(screen.getByText('Feature 3')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('renders with badge', () => {
    render(<FeatureCTA {...mockProps} badge="Popular" />);
    
    expect(screen.getByText('Popular')).toBeInTheDocument();
  });
});