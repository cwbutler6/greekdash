import { ReactNode } from 'react';

// Navigation types
export interface NavigationItem {
  title: string;
  href: string;
  icon?: ReactNode;
  badge?: string;
  children?: NavigationItem[];
}

export interface NavigationSection {
  title: string;
  icon?: ReactNode;
  items: NavigationItem[];
}

export interface NavigationConfig {
  sections: NavigationSection[];
  footer: FooterSection[];
  quickLinks: QuickLink[];
}

export interface QuickLink {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
}

export interface FooterSection {
  title: string;
  items: {
    title: string;
    href: string;
  }[];
}

// Breadcrumb types
export interface BreadcrumbItem {
  title: string;
  href: string;
}

// Table of contents types
export interface TOCItem {
  id: string;
  title: string;
  level: number;
  children?: TOCItem[];
}

// Documentation page types
export interface DocumentationPage {
  slug: string;
  title: string;
  description: string;
  content: string;
  lastUpdated: Date;
  author?: string;
  tags: string[];
  section: string;
  subsection?: string;
  tableOfContents: TOCItem[];
  relatedPages: string[];
  prerequisites?: string[];
  planRequired?: PlanTier;
}

export type PlanTier = 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';

// Feature showcase types
export interface FeatureItem {
  title: string;
  description: string;
  icon: ReactNode;
  screenshot?: string;
  videoUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  planRequired?: PlanTier;
}

export interface FeatureShowcaseProps {
  features: FeatureItem[];
  layout: 'grid' | 'list' | 'cards';
  showCTA?: boolean;
}

// Step-by-step guide types
export interface GuideStep {
  title: string;
  description: string;
  screenshot?: string;
  code?: string;
  tips?: string[];
  warnings?: string[];
}

export interface StepGuideProps {
  steps: GuideStep[];
  title: string;
  description?: string;
  prerequisites?: string[];
}

// Search types
export interface SearchResult {
  title: string;
  excerpt: string;
  url: string;
  section: string;
  type: 'guide' | 'feature' | 'api';
}

export interface SearchProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  results?: SearchResult[];
  isLoading?: boolean;
}

export interface SearchIndex {
  pages: SearchIndexPage[];
  terms: SearchTerm[];
}

export interface SearchIndexPage {
  slug: string;
  title: string;
  content: string;
  section: string;
  tags: string[];
  weight: number; // For relevance scoring
}

export interface SearchTerm {
  term: string;
  pages: string[]; // Page slugs containing this term
  frequency: number;
}

// Video tutorial types
export interface RelatedLink {
  title: string;
  url: string;
  type: 'internal' | 'external';
}

export interface VideoTutorialProps {
  videoId: string;
  title: string;
  description?: string;
  transcript?: string;
  relatedLinks?: RelatedLink[];
}

// Layout component props
export interface DocsLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  tableOfContents?: TOCItem[];
}

export interface DocsSidebarProps {
  currentPath: string;
  sections: NavigationSection[];
  isOpen: boolean;
  onToggle: () => void;
}

// Content page props
export interface DocsContentPageProps {
  title: string;
  description: string;
  section: string;
  subsection?: string;
  children?: ReactNode;
}

// Error handling types
export interface DocumentationErrorHandler {
  handleMissingPage: (slug: string) => ReactNode;
  handleSearchFailure: () => ReactNode;
  handleVideoFailure: (videoId: string) => ReactNode;
  handleNavigationFailure: () => ReactNode;
}

// Analytics and feedback types
export interface DocumentationFeedback {
  id: string;
  pageSlug: string;
  userId?: string;
  rating: number; // 1-5 stars
  comment?: string;
  helpful: boolean;
  createdAt: Date;
}

export interface DocumentationAnalytics {
  id: string;
  pageSlug: string;
  views: number;
  uniqueViews: number;
  averageTimeOnPage: number;
  bounceRate: number;
  searchQueries: string[];
  date: Date;
}

// Testing types
export interface DocumentationTestSuite {
  contentValidation: {
    mdxParsing: boolean;
    linkValidation: boolean;
    imageOptimization: boolean;
    searchIndexing: boolean;
  };
  
  componentTesting: {
    unitTests: boolean;
    integrationTests: boolean;
    accessibilityTests: boolean;
    performanceTests: boolean;
  };
  
  e2eValidation: {
    userJourneys: boolean;
    crossBrowserTesting: boolean;
    mobileResponsiveness: boolean;
    searchFunctionality: boolean;
  };
}