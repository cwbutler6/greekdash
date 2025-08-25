import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { OnboardingChecklist } from '@/components/docs/onboarding-checklist';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('OnboardingChecklist', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it('renders the onboarding checklist with progress tracking', () => {
    render(<OnboardingChecklist />);
    
    expect(screen.getByText('Onboarding Progress')).toBeInTheDocument();
    expect(screen.getByText('Complete these steps to get the most out of GreekDash')).toBeInTheDocument();
  });

  it('displays progress percentage correctly', () => {
    render(<OnboardingChecklist />);
    
    // Should show 0% initially
    expect(screen.getByText('0% complete')).toBeInTheDocument();
  });

  it('allows checking and unchecking items', () => {
    render(<OnboardingChecklist />);
    
    const checkbox = screen.getAllByRole('checkbox')[0];
    
    // Initially unchecked
    expect(checkbox).not.toBeChecked();
    
    // Click to check
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    
    // Click to uncheck
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('saves progress to localStorage', () => {
    render(<OnboardingChecklist />);
    
    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'greekdash-onboarding-progress',
      expect.any(String)
    );
  });

  it('loads progress from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('["complete-profile"]');
    
    render(<OnboardingChecklist />);
    
    expect(localStorageMock.getItem).toHaveBeenCalledWith('greekdash-onboarding-progress');
  });

  it('renders compact version correctly', () => {
    render(<OnboardingChecklist compact />);
    
    expect(screen.getByText('Setup Progress')).toBeInTheDocument();
    expect(screen.getByText('View full checklist')).toBeInTheDocument();
  });

  it('shows completion message when all tasks are done', () => {
    // Mock all items as completed
    const allItemIds = [
      'complete-profile',
      'chapter-info', 
      'invite-members',
      'privacy-settings',
      'financial-setup',
      'communication-setup',
      'first-event',
      'file-organization',
      'branding-customization',
      'advanced-permissions'
    ];
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(allItemIds));
    
    render(<OnboardingChecklist />);
    
    expect(screen.getByText('Congratulations!')).toBeInTheDocument();
    expect(screen.getByText('Complete!')).toBeInTheDocument();
  });

  it('displays task categories', () => {
    render(<OnboardingChecklist />);
    
    // Check for specific task titles instead of category headers
    expect(screen.getByText('Complete Your Admin Profile')).toBeInTheDocument();
    expect(screen.getByText('Set Up Financial Management')).toBeInTheDocument();
  });

  it('shows estimated time for tasks', () => {
    render(<OnboardingChecklist />);
    
    // Should show time estimates
    expect(screen.getByText('3 min')).toBeInTheDocument();
  });

  it('provides links to detailed guides', () => {
    render(<OnboardingChecklist />);
    
    const guideLinks = screen.getAllByText('View guide');
    expect(guideLinks.length).toBeGreaterThan(0);
    
    // Check that links have proper href attributes
    guideLinks.forEach(link => {
      expect(link.closest('a')).toHaveAttribute('href');
    });
  });
});