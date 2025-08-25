import { Metadata } from 'next';
import { FeatureShowcase } from '@/components/docs/feature-showcase';
import { FeatureComparison } from '@/components/docs/feature-comparison';
import { TrialSignupCTA, CTASection } from '@/components/docs/cta-components';
import { featuresData, comparisonFeatures } from '@/lib/docs/features-data';

export const metadata: Metadata = {
  title: 'Features Overview | GreekDash Documentation',
  description: 'Explore all the features available in GreekDash for comprehensive chapter management',
};

export default function FeaturesPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Features Overview</h1>
        <p className="text-xl text-muted-foreground">
          Discover the comprehensive suite of tools designed to streamline your chapter management 
          and enhance member engagement.
        </p>
      </div>

      {/* Feature Showcase */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Core Features</h2>
          <p className="text-muted-foreground">
            Everything you need to manage your chapter effectively, from member management 
            to financial tracking and event coordination.
          </p>
        </div>
        
        <FeatureShowcase 
          features={featuresData} 
          layout="cards"
          showCTA={true}
        />
      </section>

      {/* Feature Comparison */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Plan Comparison</h2>
          <p className="text-muted-foreground">
            Choose the plan that best fits your chapter&apos;s needs and budget. 
            All plans include our core features with additional capabilities as you grow.
          </p>
        </div>
        
        <FeatureComparison 
          features={comparisonFeatures}
          highlightPlan="PRO"
          showCTA={true}
        />
      </section>

      {/* CTA Section */}
      <CTASection>
        <TrialSignupCTA 
          title="Ready to transform your chapter management?"
          description="Join thousands of chapters already using GreekDash to streamline operations and enhance member engagement."
          buttonText="Start Your Free Trial"
        />
      </CTASection>
    </div>
  );
}