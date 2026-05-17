import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  env: {
    PROCON_DB_PATH: process.env.PROCON_DB_PATH ?? '../output/procon.db',
  },
}

export default nextConfig
