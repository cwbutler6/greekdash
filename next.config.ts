import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
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
  },
  
  // Enable experimental instrumentation
  experimental: {},
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
