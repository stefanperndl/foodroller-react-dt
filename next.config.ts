import type { NextConfig } from 'next'

// Dynatrace is injected via /etc/ld.so.preload into every node process. Workers
// inherit NODE_OPTIONS from the parent AND get re-injected by liboneagentproc.so,
// doubling the --require path into an invalid string that crashes the worker.
// Clearing it here means workers inherit a clean value; liboneagentproc.so then
// sets it once and Dynatrace loads without error.
process.env.NODE_OPTIONS = ''

const nextConfig: NextConfig = {
  experimental: {
    forceSwcTransforms: true,
  },
}

export default nextConfig
