import Image from 'next/image';

interface HeroImageProps {
  src: string;
  alt: string;
  caption?: string;
  priority?: boolean;
}

export function HeroImage({ src, alt, caption, priority = false }: HeroImageProps) {
  return (
    <div className="aspect-video bg-emerald-600/10 rounded-xl border-2 border-emerald-200 overflow-hidden relative shadow-lg">
      <Image 
        src={src}
        alt={alt}
        fill 
        className="object-cover" 
        priority={priority}
      />
      {caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/90 to-transparent p-4 text-sm text-emerald-800 font-medium text-center">
          {caption}
        </div>
      )}
    </div>
  );
}