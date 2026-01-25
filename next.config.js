/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Enable static export for Electron
  output: 'export',

  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },

  // Ensure trailing slashes for proper file:// protocol loading
  trailingSlash: true,
}

module.exports = nextConfig
