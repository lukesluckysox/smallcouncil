/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // pg uses native bindings — keep it external to avoid bundling issues
    serverComponentsExternalPackages: ['pg'],
    // Enable instrumentation.ts for Railway auto-migration on startup
    instrumentationHook: true,
  },
  // Railway sets PORT automatically; Next.js respects it via --port or $PORT
};

export default nextConfig;
