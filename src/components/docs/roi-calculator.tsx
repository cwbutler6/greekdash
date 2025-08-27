'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Calculator,
  TrendingUp,
  DollarSign,
  Clock,
  Users,
  Calendar,
  MessageSquare,
  BarChart3,
  Download,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface ROIInputs {
  memberCount: number;
  currentAdminHours: number;
  hourlyRate: number;
  eventsPerMonth: number;
  communicationFrequency: number;
  currentSoftwareCosts: number;
  planType: 'BASIC' | 'PRO' | 'ENTERPRISE';
}

interface ROIResults {
  timeSavings: {
    hoursPerMonth: number;
    dollarValue: number;
    annualValue: number;
  };
  costSavings: {
    softwareConsolidation: number;
    reducedManualWork: number;
    annualValue: number;
  };
  efficiencyGains: {
    memberEngagement: number;
    eventAttendance: number;
    communicationReach: number;
  };
  totalROI: {
    monthlySavings: number;
    annualSavings: number;
    planCost: number;
    netSavings: number;
    roiPercentage: number;
    paybackPeriod: number;
  };
}

const planPricing = {
  BASIC: 29,
  PRO: 79,
  ENTERPRISE: 150 // Estimated for calculation
};

const defaultInputs: ROIInputs = {
  memberCount: 50,
  currentAdminHours: 15,
  hourlyRate: 25,
  eventsPerMonth: 4,
  communicationFrequency: 8,
  currentSoftwareCosts: 50,
  planType: 'BASIC'
};

export function ROICalculator() {
  const [inputs, setInputs] = useState<ROIInputs>(defaultInputs);
  const [results, setResults] = useState<ROIResults | null>(null);

  const calculateROI = (inputs: ROIInputs): ROIResults => {
    // Time savings calculations
    const baseTimeSavings = Math.min(inputs.currentAdminHours * 0.6, 12); // Up to 60% time savings, max 12 hours
    const memberScaleFactor = Math.log(inputs.memberCount / 25 + 1) * 0.3; // Logarithmic scaling
    const eventTimeSavings = inputs.eventsPerMonth * 0.5; // 30 minutes saved per event
    const communicationTimeSavings = inputs.communicationFrequency * 0.25; // 15 minutes saved per communication
    
    const totalHoursSaved = baseTimeSavings + memberScaleFactor + eventTimeSavings + communicationTimeSavings;
    const timeSavingsDollarValue = totalHoursSaved * inputs.hourlyRate;

    // Cost savings calculations
    const softwareConsolidation = inputs.currentSoftwareCosts * 0.7; // Assume 70% of current costs can be consolidated
    const reducedManualWork = timeSavingsDollarValue * 0.3; // 30% of time savings translates to cost reduction
    
    // Efficiency gains (percentage improvements)
    const memberEngagement = Math.min(25 + (inputs.memberCount / 10), 40); // 25-40% improvement
    const eventAttendance = Math.min(20 + (inputs.eventsPerMonth * 2), 35); // 20-35% improvement
    const communicationReach = Math.min(30 + (inputs.communicationFrequency), 50); // 30-50% improvement

    // Total ROI calculations
    const monthlySavings = timeSavingsDollarValue + softwareConsolidation + reducedManualWork;
    const annualSavings = monthlySavings * 12;
    const planCost = planPricing[inputs.planType];
    const annualPlanCost = planCost * 12;
    const netSavings = annualSavings - annualPlanCost;
    const roiPercentage = (netSavings / annualPlanCost) * 100;
    const paybackPeriod = annualPlanCost / monthlySavings;

    return {
      timeSavings: {
        hoursPerMonth: totalHoursSaved,
        dollarValue: timeSavingsDollarValue,
        annualValue: timeSavingsDollarValue * 12
      },
      costSavings: {
        softwareConsolidation,
        reducedManualWork,
        annualValue: (softwareConsolidation + reducedManualWork) * 12
      },
      efficiencyGains: {
        memberEngagement,
        eventAttendance,
        communicationReach
      },
      totalROI: {
        monthlySavings,
        annualSavings,
        planCost,
        netSavings,
        roiPercentage,
        paybackPeriod
      }
    };
  };

  useEffect(() => {
    setResults(calculateROI(inputs));
  }, [inputs]);

  const updateInput = (key: keyof ROIInputs, value: number | string) => {
    setInputs(prev => ({
      ...prev,
      [key]: typeof value === 'string' ? value : value
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">ROI Calculator</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Calculate your potential return on investment with GreekDash. 
          See how much time and money your chapter can save with our platform.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Chapter Information
              </CardTitle>
              <CardDescription>
                Tell us about your chapter to get personalized ROI calculations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="memberCount">Number of Active Members</Label>
                <div className="space-y-2">
                  <Slider
                    value={[inputs.memberCount]}
                    onValueChange={(value) => updateInput('memberCount', value[0])}
                    max={500}
                    min={10}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>10</span>
                    <span className="font-medium">{inputs.memberCount} members</span>
                    <span>500+</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentAdminHours">Current Admin Hours per Week</Label>
                <div className="space-y-2">
                  <Slider
                    value={[inputs.currentAdminHours]}
                    onValueChange={(value) => updateInput('currentAdminHours', value[0])}
                    max={40}
                    min={5}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>5 hrs</span>
                    <span className="font-medium">{inputs.currentAdminHours} hours/week</span>
                    <span>40+ hrs</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Admin Time Value ($/hour)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  value={inputs.hourlyRate}
                  onChange={(e) => updateInput('hourlyRate', parseInt(e.target.value) || 0)}
                  placeholder="25"
                />
                <p className="text-sm text-muted-foreground">
                  What&apos;s the value of admin time? Consider opportunity cost or actual wages.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventsPerMonth">Events per Month</Label>
                <div className="space-y-2">
                  <Slider
                    value={[inputs.eventsPerMonth]}
                    onValueChange={(value) => updateInput('eventsPerMonth', value[0])}
                    max={20}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>1</span>
                    <span className="font-medium">{inputs.eventsPerMonth} events/month</span>
                    <span>20+</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="communicationFrequency">Communications per Month</Label>
                <div className="space-y-2">
                  <Slider
                    value={[inputs.communicationFrequency]}
                    onValueChange={(value) => updateInput('communicationFrequency', value[0])}
                    max={30}
                    min={2}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>2</span>
                    <span className="font-medium">{inputs.communicationFrequency} messages/month</span>
                    <span>30+</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentSoftwareCosts">Current Software Costs ($/month)</Label>
                <Input
                  id="currentSoftwareCosts"
                  type="number"
                  value={inputs.currentSoftwareCosts}
                  onChange={(e) => updateInput('currentSoftwareCosts', parseInt(e.target.value) || 0)}
                  placeholder="50"
                />
                <p className="text-sm text-muted-foreground">
                  Total monthly cost for current tools (email, payment processing, etc.)
                </p>
              </div>

              <div className="space-y-2">
                <Label>GreekDash Plan</Label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(planPricing).map(([plan, price]) => (
                    <Button
                      key={plan}
                      variant={inputs.planType === plan ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateInput('planType', plan)}
                      className="text-xs"
                    >
                      {plan}
                      <br />
                      ${price}/mo
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {results && (
            <>
              {/* Summary Card */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    ROI Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {formatCurrency(results.totalROI.netSavings)}
                      </div>
                      <div className="text-sm text-muted-foreground">Annual Net Savings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {formatPercentage(results.totalROI.roiPercentage)}
                      </div>
                      <div className="text-sm text-muted-foreground">ROI</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      Payback Period: {results.totalROI.paybackPeriod.toFixed(1)} months
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Time Savings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Time Savings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Hours saved per month</span>
                      <Badge variant="secondary">
                        {results.timeSavings.hoursPerMonth.toFixed(1)} hours
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Monthly value</span>
                      <span className="font-semibold">
                        {formatCurrency(results.timeSavings.dollarValue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Annual value</span>
                      <span className="font-semibold text-primary">
                        {formatCurrency(results.timeSavings.annualValue)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cost Savings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Cost Savings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Software consolidation</span>
                      <span className="font-semibold">
                        {formatCurrency(results.costSavings.softwareConsolidation)}/mo
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Reduced manual work</span>
                      <span className="font-semibold">
                        {formatCurrency(results.costSavings.reducedManualWork)}/mo
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span>Total annual savings</span>
                      <span className="font-semibold text-primary">
                        {formatCurrency(results.costSavings.annualValue)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Efficiency Gains */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Efficiency Improvements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Member engagement
                      </span>
                      <Badge variant="outline">
                        +{formatPercentage(results.efficiencyGains.memberEngagement)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Event attendance
                      </span>
                      <Badge variant="outline">
                        +{formatPercentage(results.efficiencyGains.eventAttendance)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Communication reach
                      </span>
                      <Badge variant="outline">
                        +{formatPercentage(results.efficiencyGains.communicationReach)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download Report
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Results
                  </Button>
                </div>
                <Button asChild className="w-full" size="lg">
                  <Link href="/">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Methodology */}
      <Card>
        <CardHeader>
          <CardTitle>Calculation Methodology</CardTitle>
          <CardDescription>
            How we calculate your potential ROI with GreekDash
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Time Savings</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Automated dues collection saves 2-4 hours/month</li>
                <li>• Streamlined event management saves 30 min/event</li>
                <li>• Efficient communication saves 15 min/message</li>
                <li>• Automated member onboarding saves 1-2 hours/member</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Cost Savings</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Consolidate multiple software subscriptions</li>
                <li>• Reduce manual processing costs</li>
                <li>• Eliminate paper-based processes</li>
                <li>• Reduce administrative overhead</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Efficiency Gains</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Better communication increases engagement</li>
                <li>• Streamlined events boost attendance</li>
                <li>• Professional appearance attracts members</li>
                <li>• Data insights improve decision making</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Conservative Estimates</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Based on real customer data</li>
                <li>• Conservative improvement percentages</li>
                <li>• Accounts for learning curve</li>
                <li>• Excludes hard-to-quantify benefits</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold">Ready to Start Saving?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join hundreds of chapters already saving time and money with GreekDash.
              Start your free trial today and see the results for yourself.
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
                View Pricing Plans
                <DollarSign className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}