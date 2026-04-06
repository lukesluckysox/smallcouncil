/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Keep native module out of the webpack bundle
    serverComponentsExternalPackages: ['better-sqlite3'],
    // Enable instrumentation.ts for SQLite schema init on startup
    instrumentationHook: true,
  },
};

export default nextConfig;
