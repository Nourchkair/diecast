import type { NextConfig } from 'next';
import os from 'node:os';

function getAllowedDevOrigins() {
  const origins = new Set<string>(['localhost', '*.localhost', '127.0.0.1']);

  for (const network of Object.values(os.networkInterfaces())) {
    for (const entry of network ?? []) {
      if (entry.family === 'IPv4' && !entry.internal) {
        origins.add(entry.address);
      }
    }
  }

  return [...origins];
}

const nextConfig: NextConfig = {
  allowedDevOrigins: getAllowedDevOrigins(),
};

export default nextConfig;
