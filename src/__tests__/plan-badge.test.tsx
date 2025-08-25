import { render, screen } from '@testing-library/react';
import { PlanBadge, PlanComparison } from '@/components/docs/plan-badge';

describe('PlanBadge', () => {
  it('renders FREE plan badge correctly', () => {
    render(<PlanBadge plan="FREE" />);
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('renders BASIC plan badge correctly', () => {
    render(<PlanBadge plan="BASIC" />);
    expect(screen.getByText('Basic')).toBeInTheDocument();
  });

  it('renders PRO plan badge correctly', () => {
    render(<PlanBadge plan="PRO" />);
    expect(screen.getByText('Pro')).toBeInTheDocument();
  });

  it('renders ENTERPRISE plan badge correctly', () => {
    render(<PlanBadge plan="ENTERPRISE" />);
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
  });

  it('renders without icon when showIcon is false', () => {
    render(<PlanBadge plan="PRO" showIcon={false} />);
    expect(screen.getByText('Pro')).toBeInTheDocument();
  });

  it('applies different sizes correctly', () => {
    const { rerender } = render(<PlanBadge plan="PRO" size="sm" />);
    expect(screen.getByText('Pro')).toBeInTheDocument();
    
    rerender(<PlanBadge plan="PRO" size="md" />);
    expect(screen.getByText('Pro')).toBeInTheDocument();
    
    rerender(<PlanBadge plan="PRO" size="lg" />);
    expect(screen.getByText('Pro')).toBeInTheDocument();
  });
});

describe('PlanComparison', () => {
  it('renders multiple plan badges', () => {
    render(<PlanComparison plans={['FREE', 'BASIC', 'PRO']} />);
    
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Basic')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
  });

  it('highlights current plan', () => {
    render(<PlanComparison plans={['FREE', 'BASIC', 'PRO']} currentPlan="PRO" />);
    
    expect(screen.getByText('Pro')).toBeInTheDocument();
  });
});