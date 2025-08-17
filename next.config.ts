import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs';
import { PrismaPlugin } from '@prisma/nextjs-monorepo-workaround-plugin';

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
    '/**/*': ['./node_modules/.prisma/client/**/*'],
  },
  
  // Updated: moved from experimental.serverComponentsExternalPackages to serverExternalPackages
  serverExternalPackages: ['@prisma/client', '@prisma/engines'],
  
  // Enhanced webpack configuration to handle Prisma engines
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Add PrismaPlugin to handle engine bundling
      config.plugins = [...config.plugins, new PrismaPlugin()];
      
      // Externalize Prisma client to prevent bundling issues
      config.externals.push('@prisma/client');
      
      // Ensure Prisma engines are copied to the output
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
