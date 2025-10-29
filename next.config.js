/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    rules: {
      // Add any custom loader rules here if needed
      // Example: "*.mdx": ["mdx-loader"]
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
      },
    ],
  },
}

module.exports = nextConfig