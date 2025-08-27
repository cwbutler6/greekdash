import Link from 'next/link';
import {
  ArrowRight,
  Star,
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  Award,
  Quote,
  CheckCircle,
  BarChart3,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const successStories = [
  {
    id: 'alpha-beta-gamma',
    chapterName: 'Alpha Beta Gamma',
    chapterType: 'Fraternity',
    university: 'State University',
    memberCount: 85,
    planType: 'PRO',
    testimonial: {
      quote: "GreekDash transformed how we operate. We went from spending 20+ hours a week on admin tasks to just 5 hours. The automated dues collection alone saved us countless headaches.",
      author: "Marcus Johnson",
      role: "Chapter President",
      avatar: "/images/testimonials/marcus-j.jpg"
    },
    metrics: {
      timeSaved: "15 hours/week",
      memberEngagement: "+35%",
      eventAttendance: "+28%",
      duesCollection: "98% on-time",
      costSavings: "$2,400/year"
    },
    challenges: [
      "Manual dues collection taking 8+ hours monthly",
      "Poor communication leading to low event attendance",
      "Disorganized member records and files",
      "Multiple software subscriptions costing $150/month"
    ],
    solutions: [
      "Automated Stripe integration for seamless dues collection",
      "SMS and email campaigns boosting communication reach",
      "Centralized member directory with complete profiles",
      "All-in-one platform replacing 5 separate tools"
    ],
    results: [
      "Reduced admin time from 20 to 5 hours per week",
      "Increased event attendance by 28%",
      "Achieved 98% on-time dues collection rate",
      "Saved $2,400 annually on software costs"
    ],
    featured: true
  },
  {
    id: 'delta-sigma-phi',
    chapterName: 'Delta Sigma Phi',
    chapterType: 'Sorority',
    university: 'Tech University',
    memberCount: 120,
    planType: 'PRO',
    testimonial: {
      quote: "The financial transparency GreekDash provides has completely changed our relationship with our members. Everyone can see exactly where their dues go, and trust has never been higher.",
      author: "Sarah Chen",
      role: "Treasurer",
      avatar: "/images/testimonials/sarah-c.jpg"
    },
    metrics: {
      timeSaved: "12 hours/week",
      memberEngagement: "+42%",
      eventAttendance: "+31%",
      duesCollection: "95% on-time",
      costSavings: "$1,800/year"
    },
    challenges: [
      "Members questioning financial transparency",
      "Complex event planning and coordination",
      "Difficulty tracking member engagement",
      "Time-consuming manual reporting processes"
    ],
    solutions: [
      "Real-time financial dashboards for full transparency",
      "Streamlined event management with RSVP tracking",
      "Advanced analytics showing member participation",
      "Automated report generation and distribution"
    ],
    results: [
      "Improved member trust through financial transparency",
      "Streamlined event planning saving 6 hours per event",
      "Increased member engagement by 42%",
      "Automated reporting saving 8 hours monthly"
    ],
    featured: true
  },
  {
    id: 'gamma-phi-beta',
    chapterName: 'Gamma Phi Beta',
    chapterType: 'Sorority',
    university: 'Community College',
    memberCount: 35,
    planType: 'BASIC',
    testimonial: {
      quote: "As a smaller chapter, we needed something affordable but powerful. GreekDash's Basic plan gave us everything we needed to professionalize our operations without breaking the budget.",
      author: "Emily Rodriguez",
      role: "Vice President",
      avatar: "/images/testimonials/emily-r.jpg"
    },
    metrics: {
      timeSaved: "8 hours/week",
      memberEngagement: "+25%",
      eventAttendance: "+22%",
      duesCollection: "92% on-time",
      costSavings: "$960/year"
    },
    challenges: [
      "Limited budget for chapter management tools",
      "Manual processes taking too much time",
      "Difficulty maintaining professional appearance",
      "Poor member communication and engagement"
    ],
    solutions: [
      "Affordable Basic plan with essential features",
      "Automated dues collection and member management",
      "Professional chapter branding and public pages",
      "Integrated communication tools for better outreach"
    ],
    results: [
      "Reduced admin workload by 8 hours weekly",
      "Professional appearance attracting new members",
      "Improved communication increasing engagement by 25%",
      "Streamlined operations within tight budget"
    ],
    featured: false
  },
  {
    id: 'kappa-alpha-theta',
    chapterName: 'Kappa Alpha Theta',
    chapterType: 'Sorority',
    university: 'Private University',
    memberCount: 200,
    planType: 'ENTERPRISE',
    testimonial: {
      quote: "Managing 200+ members across multiple programs was a nightmare before GreekDash. Now we have complete visibility and control over all our operations. The custom integrations were game-changing.",
      author: "Alexandra Thompson",
      role: "Chapter Advisor",
      avatar: "/images/testimonials/alexandra-t.jpg"
    },
    metrics: {
      timeSaved: "25 hours/week",
      memberEngagement: "+38%",
      eventAttendance: "+33%",
      duesCollection: "99% on-time",
      costSavings: "$4,800/year"
    },
    challenges: [
      "Managing large membership across multiple programs",
      "Complex financial tracking and reporting needs",
      "Need for custom integrations with university systems",
      "Coordinating multiple admin roles and permissions"
    ],
    solutions: [
      "Enterprise-grade member management for 200+ members",
      "Advanced financial tools with custom reporting",
      "Custom integrations with university student systems",
      "Granular role-based access control for admin team"
    ],
    results: [
      "Streamlined management of 200+ member chapter",
      "Custom integrations saving 15 hours weekly",
      "99% dues collection rate with automated reminders",
      "Improved coordination across admin team"
    ],
    featured: true
  }
];

const industryStats = [
  {
    metric: "500+",
    label: "Active Chapters",
    description: "Chapters successfully using GreekDash",
    icon: <Users className="h-6 w-6" />
  },
  {
    metric: "50,000+",
    label: "Members Managed",
    description: "Individual members across all chapters",
    icon: <TrendingUp className="h-6 w-6" />
  },
  {
    metric: "$2M+",
    label: "Dues Processed",
    description: "Total dues collected through the platform",
    icon: <DollarSign className="h-6 w-6" />
  },
  {
    metric: "12 hrs",
    label: "Average Time Saved",
    description: "Weekly time savings per chapter",
    icon: <Clock className="h-6 w-6" />
  }
];

const commonBenefits = [
  {
    title: "Significant Time Savings",
    description: "Chapters save 8-25 hours per week on administrative tasks",
    icon: <Clock className="h-5 w-5" />,
    stats: "Average 12 hours/week saved"
  },
  {
    title: "Improved Member Engagement",
    description: "Better communication tools lead to higher participation rates",
    icon: <Users className="h-5 w-5" />,
    stats: "25-42% engagement increase"
  },
  {
    title: "Higher Event Attendance",
    description: "Streamlined event management and communication boost attendance",
    icon: <Calendar className="h-5 w-5" />,
    stats: "22-33% attendance improvement"
  },
  {
    title: "Better Financial Management",
    description: "Automated dues collection and transparent reporting",
    icon: <DollarSign className="h-5 w-5" />,
    stats: "92-99% on-time collection"
  },
  {
    title: "Cost Consolidation",
    description: "Replace multiple tools with one comprehensive platform",
    icon: <BarChart3 className="h-5 w-5" />,
    stats: "$960-$4,800 annual savings"
  },
  {
    title: "Professional Appearance",
    description: "Custom branding and professional tools enhance chapter image",
    icon: <Award className="h-5 w-5" />,
    stats: "Improved recruitment success"
  }
];

const useCases = [
  {
    title: "Small Chapters (25-50 members)",
    description: "Focus on essential features with affordable pricing",
    plan: "Basic Plan",
    features: ["Member management", "Event planning", "Basic communication", "Dues collection"],
    benefits: ["Professional appearance", "Time savings", "Budget-friendly", "Easy setup"]
  },
  {
    title: "Medium Chapters (50-150 members)",
    description: "Advanced features for growing chapters with complex needs",
    plan: "Pro Plan",
    features: ["Advanced analytics", "Treasury management", "Custom branding", "API access"],
    benefits: ["Comprehensive insights", "Financial control", "Custom integrations", "Priority support"]
  },
  {
    title: "Large Chapters (150+ members)",
    description: "Enterprise solutions for complex multi-program operations",
    plan: "Enterprise Plan",
    features: ["Multi-chapter management", "Custom integrations", "Dedicated support", "Advanced security"],
    benefits: ["Scalable solutions", "Custom development", "Dedicated account manager", "SLA guarantees"]
  }
];

export function SuccessStories() {
  const featuredStories = successStories.filter(story => story.featured);


  return (
    <div className="space-y-16">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Success Stories</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          See how chapters across the country are transforming their operations with GreekDash.
          Real stories, real results, real impact.
        </p>
      </div>

      {/* Industry Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {industryStats.map((stat) => (
          <Card key={stat.label} className="text-center hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-center mb-2">
                <div className="p-3 bg-primary/10 rounded-lg">
                  {stat.icon}
                </div>
              </div>
              <div className="text-3xl font-bold text-primary">{stat.metric}</div>
              <CardTitle className="text-lg">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{stat.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Featured Success Stories */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-semibold">Featured Success Stories</h2>
          <p className="text-muted-foreground">In-depth case studies from chapters that transformed with GreekDash</p>
        </div>

        <div className="space-y-12">
          {featuredStories.map((story) => (
            <Card key={story.id} className="overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Story Content */}
                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{story.chapterType}</Badge>
                      <Badge variant="secondary">{story.planType} Plan</Badge>
                    </div>
                    <h3 className="text-2xl font-bold">{story.chapterName}</h3>
                    <p className="text-muted-foreground">{story.university} • {story.memberCount} members</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Quote className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                      <blockquote className="text-lg italic">
                        &quot;{story.testimonial.quote}&quot;
                      </blockquote>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={story.testimonial.avatar} alt={story.testimonial.author} />
                        <AvatarFallback>
                          {story.testimonial.author.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{story.testimonial.author}</div>
                        <div className="text-sm text-muted-foreground">{story.testimonial.role}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="bg-muted/20 p-8">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Key Results
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{story.metrics.timeSaved}</div>
                      <div className="text-sm text-muted-foreground">Time Saved</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{story.metrics.memberEngagement}</div>
                      <div className="text-sm text-muted-foreground">Engagement</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{story.metrics.eventAttendance}</div>
                      <div className="text-sm text-muted-foreground">Attendance</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{story.metrics.duesCollection}</div>
                      <div className="text-sm text-muted-foreground">Dues Collection</div>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <div className="text-xl font-bold text-green-600">{story.metrics.costSavings}</div>
                    <div className="text-sm text-muted-foreground">Annual Savings</div>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="border-t p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <h4 className="font-semibold mb-3 text-red-600">Challenges</h4>
                    <ul className="space-y-2">
                      {story.challenges.map((challenge, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-red-500 mt-1">•</span>
                          <span>{challenge}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 text-blue-600">Solutions</h4>
                    <ul className="space-y-2">
                      {story.solutions.map((solution, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span>{solution}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 text-green-600">Results</h4>
                    <ul className="space-y-2">
                      {story.results.map((result, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{result}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Common Benefits */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-semibold">Common Benefits</h2>
          <p className="text-muted-foreground">Consistent improvements chapters see with GreekDash</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {commonBenefits.map((benefit) => (
            <Card key={benefit.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {benefit.icon}
                  </div>
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-3">{benefit.description}</CardDescription>
                <Badge variant="secondary" className="text-xs">
                  {benefit.stats}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Use Cases */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-semibold">Success by Chapter Size</h2>
          <p className="text-muted-foreground">How different sized chapters benefit from GreekDash</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {useCases.map((useCase) => (
            <Card key={useCase.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{useCase.title}</CardTitle>
                <CardDescription>{useCase.description}</CardDescription>
                <Badge variant="outline" className="w-fit">{useCase.plan}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Key Features</h4>
                  <ul className="space-y-1">
                    {useCase.features.map((feature) => (
                      <li key={feature} className="text-sm flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm mb-2">Benefits</h4>
                  <ul className="space-y-1">
                    {useCase.benefits.map((benefit) => (
                      <li key={benefit} className="text-sm flex items-center gap-2">
                        <Star className="h-3 w-3 text-primary" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold">Ready to Write Your Success Story?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join hundreds of chapters already transforming their operations with GreekDash.
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
              <Link href="/docs/overview/roi-calculator">
                Calculate Your ROI
                <BarChart3 className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto mt-8">
            <div className="text-center">
              <div className="text-lg font-semibold">Free Trial</div>
              <div className="text-sm text-muted-foreground">14 days, full access</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">Setup Support</div>
              <div className="text-sm text-muted-foreground">Guided onboarding</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">Proven Results</div>
              <div className="text-sm text-muted-foreground">500+ successful chapters</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}