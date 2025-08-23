import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs';
import { PrismaPlugin } from '@prisma/nextjs-monorepo-workaround-plugin';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // Enable experimental Partial Prerendering for faster first paint
  experimental: {
    ppr: 'incremental',
    dynamicIO: true, // Enable dynamic IO for better caching control
  },
  
  images: {
    remotePatterns: [
      // Supabase production URLs
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Supabase local development
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
      // Keep wildcard as fallback for other image sources if needed
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Move outputFileTracingIncludes to top level (not in experimental)
  outputFileTracingIncludes: {
    '/api/**/*': ['./src/generated/prisma/**/*'],
    '/**/*': ['./node_modules/.prisma/client/**/*'],
  },
  
  serverExternalPackages: ['@prisma/client', '@prisma/engines'],
  
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
      config.externals.push('@prisma/client');
      config.resolve.alias = {
        ...config.resolve.alias,
        '.prisma/client/index-browser': './node_modules/.prisma/client/index-browser.js',
      };
    }
    return config;
  },
}

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // Suppresses source map uploading logs during build
  silent: true,
  
  // Upload source maps in production only
  dryRun: process.env.NODE_ENV !== 'production',
  
  // Automatically tree-shake Sentry logger statements
  disableLogger: true,
  
  // Hides source maps from generated client bundles
  hideSourceMaps: true,
  
  // Automatically instrument Next.js API routes
  automaticVercelMonitors: true,
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
