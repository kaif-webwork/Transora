/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@transora/shared'],
  async rewrites() {
    let backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://swiftsharebackend-production.up.railway.app';
    if (!backendUrl.startsWith('http://') && !backendUrl.startsWith('https://')) {
      backendUrl = `https://${backendUrl}`;
    }
    // Clean trailing slash
    backendUrl = backendUrl.replace(/\/$/, '');

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/socket.io/:path*',
        destination: `${backendUrl}/socket.io/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
