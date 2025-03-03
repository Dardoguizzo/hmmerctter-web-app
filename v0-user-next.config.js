/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/hmmerctter-web-app",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

module.exports = nextConfig

