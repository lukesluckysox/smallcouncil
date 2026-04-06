/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure server-only code stays server-side
  experimental: {
    serverComponentsExternalPackages: ['bcrypt', 'pg'],
  },
  // Railway sets PORT automatically
  // Next.js will use it if present
};

export default nextConfig;
