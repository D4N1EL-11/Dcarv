/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Sección 5 del plan: "/" lleva a /soporte (307); el layout de /soporte exige sesión.
  async redirects() {
    return [{ source: '/', destination: '/soporte', permanent: false }];
  },
};

export default nextConfig;
