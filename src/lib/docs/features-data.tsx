import { FeatureItem } from '@/types/docs';
import { 
  Users, 
  CreditCard, 
  Calendar, 
  MessageSquare, 
  FileText, 
  Camera, 
  Shield, 
  BarChart3,
  Settings,
  Smartphone,
  Globe,
  Zap
} from 'lucide-react';

export const featuresData: FeatureItem[] = [
  {
    title: 'Member Management',
    description: 'Comprehensive member directory with profiles, roles, and lineage tracking. Manage invitations, approvals, and member lifecycle with ease.',
    icon: <Users className="h-6 w-6" />,
    screenshot: '/images/features/membership.svg',
    ctaText: 'Explore Member Tools',
    ctaUrl: '/docs/admin-guide/members',
    planRequired: 'FREE'
  },
  {
    title: 'Financial Management',
    description: 'Complete dues collection, expense tracking, and budget management. Integrated Stripe payments with automated receipts and financial reporting.',
    icon: <CreditCard className="h-6 w-6" />,
    screenshot: '/images/features/finances.svg',
    ctaText: 'Learn About Finance Tools',
    ctaUrl: '/docs/admin-guide/finance',
    planRequired: 'BASIC'
  },
  {
    title: 'Event Management',
    description: 'Create and manage chapter events with RSVP tracking, attendance management, and automated reminders for seamless event coordination.',
    icon: <Calendar className="h-6 w-6" />,
    screenshot: '/images/features/event-management.svg',
    ctaText: 'Discover Event Features',
    ctaUrl: '/docs/admin-guide/events',
    planRequired: 'FREE'
  },
  {
    title: 'Communication Tools',
    description: 'Broadcast messages via SMS and email to members. Create targeted campaigns, manage contact forms, and track engagement metrics.',
    icon: <MessageSquare className="h-6 w-6" />,
    screenshot: '/images/features/communication.svg',
    ctaText: 'View Communication Options',
    ctaUrl: '/docs/admin-guide/communication',
    planRequired: 'BASIC'
  },
  {
    title: 'File Management',
    description: 'Secure document storage and sharing with organized folder structures. Upload meeting minutes, bylaws, and important chapter documents.',
    icon: <FileText className="h-6 w-6" />,
    screenshot: '/images/features/files.svg',
    ctaText: 'Learn File Management',
    ctaUrl: '/docs/admin-guide/files',
    planRequired: 'FREE'
  },
  {
    title: 'Photo Gallery',
    description: 'Share chapter memories with organized photo galleries. Upload event photos, create albums, and manage chapter visual history.',
    icon: <Camera className="h-6 w-6" />,
    ctaText: 'Explore Gallery Features',
    ctaUrl: '/docs/admin-guide/gallery',
    planRequired: 'FREE'
  },
  {
    title: 'Advanced Analytics',
    description: 'Comprehensive reporting and analytics dashboard. Track member engagement, financial performance, and chapter growth metrics.',
    icon: <BarChart3 className="h-6 w-6" />,
    ctaText: 'View Analytics Features',
    ctaUrl: '/docs/admin-guide/analytics',
    planRequired: 'PRO'
  },
  {
    title: 'Security & Compliance',
    description: 'Enterprise-grade security with audit logging, role-based access control, and compliance reporting for chapter governance.',
    icon: <Shield className="h-6 w-6" />,
    ctaText: 'Learn About Security',
    ctaUrl: '/docs/security',
    planRequired: 'PRO'
  },
  {
    title: 'Chapter Customization',
    description: 'Brand your chapter portal with custom colors, logos, and themes. Create a unique experience that reflects your chapter identity.',
    icon: <Settings className="h-6 w-6" />,
    ctaText: 'Customize Your Chapter',
    ctaUrl: '/docs/admin-guide/settings',
    planRequired: 'BASIC'
  },
  {
    title: 'Mobile Optimization',
    description: 'Fully responsive design optimized for mobile devices. Members can access all features seamlessly from their smartphones and tablets.',
    icon: <Smartphone className="h-6 w-6" />,
    ctaText: 'See Mobile Features',
    ctaUrl: '/docs/features/mobile',
    planRequired: 'FREE'
  },
  {
    title: 'Public Chapter Pages',
    description: 'Professional public-facing pages for recruitment and donations. Showcase your chapter to prospective members and alumni.',
    icon: <Globe className="h-6 w-6" />,
    ctaText: 'Build Your Presence',
    ctaUrl: '/docs/admin-guide/public-pages',
    planRequired: 'FREE'
  },
  {
    title: 'Treasury & DeFi Integration',
    description: 'Advanced treasury management with DeFi integration for investment tracking and portfolio management. Monitor chapter investments in real-time.',
    icon: <Zap className="h-6 w-6" />,
    ctaText: 'Explore Treasury Tools',
    ctaUrl: '/docs/admin-guide/treasury',
    planRequired: 'PRO'
  }
];

export const comparisonFeatures = [
  // Core Limits
  {
    name: 'Active Members',
    description: 'Maximum number of active members',
    category: 'members',
    plans: {
      FREE: 25,
      BASIC: 100,
      PRO: 500,
      ENTERPRISE: 'Unlimited'
    }
  },
  {
    name: 'File Storage',
    description: 'Total file storage capacity',
    category: 'members',
    plans: {
      FREE: '1 GB',
      BASIC: '10 GB',
      PRO: '100 GB',
      ENTERPRISE: 'Unlimited'
    }
  },
  
  // Member Management
  {
    name: 'Member Directory',
    description: 'Comprehensive member profiles and directory',
    category: 'members',
    plans: {
      FREE: true,
      BASIC: true,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'Member Invitations',
    description: 'Send and manage member invitations',
    category: 'members',
    plans: {
      FREE: true,
      BASIC: true,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'Role Management',
    description: 'Assign and manage member roles and permissions',
    category: 'members',
    plans: {
      FREE: true,
      BASIC: true,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'Member Approval Workflow',
    description: 'Structured approval process for new members',
    category: 'members',
    plans: {
      FREE: true,
      BASIC: true,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'Lineage Tracking',
    description: 'Track member relationships and lineage',
    category: 'members',
    plans: {
      FREE: false,
      BASIC: true,
      PRO: true,
      ENTERPRISE: true
    }
  },
  
  // Event Management
  {
    name: 'Event Creation',
    description: 'Create and manage chapter events',
    category: 'events',
    plans: {
      FREE: true,
      BASIC: true,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'RSVP Management',
    description: 'Track event attendance and RSVPs',
    category: 'events',
    plans: {
      FREE: true,
      BASIC: true,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'Event Analytics',
    description: 'Detailed event attendance and engagement metrics',
    category: 'events',
    plans: {
      FREE: false,
      BASIC: false,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'Recurring Events',
    description: 'Set up recurring events and series',
    category: 'events',
    plans: {
      FREE: false,
      BASIC: true,
      PRO: true,
      ENTERPRISE: true
    }
  },
  
  // Communication
  {
    name: 'Email Notifications',
    description: 'Basic email notifications and messaging',
    category: 'communication',
    plans: {
      FREE: true,
      BASIC: true,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'SMS Messaging',
    description: 'Send SMS messages to members',
    category: 'communication',
    plans: {
      FREE: false,
      BASIC: true,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'Broadcast Campaigns',
    description: 'Send targeted messages to member groups',
    category: 'communication',
    plans: {
      FREE: false,
      BASIC: true,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'Communication Analytics',
    description: 'Track message delivery and engagement rates',
    category: 'communication',
    plans: {
      FREE: false,
      BASIC: false,
      PRO: true,
      ENTERPRISE: true
    }
  },
  
  // Financial Management
  {
    name: 'Dues Collection',
    description: 'Automated dues collection and payment processing',
    category: 'finance',
    plans: {
      FREE: false,
      BASIC: true,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'Expense Tracking',
    description: 'Track and categorize chapter expenses',
    category: 'finance',
    plans: {
      FREE: false,
      BASIC: true,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'Financial Reports',
    description: 'Generate financial statements and reports',
    category: 'finance',
    plans: {
      FREE: false,
      BASIC: true,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'Budget Management',
    description: 'Create and track chapter budgets',
    category: 'finance',
    plans: {
      FREE: false,
      BASIC: false,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'Treasury Management',
    description: 'Advanced treasury and investment tracking',
    category: 'finance',
    plans: {
      FREE: false,
      BASIC: false,
      PRO: true,
      ENTERPRISE: true
    }
  },
  
  // Analytics & Reports
  {
    name: 'Basic Analytics',
    description: 'Basic member and event analytics',
    category: 'analytics',
    plans: {
      FREE: true,
      BASIC: true,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'Advanced Analytics',
    description: 'Comprehensive analytics and insights',
    category: 'analytics',
    plans: {
      FREE: false,
      BASIC: false,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'Custom Reports',
    description: 'Create custom reports and dashboards',
    category: 'analytics',
    plans: {
      FREE: false,
      BASIC: false,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'Data Export',
    description: 'Export data in various formats',
    category: 'analytics',
    plans: {
      FREE: false,
      BASIC: true,
      PRO: true,
      ENTERPRISE: true
    }
  },
  
  // Security & Compliance
  {
    name: 'Basic Security',
    description: 'Standard security features and encryption',
    category: 'security',
    plans: {
      FREE: true,
      BASIC: true,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'Audit Logging',
    description: 'Comprehensive audit trails and logging',
    category: 'security',
    plans: {
      FREE: false,
      BASIC: false,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'Advanced Access Control',
    description: 'Granular permissions and access control',
    category: 'security',
    plans: {
      FREE: false,
      BASIC: false,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'Compliance Reporting',
    description: 'Generate compliance and governance reports',
    category: 'security',
    plans: {
      FREE: false,
      BASIC: false,
      PRO: true,
      ENTERPRISE: true
    }
  },
  
  // Customization & Branding
  {
    name: 'Custom Branding',
    description: 'Custom colors, logos, and chapter branding',
    category: 'customization',
    plans: {
      FREE: false,
      BASIC: true,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'Custom Domain',
    description: 'Use your own custom domain',
    category: 'customization',
    plans: {
      FREE: false,
      BASIC: false,
      PRO: true,
      ENTERPRISE: true
    }
  },
  
  // Support & Services
  {
    name: 'Community Support',
    description: 'Access to community forums and resources',
    category: 'support',
    plans: {
      FREE: true,
      BASIC: true,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'Email Support',
    description: 'Email support with response within 24 hours',
    category: 'support',
    plans: {
      FREE: false,
      BASIC: true,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'Priority Support',
    description: 'Priority support with faster response times',
    category: 'support',
    plans: {
      FREE: false,
      BASIC: false,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'Dedicated Account Manager',
    description: 'Personal account manager for your chapter',
    category: 'support',
    plans: {
      FREE: false,
      BASIC: false,
      PRO: false,
      ENTERPRISE: true
    }
  },
  
  // Integrations & API
  {
    name: 'Basic Integrations',
    description: 'Connect with popular third-party services',
    category: 'integrations',
    plans: {
      FREE: true,
      BASIC: true,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'API Access',
    description: 'Full API access for custom integrations',
    category: 'integrations',
    plans: {
      FREE: false,
      BASIC: false,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'Custom Integrations',
    description: 'Custom-built integrations for your needs',
    category: 'integrations',
    plans: {
      FREE: false,
      BASIC: false,
      PRO: false,
      ENTERPRISE: true
    }
  }
];