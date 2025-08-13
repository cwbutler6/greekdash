import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '*/admin/',
          '*/portal/',
          '*/pending/',
          '/login',
          '/signup',
          '/auth/',
          '/_next/',
          '/private/',
        ],
      },
    ],
    sitemap: 'https://greekdash.com/sitemap.xml',
  };
}