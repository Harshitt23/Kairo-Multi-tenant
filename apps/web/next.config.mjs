/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Consume the shared TS package source through Next's compiler.
  transpilePackages: ['@pm/types'],
};

export default nextConfig;
