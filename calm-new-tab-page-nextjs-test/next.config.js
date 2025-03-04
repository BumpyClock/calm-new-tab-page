/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Enable static exports
  output: 'export',
  
  // Set the dist directory for output
  distDir: 'dist',
  
  // Disable image optimization for extension compatibility
  images: {
    unoptimized: true,
  },
  
  // Ensure trailing slashes are handled consistently
  trailingSlash: false,
  
  // Configure asset prefix for extension
  assetPrefix: './',
  
  // Treat specific environment variables as public
  env: {
    NEXT_PUBLIC_APP_ENV: 'extension',
  },
};

module.exports = nextConfig;