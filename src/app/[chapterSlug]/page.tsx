import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import ContactForm from './contact-form';

type PublicChapterPageProps = {
  params: Promise<{ chapterSlug: string }>;
};

export default async function PublicChapterPage({ params }: PublicChapterPageProps) {
  const { chapterSlug } = await params;

  // Fetch chapter data with public information
  const chapter = await prisma.chapter.findUnique({
    where: { slug: chapterSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      publicInfo: true,
      primaryColor: true,
      schoolName: true,
      createdAt: true,
      galleryImages: {
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: {
          id: true,
          url: true,
          caption: true,
        },
      },
      events: {
        where: {
          isPublic: true,
          startDate: {
            gte: new Date(),
          },
        },
        orderBy: { startDate: 'asc' },
        take: 6,
        select: {
          id: true,
          title: true,
          description: true,
          startDate: true,
          location: true,
        },
      },
    },
  });

  if (!chapter) {
    notFound();
  }

  const primaryColor = chapter.primaryColor || '#1d4ed8';

  return (
    <div className="min-h-screen bg-white">
      {/* Public Navigation Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                GreekDash
              </Link>
              <span className="ml-4 text-gray-500">|</span>
              <span className="ml-4 text-lg font-medium text-gray-700">
                {chapter.name}
              </span>
            </div>
            <div className="flex items-center space-x-4">
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
          className="relative py-20 text-white text-center"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-5xl font-bold mb-4">{chapter.name}</h1>
            {chapter.schoolName && (
              <p className="text-xl mb-6 opacity-90">{chapter.schoolName}</p>
            )}
            <p className="text-lg opacity-80">
              Welcome to our chapter&apos;s public page. Learn more about who we are and how to join.
            </p>
          </div>
        </section>

        {/* About Section */}
        {chapter.publicInfo && (
          <section className="py-16 bg-white">
            <div className="max-w-4xl mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
                About Our Chapter
              </h2>
              <div className="prose prose-lg mx-auto text-gray-700">
                <p className="whitespace-pre-wrap">{chapter.publicInfo}</p>
              </div>
            </div>
          </section>
        )}

        {/* Gallery Section */}
        {chapter.galleryImages.length > 0 && (
          <section className="py-16 bg-gray-50">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
                Chapter Gallery
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {chapter.galleryImages.map((image) => (
                  <div key={image.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="relative h-64">
                      <Image
                        src={image.url}
                        alt={image.caption || 'Chapter gallery image'}
                        fill
                        className="object-cover"
                      />
                    </div>
                    {image.caption && (
                      <div className="p-4">
                        <p className="text-sm text-gray-600">{image.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Events Section */}
        {chapter.events.length > 0 && (
          <section className="py-16 bg-white">
            <div className="max-w-4xl mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
                Upcoming Public Events
              </h2>
              <div className="grid gap-6">
                {chapter.events.map((event) => (
                  <div key={event.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {event.title}
                        </h3>
                        {event.description && (
                          <p className="text-gray-600 mb-3">{event.description}</p>
                        )}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-500">
                          <span className="flex items-center">
                            📅 {format(new Date(event.startDate), 'PPP')}
                          </span>
                          {event.location && (
                            <span className="flex items-center">
                              📍 {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Contact Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-2xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
              Interested in Joining?
            </h2>
            <p className="text-center text-gray-600 mb-8">
              Send us a message and we&apos;ll get back to you with more information about membership opportunities.
            </p>
            <ContactForm chapterSlug={chapterSlug} primaryColor={primaryColor} />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-lg font-semibold mb-4">{chapter.name}</h3>
          <p className="text-gray-400 mb-6">
            Powered by GreekDash - Chapter Management Made Simple
          </p>
          <div className="flex justify-center space-x-6">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              About GreekDash
            </Link>
            <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
              Contact Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}