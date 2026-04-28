import type { NextConfig } from 'next'
 
const isProd = process.env.NODE_ENV === 'production';
const isGHPages = process.env.DEPLOY_TARGET === 'ghpages';

const nextConfig: NextConfig = {
  output: isProd ? 'export' : undefined,
  distDir: isProd ? 'build' : '.next',
  basePath: isGHPages ? '/foodroller-react' : '',
  assetPrefix: isGHPages ? '/foodroller-react/' : '',
  outputFileTracingRoot: __dirname,
  experimental: {
    forceSwcTransforms: true,
  },
}
 
export default nextConfig