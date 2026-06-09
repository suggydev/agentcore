/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'unsplash.com' },
    ],
  },
  trailingSlash: false,
  async redirects() {
    return [
      { source: '/dashboard', destination: '/agents', permanent: true },
      { source: '/dashboard/agents/:path*', destination: '/agents/:path*', permanent: true },
      { source: '/dashboard/settings', destination: '/settings', permanent: true },
      { source: '/dashboard/settings/:path*', destination: '/settings/:path*', permanent: true },
      { source: '/dashboard/billing', destination: '/billing', permanent: true },
      { source: '/dashboard/billing/:path*', destination: '/billing/:path*', permanent: true },
      { source: '/dashboard/credits', destination: '/billing', permanent: true },
      { source: '/dashboard/payments', destination: '/billing', permanent: true },
      { source: '/dashboard/conversations', destination: '/agents', permanent: true },
      { source: '/dashboard/knowledge', destination: '/agents', permanent: true },
      { source: '/dashboard/integrations', destination: '/settings', permanent: true },
      { source: '/dashboard/orders', destination: '/agents', permanent: true },
      { source: '/dashboard/customers', destination: '/agents', permanent: true },
    ];
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-icons',
    ],
  },
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
