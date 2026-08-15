import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  reactStrictMode: true,
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [{ source: "/dashboard", destination: "/players", permanent: false }];
  },
};

export default nextConfig;
