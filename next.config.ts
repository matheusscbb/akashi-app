import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  experimental: { serverActions: { allowedOrigins: ["*"] } },

};

export default nextConfig;
