import { render, screen } from '@testing-library/react';
import { 
  QuickReferenceCards, 
  MemberManagementCards, 
  FinanceManagementCards,
  EventManagementCards,
  CommunicationCards,
  SettingsCards
} from '@/components/docs/quick-reference-cards';

describe('QuickReferenceCards', () => {
  it('renders all quick reference cards by default', () => {
    render(<QuickReferenceCards />);
    
    expect(screen.getByText('Invite New Members')).toBeInTheDocument();
    expect(screen.getByText('Set Up Dues Collection')).toBeInTheDocument();
    expect(screen.getByText('Create Chapter Event')).toBeInTheDocument();
    expect(screen.getByText('Send Member Broadcast')).toBeInTheDocument();
  });

  it('filters cards by category', () => {
    render(<QuickReferenceCards category="members" />);
    
    expect(screen.getByText('Invite New Members')).toBeInTheDocument();
    expect(screen.getByText('Approve Pending Members')).toBeInTheDocument();
    expect(screen.queryByText('Set Up Dues Collection')).not.toBeInTheDocument();
  });

  it('limits the number of cards displayed', () => {
    render(<QuickReferenceCards limit={2} />);
    
    const cards = screen.getAllByText('View detailed guide');
    expect(cards).toHaveLength(2);
  });

  it('renders compact version correctly', () => {
    render(<QuickReferenceCards compact />);
    
    // Compact version should show "View guide" instead of "View detailed guide"
    expect(screen.getAllByText('View guide').length).toBeGreaterThan(0);
  });

  it('displays step-by-step instructions', () => {
    render(<QuickReferenceCards />);
    
    expect(screen.getAllByText('Steps:').length).toBeGreaterThan(0);
    expect(screen.getByText('Navigate to Members → Invites')).toBeInTheDocument();
  });

  it('shows estimated time and difficulty', () => {
    render(<QuickReferenceCards />);
    
    expect(screen.getByText('2 min')).toBeInTheDocument();
    expect(screen.getAllByText('easy').length).toBeGreaterThan(0);
  });

  it('displays tips when available', () => {
    render(<QuickReferenceCards />);
    
    expect(screen.getAllByText('Tips:').length).toBeGreaterThan(0);
    expect(screen.getByText('Include a personal welcome message')).toBeInTheDocument();
  });

  it('shows category badges when enabled', () => {
    render(<QuickReferenceCards showCategories />);
    
    expect(screen.getAllByText('Members').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Finance').length).toBeGreaterThan(0);
  });

  it('provides proper links to detailed guides', () => {
    render(<QuickReferenceCards />);
    
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    
    // Check that links have proper href attributes
    links.forEach(link => {
      expect(link).toHaveAttribute('href');
      expect(link.getAttribute('href')).toMatch(/^\/docs\//);
    });
  });
});

describe('Category-specific components', () => {
  it('renders MemberManagementCards correctly', () => {
    render(<MemberManagementCards />);
    
    expect(screen.getByText('Invite New Members')).toBeInTheDocument();
    expect(screen.getByText('Approve Pending Members')).toBeInTheDocument();
    expect(screen.queryByText('Set Up Dues Collection')).not.toBeInTheDocument();
  });

  it('renders FinanceManagementCards correctly', () => {
    render(<FinanceManagementCards />);
    
    expect(screen.getByText('Set Up Dues Collection')).toBeInTheDocument();
    expect(screen.getByText('Record Chapter Expenses')).toBeInTheDocument();
    expect(screen.queryByText('Invite New Members')).not.toBeInTheDocument();
  });

  it('renders EventManagementCards correctly', () => {
    render(<EventManagementCards />);
    
    expect(screen.getByText('Create Chapter Event')).toBeInTheDocument();
    expect(screen.getByText('Track Event RSVPs')).toBeInTheDocument();
    expect(screen.queryByText('Send Member Broadcast')).not.toBeInTheDocument();
  });

  it('renders CommunicationCards correctly', () => {
    render(<CommunicationCards />);
    
    expect(screen.getByText('Send Member Broadcast')).toBeInTheDocument();
    expect(screen.getByText('Configure Email Templates')).toBeInTheDocument();
    expect(screen.queryByText('Create Chapter Event')).not.toBeInTheDocument();
  });

  it('renders SettingsCards correctly', () => {
    render(<SettingsCards />);
    
    expect(screen.getByText('Update Chapter Profile')).toBeInTheDocument();
    expect(screen.getByText('Configure Privacy Settings')).toBeInTheDocument();
    expect(screen.queryByText('Send Member Broadcast')).not.toBeInTheDocument();
  });
});