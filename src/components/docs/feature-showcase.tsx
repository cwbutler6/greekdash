import { FeatureShowcaseProps, FeatureItem } from '@/types/docs';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { VideoEmbed } from './video-embed';
import { PlanBadge } from './plan-badge';

export function FeatureShowcase({ 
  features, 
  layout = 'grid', 
  showCTA = true 
}: FeatureShowcaseProps) {
  const layoutClasses = {
    grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    list: 'space-y-6',
    cards: 'grid grid-cols-1 lg:grid-cols-2 gap-8'
  };

  return (
    <div className={cn(layoutClasses[layout])}>
      {features.map((feature, index) => (
        <FeatureCard 
          key={index} 
          feature={feature} 
          layout={layout}
          showCTA={showCTA}
        />
      ))}
    </div>
  );
}

interface FeatureCardProps {
  feature: FeatureItem;
  layout: 'grid' | 'list' | 'cards';
  showCTA: boolean;
}

function FeatureCard({ feature, layout, showCTA }: FeatureCardProps) {
  const isListLayout = layout === 'list';
  
  return (
    <Card className={cn(
      'h-full flex flex-col',
      isListLayout && 'flex-row items-center space-x-6'
    )}>
      {/* Media Section */}
      {(feature.screenshot || feature.videoUrl) && (
        <div className={cn(
          'relative',
          isListLayout ? 'w-1/3 flex-shrink-0' : 'w-full'
        )}>
          {feature.videoUrl ? (
            <VideoEmbed 
              videoId={feature.videoUrl}
              title={feature.title}
              className={cn(
                'rounded-t-lg',
                isListLayout && 'rounded-l-lg rounded-tr-none'
              )}
            />
          ) : feature.screenshot ? (
            <div className={cn(
              'relative aspect-video overflow-hidden',
              isListLayout ? 'rounded-l-lg' : 'rounded-t-lg'
            )}>
              <Image
                src={feature.screenshot}
                alt={`${feature.title} screenshot`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          ) : null}
          
          {/* Plan Badge Overlay */}
          {feature.planRequired && (
            <div className="absolute top-2 right-2">
              <PlanBadge plan={feature.planRequired} />
            </div>
          )}
        </div>
      )}

      {/* Content Section */}
      <div className={cn(
        'flex flex-col flex-1',
        isListLayout ? 'w-2/3' : 'w-full'
      )}>
        <CardHeader className={cn(
          'flex-shrink-0',
          isListLayout && 'pb-2'
        )}>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {feature.icon && (
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-primary">
                  {feature.icon}
                </div>
              )}
              <div>
                <CardTitle className={cn(
                  isListLayout ? 'text-xl' : 'text-lg'
                )}>
                  {feature.title}
                </CardTitle>
                {!feature.screenshot && !feature.videoUrl && feature.planRequired && (
                  <div className="mt-1">
                    <PlanBadge plan={feature.planRequired} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1">
          <CardDescription className={cn(
            'text-sm leading-relaxed',
            isListLayout && 'text-base'
          )}>
            {feature.description}
          </CardDescription>
        </CardContent>

        {/* CTA Section */}
        {showCTA && (feature.ctaText || feature.ctaUrl) && (
          <CardFooter className="flex-shrink-0 pt-0">
            {feature.ctaUrl ? (
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={feature.ctaUrl}>
                  {feature.ctaText || 'Learn More'}
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="w-full">
                {feature.ctaText || 'Learn More'}
              </Button>
            )}
          </CardFooter>
        )}
      </div>
    </Card>
  );
}