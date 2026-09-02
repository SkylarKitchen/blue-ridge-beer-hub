import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }],
  },
  // @sanity/workbench (pulled in by sanity v6) ships raw .ts sources behind a
  // development export condition; Turbopack needs them transpiled explicitly.
  transpilePackages: ["@sanity/workbench", "@sanity/sdk-react"],
};

export default nextConfig;
