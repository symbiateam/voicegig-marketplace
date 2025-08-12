/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true
  },
  // Disable TypeScript checking during build
  typescript: {
    ignoreBuildErrors: true
  },
  images: {
    domains: ['tzgbbhlwueylqhbegync.supabase.co'],
    formats: ['image/avif', 'image/webp']
  },
  // Ensure environment variables are available
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }
}

module.exports = nextConfig
