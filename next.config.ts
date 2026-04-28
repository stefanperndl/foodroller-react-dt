import type { NextConfig } from 'next'
 
const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  output: isProd ? 'export' : undefined,
  distDir: isProd ? 'build' : '.next',
  outputFileTracingRoot: __dirname,
  experimental: {
    forceSwcTransforms: true,
  },
}
 
export default nextConfig