import { Metadata } from 'next';
import { FeatureShowcase } from '@/components/docs/feature-showcase';
import { FeatureComparison } from '@/components/docs/feature-comparison';
import { TrialSignupCTA, ContactCTA, FeatureCTA, CTASection } from '@/components/docs/cta-components';
import { featuresData, comparisonFeatures } from '@/lib/docs/features-data';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Feature Showcase | GreekDash Documentation',
  description: 'Interactive showcase of GreekDash features with live examples and comparisons',
};

export default function FeatureShowcasePage() {
  // Get a subset of features for different layouts
  const coreFeatures = featuresData.slice(0, 6);
  const advancedFeatures = featuresData.slice(6);

  return (
    <div className="space-y-16">
      {/* Header */}
      <div className="text-center space-y-4">
        <Badge variant="secondary" className="mb-4">
          Interactive Demo
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight">
          Feature Showcase
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Explore GreekDash&apos;s comprehensive feature set through interactive examples, 
          detailed comparisons, and real-world use cases.
        </p>
      </div>

      {/* Grid Layout Demo */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-semibold">Core Features</h2>
          <p className="text-muted-foreground">
            Essential tools every chapter needs, displayed in a clean grid layout
          </p>
        </div>
        
        <FeatureShowcase 
          features={coreFeatures} 
          layout="grid"
          showCTA={true}
        />
      </section>

      <Separator />

      {/* List Layout Demo */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-semibold">Advanced Features</h2>
          <p className="text-muted-foreground">
            Professional-grade tools for growing chapters, shown in detailed list format
          </p>
        </div>
        
        <FeatureShowcase 
          features={advancedFeatures} 
          layout="list"
          showCTA={true}
        />
      </section>

      <Separator />

      {/* Cards Layout Demo */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-semibold">Featured Highlights</h2>
          <p className="text-muted-foreground">
            Our most popular features presented in an engaging card format
          </p>
        </div>
        
        <FeatureShowcase 
          features={featuresData.slice(0, 4)} 
          layout="cards"
          showCTA={true}
        />
      </section>

      <Separator />

      {/* Individual CTA Components Demo */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-semibold">Call-to-Action Examples</h2>
          <p className="text-muted-foreground">
            Various CTA styles to encourage user engagement and conversion
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <FeatureCTA
            title="Member Management Made Easy"
            description="Streamline your member directory, track lineage, and manage roles with our intuitive interface."
            features={[
              "Comprehensive member profiles",
              "Role-based access control", 
              "Lineage tracking and visualization",
              "Automated invitation system"
            ]}
            ctaText="Explore Member Tools"
            ctaHref="/docs/admin-guide/members"
            badge="Most Popular"
          />

          <FeatureCTA
            title="Financial Management Suite"
            description="Complete dues collection, expense tracking, and financial reporting in one integrated platform."
            features={[
              "Automated dues collection",
              "Expense tracking and budgets",
              "Stripe payment integration",
              "Financial reporting dashboard"
            ]}
            ctaText="Learn About Finance"
            ctaHref="/docs/admin-guide/finance"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ContactCTA />
          <ContactCTA 
            title="Enterprise Solutions"
            description="Need custom features or dedicated support? Our enterprise team can help scale GreekDash for your organization."
            buttonText="Contact Enterprise Sales"
          />
        </div>
      </section>

      <Separator />

      {/* Plan Comparison */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-semibold">Choose Your Plan</h2>
          <p className="text-muted-foreground">
            Comprehensive feature comparison across all subscription tiers
          </p>
        </div>
        
        <FeatureComparison 
          features={comparisonFeatures}
          highlightPlan="PRO"
          showCTA={true}
        />
      </section>

      {/* Final CTA */}
      <CTASection>
        <TrialSignupCTA 
          title="Experience the difference GreekDash makes"
          description="Join over 1,000 chapters who have transformed their operations with our comprehensive management platform."
          buttonText="Start Your 14-Day Free Trial"
        />
      </CTASection>
    </div>
  );
}