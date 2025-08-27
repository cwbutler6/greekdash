'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  X,
  Filter,
  Search,
  Star,
  Users,
  DollarSign,
  Calendar,
  MessageSquare,
  Shield,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { featuresData, comparisonFeatures } from '@/lib/docs/features-data';
import { PlanTier } from '@/types/docs';

const planDetails = {
  FREE: {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for small chapters getting started',
    color: 'bg-gray-50 border-gray-200',
    badge: 'Most Popular',
    badgeVariant: 'secondary' as const
  },
  BASIC: {
    name: 'Basic',
    price: '$29',
    period: 'per month',
    description: 'Essential tools for growing chapters',
    color: 'bg-blue-50 border-blue-200',
    badge: 'Recommended',
    badgeVariant: 'default' as const
  },
  PRO: {
    name: 'Pro',
    price: '$79',
    period: 'per month',
    description: 'Advanced features for established chapters',
    color: 'bg-purple-50 border-purple-200',
    badge: 'Most Features',
    badgeVariant: 'outline' as const
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 'Custom',
    period: 'pricing',
    description: 'Tailored solutions for large organizations',
    color: 'bg-emerald-50 border-emerald-200',
    badge: 'Custom',
    badgeVariant: 'outline' as const
  }
};

const featureCategories = [
  {
    id: 'all',
    name: 'All Features',
    icon: <Star className="h-4 w-4" />
  },
  {
    id: 'members',
    name: 'Member Management',
    icon: <Users className="h-4 w-4" />
  },
  {
    id: 'finance',
    name: 'Financial Tools',
    icon: <DollarSign className="h-4 w-4" />
  },
  {
    id: 'events',
    name: 'Event Management',
    icon: <Calendar className="h-4 w-4" />
  },
  {
    id: 'communication',
    name: 'Communication',
    icon: <MessageSquare className="h-4 w-4" />
  },
  {
    id: 'analytics',
    name: 'Analytics & Reports',
    icon: <BarChart3 className="h-4 w-4" />
  },
  {
    id: 'security',
    name: 'Security & Compliance',
    icon: <Shield className="h-4 w-4" />
  }
];

export function FeatureMatrix() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPlan, setSelectedPlan] = useState<PlanTier | 'all'>('all');

  const filteredFeatures = comparisonFeatures.filter((feature) => {
    const matchesSearch = feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (feature.description && feature.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
                           (feature.category && feature.category === selectedCategory);
    
    const matchesPlan = selectedPlan === 'all' || 
                       feature.plans[selectedPlan as PlanTier];
    
    return matchesSearch && matchesCategory && matchesPlan;
  });

  const renderFeatureValue = (value: boolean | string | number) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="h-5 w-5 text-green-600" />
      ) : (
        <X className="h-5 w-5 text-gray-400" />
      );
    }
    return <span className="font-medium">{value}</span>;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Feature Comparison</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Compare features across all GreekDash plans to find the perfect fit for your chapter.
          Every plan includes our core chapter management tools.
        </p>
      </div>

      {/* Plan Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(planDetails).map(([planKey, plan]) => (
          <Card key={planKey} className={`relative ${plan.color} hover:shadow-lg transition-shadow`}>
            <CardHeader className="text-center">
              {plan.badge && (
                <Badge variant={plan.badgeVariant} className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  {plan.badge}
                </Badge>
              )}
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <div className="space-y-1">
                <div className="text-3xl font-bold">{plan.price}</div>
                <div className="text-sm text-muted-foreground">{plan.period}</div>
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription className="mb-4">{plan.description}</CardDescription>
              <Button asChild className="w-full">
                <Link href="/">
                  {planKey === 'FREE' ? 'Get Started' : planKey === 'ENTERPRISE' ? 'Contact Sales' : 'Start Trial'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Features</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search features..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {featureCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        {category.icon}
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Plan</label>
              <Select value={selectedPlan} onValueChange={(value) => setSelectedPlan(value as PlanTier | 'all')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="FREE">Free Plan</SelectItem>
                  <SelectItem value="BASIC">Basic Plan</SelectItem>
                  <SelectItem value="PRO">Pro Plan</SelectItem>
                  <SelectItem value="ENTERPRISE">Enterprise Plan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Comparison Table */}
      <Tabs defaultValue="table" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="table">Comparison Table</TabsTrigger>
          <TabsTrigger value="cards">Feature Cards</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold min-w-[250px]">Feature</th>
                      <th className="text-center p-4 font-semibold min-w-[100px]">Free</th>
                      <th className="text-center p-4 font-semibold min-w-[100px]">Basic</th>
                      <th className="text-center p-4 font-semibold min-w-[100px]">Pro</th>
                      <th className="text-center p-4 font-semibold min-w-[100px]">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFeatures.map((feature, index) => (
                      <tr key={feature.name} className={index % 2 === 0 ? 'bg-muted/20' : ''}>
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{feature.name}</div>
                            {feature.description && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {feature.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          {renderFeatureValue(feature.plans.FREE)}
                        </td>
                        <td className="p-4 text-center">
                          {renderFeatureValue(feature.plans.BASIC)}
                        </td>
                        <td className="p-4 text-center">
                          {renderFeatureValue(feature.plans.PRO)}
                        </td>
                        <td className="p-4 text-center">
                          {renderFeatureValue(feature.plans.ENTERPRISE)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuresData.map((feature) => (
              <Card key={feature.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {feature.icon}
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                    {feature.planRequired && (
                      <Badge variant={feature.planRequired === 'FREE' ? 'secondary' : feature.planRequired === 'PRO' ? 'default' : 'outline'}>
                        {feature.planRequired}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {feature.description}
                  </CardDescription>
                  {feature.ctaUrl && (
                    <Button variant="ghost" asChild className="p-0 h-auto font-medium">
                      <Link href={feature.ctaUrl} className="flex items-center gap-2">
                        {feature.ctaText || 'Learn more'}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold">Ready to Get Started?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your chapter&apos;s needs. You can always upgrade as you grow.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/docs/overview/pricing">
                View Detailed Pricing
                <DollarSign className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}