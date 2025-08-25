import { render, screen } from '@testing-library/react';
import { FeatureShowcase } from '@/components/docs/feature-showcase';
import { FeatureItem } from '@/types/docs';
import { Users } from 'lucide-react';

const mockFeatures: FeatureItem[] = [
  {
    title: 'Test Feature',
    description: 'This is a test feature description',
    icon: <Users className="h-6 w-6" />,
    ctaText: 'Learn More',
    ctaUrl: '/test',
    planRequired: 'FREE'
  }
];

describe('FeatureShowcase', () => {
  it('renders feature showcase with grid layout', () => {
    render(
      <FeatureShowcase 
        features={mockFeatures} 
        layout="grid" 
        showCTA={true} 
      />
    );
    
    expect(screen.getByText('Test Feature')).toBeInTheDocument();
    expect(screen.getByText('This is a test feature description')).toBeInTheDocument();
    expect(screen.getByText('Learn More')).toBeInTheDocument();
  });

  it('renders feature showcase with list layout', () => {
    render(
      <FeatureShowcase 
        features={mockFeatures} 
        layout="list" 
        showCTA={true} 
      />
    );
    
    expect(screen.getByText('Test Feature')).toBeInTheDocument();
  });

  it('renders feature showcase with cards layout', () => {
    render(
      <FeatureShowcase 
        features={mockFeatures} 
        layout="cards" 
        showCTA={true} 
      />
    );
    
    expect(screen.getByText('Test Feature')).toBeInTheDocument();
  });

  it('hides CTA when showCTA is false', () => {
    render(
      <FeatureShowcase 
        features={mockFeatures} 
        layout="grid" 
        showCTA={false} 
      />
    );
    
    expect(screen.queryByText('Learn More')).not.toBeInTheDocument();
  });
});