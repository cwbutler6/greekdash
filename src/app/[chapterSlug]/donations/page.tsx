import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { Metadata } from 'next';
import Link from 'next/link';
import DonationForm from './donation-form';
import { DonationCampaignStatus } from '@/generated/prisma';

interface PublicDonationPageProps {
  params: Promise<{ chapterSlug: string }>;
}

// Dynamic metadata generation for SEO
export async function generateMetadata({ params }: PublicDonationPageProps): Promise<Metadata> {
  const { chapterSlug } = await params;
  
  const chapter = await prisma.chapter.findUnique({
    where: { slug: chapterSlug },
    select: {
      name: true,
      slug: true,
      schoolName: true,
    },
  });

  if (!chapter) {
    return {
      title: 'Chapter Not Found - GreekDash',
      description: 'The requested chapter page could not be found.',
    };
  }

  const title = `Support ${chapter.name}${chapter.schoolName ? ` - ${chapter.schoolName}` : ''} | GreekDash`;
  const description = `Make a donation to support ${chapter.name}${chapter.schoolName ? ` at ${chapter.schoolName}` : ''}. Help fund our activities, events, and community initiatives.`;
  
  const url = `https://greekdash.com/${chapter.slug}/donations`;

  return {
    title,
    description,
    keywords: [
      chapter.name,
      chapter.schoolName || '',
      'donation',
      'support',
      'fraternity',
      'sorority',
      'greek life',
      'fundraising',
      'charity',
    ].filter(Boolean),
    openGraph: {
      title,
      description,
      url,
      siteName: 'GreekDash',
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function PublicDonationPage({ params }: PublicDonationPageProps) {
  const { chapterSlug } = await params;

  // Fetch chapter data and active donation campaigns
  const chapter = await prisma.chapter.findUnique({
    where: { slug: chapterSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      primaryColor: true,
      schoolName: true,
      donationCampaigns: {
        where: {
          status: DonationCampaignStatus.ACTIVE,
          OR: [
            { endDate: null },
            { endDate: { gte: new Date() } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          goalAmount: true,
          currentAmount: true,
          type: true,
          endDate: true,
        },
      },
    },
  });

  if (!chapter) {
    notFound();
  }

  const primaryColor = chapter.primaryColor || '#1d4ed8';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Public Navigation Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                GreekDash
              </Link>
              <span className="ml-4 text-gray-500">|</span>
              <Link 
                href={`/${chapter.slug}`}
                className="ml-4 text-lg font-medium text-gray-700 hover:text-gray-900"
              >
                {chapter.name}
              </Link>
              <span className="ml-2 text-gray-500">•</span>
              <span className="ml-2 text-gray-600">Donations</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href={`/${chapter.slug}`}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Back to Chapter
              </Link>
              <Link
                href={`/${chapter.slug}/portal`}
                className="px-4 py-2 rounded-md text-white font-medium transition-colors"
                style={{ backgroundColor: primaryColor }}
              >
                Member Portal
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <section 
          className="relative py-16 text-white text-center"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4">Support {chapter.name}</h1>
            {chapter.schoolName && (
              <p className="text-xl mb-6 opacity-90">{chapter.schoolName}</p>
            )}
            <p className="text-lg opacity-80">
              Your donation helps fund our activities, events, and community initiatives.
            </p>
          </div>
        </section>

        {/* Active Campaigns Section */}
        {chapter.donationCampaigns.length > 0 && (
          <section className="py-12 bg-white">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
                Active Campaigns
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {chapter.donationCampaigns.map((campaign) => {
                  const progressPercentage = (campaign.goalAmount ?? 0) > 0
                    ? Math.min((campaign.currentAmount / (campaign.goalAmount ?? 0)) * 100, 100)
                    : 0;

                  return (
                    <div key={campaign.id} className="bg-gray-50 rounded-lg p-6 border">
                      <h3 className="text-xl font-semibold mb-2 text-gray-900">
                        {campaign.title}
                      </h3>
                      {campaign.description && (
                        <p className="text-gray-600 mb-4 text-sm">
                          {campaign.description}
                        </p>
                      )}
                      
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>${campaign.currentAmount.toLocaleString()}</span>
                          <span>${(campaign.goalAmount ?? 0).toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-300"
                            style={{ 
                              backgroundColor: primaryColor,
                              width: `${progressPercentage}%` 
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {progressPercentage.toFixed(1)}% of goal reached
                        </p>
                      </div>
                      
                      {campaign.endDate && (
                        <p className="text-xs text-gray-500">
                          Ends: {new Date(campaign.endDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Donation Form Section */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-2xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Make a Donation
              </h2>
              <p className="text-gray-600">
                Every contribution makes a difference. Thank you for supporting our chapter!
              </p>
            </div>
            
            <DonationForm 
              chapterSlug={chapter.slug}
              primaryColor={primaryColor}
              campaigns={chapter.donationCampaigns.map(campaign => ({
                ...campaign,
                goalAmount: campaign.goalAmount ?? 0
              }))}
            />
          </div>
        </section>

        {/* Impact Section */}
        <section className="py-12 bg-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Your Impact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6">
                <div 
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <span className="text-2xl">🎓</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">
                  Educational Programs
                </h3>
                <p className="text-gray-600">
                  Support scholarships, academic resources, and leadership development programs.
                </p>
              </div>
              
              <div className="p-6">
                <div 
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <span className="text-2xl">🤝</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">
                  Community Service
                </h3>
                <p className="text-gray-600">
                  Fund volunteer initiatives and charitable activities that benefit our local community.
                </p>
              </div>
              
              <div className="p-6">
                <div 
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <span className="text-2xl">🎉</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">
                  Chapter Events
                </h3>
                <p className="text-gray-600">
                  Enable memorable experiences, social events, and brotherhood/sisterhood activities.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} {chapter.name}. Powered by GreekDash.
          </p>
          <div className="mt-4 space-x-6">
            <Link href={`/${chapter.slug}`} className="text-gray-400 hover:text-white transition-colors">
              Chapter Home
            </Link>
            <Link href={`/${chapter.slug}/portal`} className="text-gray-400 hover:text-white transition-colors">
              Member Portal
            </Link>
            <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}