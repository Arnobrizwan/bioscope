import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  // Playwright uses this loopback origin for the local E2E web server.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
