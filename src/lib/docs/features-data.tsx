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
  {
    name: 'Active Members',
    description: 'Maximum number of active members',
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
    plans: {
      FREE: '1 GB',
      BASIC: '10 GB',
      PRO: '100 GB',
      ENTERPRISE: 'Unlimited'
    }
  },
  {
    name: 'Member Directory',
    plans: {
      FREE: true,
      BASIC: true,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'Event Management',
    plans: {
      FREE: true,
      BASIC: true,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'Basic Communication',
    description: 'Email notifications and basic messaging',
    plans: {
      FREE: true,
      BASIC: true,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'Dues Collection',
    plans: {
      FREE: false,
      BASIC: true,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'SMS Messaging',
    plans: {
      FREE: false,
      BASIC: true,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'Advanced Analytics',
    plans: {
      FREE: false,
      BASIC: false,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'Treasury Management',
    plans: {
      FREE: false,
      BASIC: false,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'Custom Branding',
    plans: {
      FREE: false,
      BASIC: true,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'API Access',
    plans: {
      FREE: false,
      BASIC: false,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'Priority Support',
    plans: {
      FREE: false,
      BASIC: false,
      PRO: true,
      ENTERPRISE: true
    }
  },
  {
    name: 'Dedicated Account Manager',
    plans: {
      FREE: false,
      BASIC: false,
      PRO: false,
      ENTERPRISE: true
    }
  },
  {
    name: 'Custom Integrations',
    plans: {
      FREE: false,
      BASIC: false,
      PRO: false,
      ENTERPRISE: true
    }
  }
];