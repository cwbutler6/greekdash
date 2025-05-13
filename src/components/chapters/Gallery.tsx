'use client';

import { GalleryImage } from '@/generated/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface GalleryProps {
  images: Array<Pick<GalleryImage, 'id' | 'url' | 'caption'>>;
}

export function Gallery({ images }: GalleryProps) {
  const [selectedImage, setSelectedImage] = useState<Pick<GalleryImage, 'id' | 'url' | 'caption'> | null>(null);

  if (!images.length) {
    return (
      <Card className="w-full mb-8">
        <CardHeader>
          <CardTitle>Photo Gallery</CardTitle>
          <CardDescription>No photos have been added to the gallery yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full mb-8">
        <CardHeader>
          <CardTitle>Photo Gallery</CardTitle>
          <CardDescription>Explore our chapter through photos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image) => (
              <div 
                key={image.id} 
                className="relative aspect-square overflow-hidden rounded-md cursor-pointer"
                onClick={() => setSelectedImage(image)}
              >
                <Image
                  src={image.url}
                  alt={image.caption || 'Gallery photo'}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        {selectedImage && (
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedImage.caption || 'Chapter Gallery Image'}</DialogTitle>
            </DialogHeader>
            <div className="relative w-full aspect-video">
              <Image
                src={selectedImage.url}
                alt={selectedImage.caption || 'Gallery photo'}
                fill
                className="object-contain"
                sizes="(max-width: 1280px) 100vw, 1280px"
              />
            </div>
            {selectedImage.caption && (
              <DialogDescription className="text-center">{selectedImage.caption}</DialogDescription>
            )}
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
