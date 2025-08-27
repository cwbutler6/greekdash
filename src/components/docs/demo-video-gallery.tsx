'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Play,
  Clock,
  Users,
  DollarSign,
  Calendar,
  MessageSquare,
  Shield,
  BarChart3,
  Settings,
  Star,
  Filter,
  Search,
  Eye,
  ThumbsUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DemoVideo {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  planRequired?: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
  thumbnail: string;
  videoUrl: string;
  views: number;
  likes: number;
  transcript?: string;
  relatedVideos: string[];
  tags: string[];
  featured: boolean;
}

const demoVideos: DemoVideo[] = [
  {
    id: 'getting-started-overview',
    title: 'Getting Started with GreekDash',
    description: 'Complete overview of setting up your chapter and navigating the platform for the first time.',
    category: 'getting-started',
    duration: '8:45',
    difficulty: 'Beginner',
    planRequired: 'FREE',
    thumbnail: '/images/video-thumbnails/getting-started.jpg',
    videoUrl: 'https://example.com/videos/getting-started',
    views: 15420,
    likes: 892,
    relatedVideos: ['member-management-basics', 'chapter-setup'],
    tags: ['setup', 'overview', 'basics'],
    featured: true
  },
  {
    id: 'member-management-basics',
    title: 'Member Management Fundamentals',
    description: 'Learn how to invite members, manage profiles, assign roles, and handle the approval process.',
    category: 'members',
    duration: '12:30',
    difficulty: 'Beginner',
    planRequired: 'FREE',
    thumbnail: '/images/video-thumbnails/member-management.jpg',
    videoUrl: 'https://example.com/videos/member-management',
    views: 12850,
    likes: 743,
    relatedVideos: ['getting-started-overview', 'member-communication'],
    tags: ['members', 'invites', 'roles'],
    featured: true
  },
  {
    id: 'dues-collection-setup',
    title: 'Setting Up Automated Dues Collection',
    description: 'Step-by-step guide to configuring Stripe integration and setting up automated dues collection.',
    category: 'finance',
    duration: '15:20',
    difficulty: 'Intermediate',
    planRequired: 'BASIC',
    thumbnail: '/images/video-thumbnails/dues-collection.jpg',
    videoUrl: 'https://example.com/videos/dues-collection',
    views: 9630,
    likes: 567,
    relatedVideos: ['financial-reporting', 'expense-tracking'],
    tags: ['dues', 'stripe', 'payments'],
    featured: true
  },
  {
    id: 'event-management-complete',
    title: 'Complete Event Management Workflow',
    description: 'Create events, manage RSVPs, track attendance, and analyze event success metrics.',
    category: 'events',
    duration: '18:15',
    difficulty: 'Intermediate',
    planRequired: 'FREE',
    thumbnail: '/images/video-thumbnails/event-management.jpg',
    videoUrl: 'https://example.com/videos/event-management',
    views: 8940,
    likes: 521,
    relatedVideos: ['member-communication', 'analytics-dashboard'],
    tags: ['events', 'rsvp', 'attendance'],
    featured: true
  },
  {
    id: 'communication-campaigns',
    title: 'Creating Effective Communication Campaigns',
    description: 'Master SMS and email campaigns, target specific member groups, and track engagement.',
    category: 'communication',
    duration: '14:45',
    difficulty: 'Intermediate',
    planRequired: 'BASIC',
    thumbnail: '/images/video-thumbnails/communication.jpg',
    videoUrl: 'https://example.com/videos/communication',
    views: 7820,
    likes: 456,
    relatedVideos: ['member-management-basics', 'analytics-dashboard'],
    tags: ['sms', 'email', 'campaigns'],
    featured: false
  },
  {
    id: 'financial-reporting',
    title: 'Financial Reporting and Analytics',
    description: 'Generate financial reports, track expenses, and understand your chapter\'s financial health.',
    category: 'finance',
    duration: '16:30',
    difficulty: 'Intermediate',
    planRequired: 'BASIC',
    thumbnail: '/images/video-thumbnails/financial-reports.jpg',
    videoUrl: 'https://example.com/videos/financial-reports',
    views: 6750,
    likes: 398,
    relatedVideos: ['dues-collection-setup', 'expense-tracking'],
    tags: ['reports', 'analytics', 'finance'],
    featured: false
  },
  {
    id: 'advanced-analytics',
    title: 'Advanced Analytics and Insights',
    description: 'Deep dive into member engagement metrics, event analytics, and custom reporting features.',
    category: 'analytics',
    duration: '22:10',
    difficulty: 'Advanced',
    planRequired: 'PRO',
    thumbnail: '/images/video-thumbnails/analytics.jpg',
    videoUrl: 'https://example.com/videos/analytics',
    views: 5420,
    likes: 312,
    relatedVideos: ['financial-reporting', 'treasury-management'],
    tags: ['analytics', 'insights', 'reporting'],
    featured: false
  },
  {
    id: 'treasury-management',
    title: 'Treasury and Investment Tracking',
    description: 'Advanced treasury management features including DeFi integration and investment tracking.',
    category: 'finance',
    duration: '19:45',
    difficulty: 'Advanced',
    planRequired: 'PRO',
    thumbnail: '/images/video-thumbnails/treasury.jpg',
    videoUrl: 'https://example.com/videos/treasury',
    views: 4230,
    likes: 287,
    relatedVideos: ['financial-reporting', 'advanced-analytics'],
    tags: ['treasury', 'defi', 'investments'],
    featured: false
  },
  {
    id: 'custom-branding',
    title: 'Chapter Branding and Customization',
    description: 'Customize your chapter\'s appearance with colors, logos, and branded public pages.',
    category: 'customization',
    duration: '11:20',
    difficulty: 'Beginner',
    planRequired: 'BASIC',
    thumbnail: '/images/video-thumbnails/branding.jpg',
    videoUrl: 'https://example.com/videos/branding',
    views: 6890,
    likes: 423,
    relatedVideos: ['getting-started-overview', 'public-pages'],
    tags: ['branding', 'customization', 'colors'],
    featured: false
  },
  {
    id: 'security-compliance',
    title: 'Security Features and Compliance',
    description: 'Understanding audit logs, access controls, and compliance reporting features.',
    category: 'security',
    duration: '13:55',
    difficulty: 'Advanced',
    planRequired: 'PRO',
    thumbnail: '/images/video-thumbnails/security.jpg',
    videoUrl: 'https://example.com/videos/security',
    views: 3650,
    likes: 198,
    relatedVideos: ['advanced-analytics', 'admin-permissions'],
    tags: ['security', 'compliance', 'audit'],
    featured: false
  }
];

const categories = [
  { id: 'all', name: 'All Videos', icon: <Star className="h-4 w-4" /> },
  { id: 'getting-started', name: 'Getting Started', icon: <Play className="h-4 w-4" /> },
  { id: 'members', name: 'Member Management', icon: <Users className="h-4 w-4" /> },
  { id: 'finance', name: 'Financial Tools', icon: <DollarSign className="h-4 w-4" /> },
  { id: 'events', name: 'Event Management', icon: <Calendar className="h-4 w-4" /> },
  { id: 'communication', name: 'Communication', icon: <MessageSquare className="h-4 w-4" /> },
  { id: 'analytics', name: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'customization', name: 'Customization', icon: <Settings className="h-4 w-4" /> },
  { id: 'security', name: 'Security', icon: <Shield className="h-4 w-4" /> }
];

const difficultyColors = {
  Beginner: 'bg-green-100 text-green-800',
  Intermediate: 'bg-yellow-100 text-yellow-800',
  Advanced: 'bg-red-100 text-red-800'
};

const planColors = {
  FREE: 'bg-gray-100 text-gray-800',
  BASIC: 'bg-blue-100 text-blue-800',
  PRO: 'bg-purple-100 text-purple-800',
  ENTERPRISE: 'bg-emerald-100 text-emerald-800'
};

export function DemoVideoGallery() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [sortBy, setSortBy] = useState('featured');

  const filteredVideos = demoVideos
    .filter((video) => {
      const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           video.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           video.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === 'all' || video.difficulty === selectedDifficulty;
      
      return matchesSearch && matchesCategory && matchesDifficulty;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'featured':
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        case 'views':
          return b.views - a.views;
        case 'likes':
          return b.likes - a.likes;
        case 'duration':
          return parseInt(a.duration.split(':')[0]) - parseInt(b.duration.split(':')[0]);
        default:
          return 0;
      }
    });

  const featuredVideos = demoVideos.filter(video => video.featured);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Demo Video Gallery</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Comprehensive video tutorials covering every aspect of GreekDash. 
          Learn at your own pace with step-by-step demonstrations.
        </p>
      </div>

      {/* Featured Videos */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">Featured Videos</h2>
          <p className="text-muted-foreground">Essential videos to get you started</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredVideos.map((video) => (
            <Card key={video.id} className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <div className="relative">
                <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center">
                  <Play className="h-12 w-12 text-primary" />
                </div>
                <Badge className="absolute top-2 right-2" variant="secondary">
                  {video.duration}
                </Badge>
              </div>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-tight">{video.title}</CardTitle>
                  {video.featured && (
                    <Badge variant="default" className="text-xs">
                      Featured
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${difficultyColors[video.difficulty]}`}>
                    {video.difficulty}
                  </Badge>
                  {video.planRequired && (
                    <Badge className={`text-xs ${planColors[video.planRequired]}`}>
                      {video.planRequired}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm mb-4 line-clamp-2">
                  {video.description}
                </CardDescription>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {formatNumber(video.views)}
                  </div>
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" />
                    {formatNumber(video.likes)}
                  </div>
                </div>
                <Button variant="ghost" className="w-full p-0 h-auto font-medium">
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Watch Video
                  </div>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Videos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Videos</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search videos..."
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
                  {categories.map((category) => (
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
              <label className="text-sm font-medium">Difficulty</label>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured First</SelectItem>
                  <SelectItem value="views">Most Viewed</SelectItem>
                  <SelectItem value="likes">Most Liked</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">
            All Videos ({filteredVideos.length})
          </h2>
        </div>

        <Tabs defaultValue="grid" className="space-y-6">
          <TabsList>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          <TabsContent value="grid">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((video) => (
                <Card key={video.id} className="hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center">
                      <Play className="h-12 w-12 text-primary" />
                    </div>
                    <Badge className="absolute top-2 right-2" variant="secondary">
                      {video.duration}
                    </Badge>
                    {video.featured && (
                      <Badge className="absolute top-2 left-2" variant="default">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{video.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${difficultyColors[video.difficulty]}`}>
                        {video.difficulty}
                      </Badge>
                      {video.planRequired && (
                        <Badge className={`text-xs ${planColors[video.planRequired]}`}>
                          {video.planRequired}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">
                      {video.description}
                    </CardDescription>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {formatNumber(video.views)} views
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" />
                        {formatNumber(video.likes)} likes
                      </div>
                    </div>
                    <Button variant="ghost" className="w-full p-0 h-auto font-medium">
                      <div className="flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        Watch Video
                      </div>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="list">
            <div className="space-y-4">
              {filteredVideos.map((video) => (
                <Card key={video.id} className="hover:shadow-md transition-shadow">
                  <div className="flex">
                    <div className="relative w-48 flex-shrink-0">
                      <div className="aspect-video bg-muted rounded-l-lg flex items-center justify-center">
                        <Play className="h-8 w-8 text-primary" />
                      </div>
                      <Badge className="absolute top-2 right-2 text-xs" variant="secondary">
                        {video.duration}
                      </Badge>
                    </div>
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-semibold">{video.title}</h3>
                        <div className="flex items-center gap-2">
                          {video.featured && (
                            <Badge variant="default">Featured</Badge>
                          )}
                          <Badge className={`${difficultyColors[video.difficulty]}`}>
                            {video.difficulty}
                          </Badge>
                          {video.planRequired && (
                            <Badge className={`${planColors[video.planRequired]}`}>
                              {video.planRequired}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-4">{video.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {formatNumber(video.views)} views
                          </div>
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4" />
                            {formatNumber(video.likes)} likes
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {video.duration}
                          </div>
                        </div>
                        <Button variant="ghost" className="p-0 h-auto font-medium">
                          <div className="flex items-center gap-2">
                            <Play className="h-4 w-4" />
                            Watch Video
                          </div>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold">Ready to Get Started?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Watch the videos, then try GreekDash for yourself. 
              Start your free trial and experience the features firsthand.
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
              <Link href="/docs/getting-started">
                View Documentation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto mt-8">
            <div className="text-center">
              <div className="text-lg font-semibold">50+ Videos</div>
              <div className="text-sm text-muted-foreground">Comprehensive tutorials</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">Step-by-Step</div>
              <div className="text-sm text-muted-foreground">Easy to follow guides</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">Always Updated</div>
              <div className="text-sm text-muted-foreground">Latest features covered</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}