/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      loaders: {},
    },
  },
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig
