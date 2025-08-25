import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, MessageCircle, Rocket, Users, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface CTAButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  external?: boolean;
}

export function CTAButton({ 
  href, 
  children, 
  variant = 'default', 
  size = 'default',
  className,
  external = false
}: CTAButtonProps) {
  const buttonContent = (
    <Button variant={variant} size={size} className={cn('group', className)}>
      {children}
      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
    </Button>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {buttonContent}
      </a>
    );
  }

  return (
    <Link href={href}>
      {buttonContent}
    </Link>
  );
}

interface TrialSignupCTAProps {
  title?: string;
  description?: string;
  buttonText?: string;
  className?: string;
}

export function TrialSignupCTA({ 
  title = "Ready to get started?",
  description = "Start your free trial today and see how GreekDash can transform your chapter management.",
  buttonText = "Start Free Trial",
  className
}: TrialSignupCTAProps) {
  return (
    <Card className={cn('bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200', className)}>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
          <Rocket className="h-6 w-6 text-emerald-600" />
        </div>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <CTAButton href="/signup" size="lg" className="bg-emerald-600 hover:bg-emerald-700">
            {buttonText}
          </CTAButton>
          <CTAButton href="/contact" variant="outline" size="lg">
            <MessageCircle className="mr-2 h-4 w-4" />
            Contact Sales
          </CTAButton>
        </div>
        <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            No setup fees
          </div>
          <div className="flex items-center">
            <CreditCard className="h-4 w-4 mr-1" />
            No credit card required
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ContactCTAProps {
  title?: string;
  description?: string;
  buttonText?: string;
  className?: string;
}

export function ContactCTA({ 
  title = "Need help getting started?",
  description = "Our team is here to help you set up your chapter and make the most of GreekDash.",
  buttonText = "Contact Support",
  className
}: ContactCTAProps) {
  return (
    <Card className={cn('bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200', className)}>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <MessageCircle className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <CTAButton href="/contact" variant="outline" size="lg" className="border-blue-300 hover:bg-blue-50">
          {buttonText}
        </CTAButton>
      </CardContent>
    </Card>
  );
}

interface FeatureCTAProps {
  title: string;
  description: string;
  features: string[];
  ctaText: string;
  ctaHref: string;
  badge?: string;
  className?: string;
}

export function FeatureCTA({ 
  title, 
  description, 
  features, 
  ctaText, 
  ctaHref,
  badge,
  className
}: FeatureCTAProps) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      {badge && (
        <div className="absolute top-4 right-4">
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
            {badge}
          </Badge>
        </div>
      )}
      
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
        
        <CTAButton href={ctaHref} className="w-full">
          {ctaText}
        </CTAButton>
      </CardContent>
    </Card>
  );
}

interface CTASectionProps {
  children: React.ReactNode;
  className?: string;
}

export function CTASection({ children, className }: CTASectionProps) {
  return (
    <section className={cn('py-12 px-4', className)}>
      <div className="max-w-4xl mx-auto">
        {children}
      </div>
    </section>
  );
}