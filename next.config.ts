import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }],
  },
  // @sanity/workbench (pulled in by sanity v6) ships raw .ts sources behind a
  // development export condition; Turbopack needs them transpiled explicitly.
  transpilePackages: ["@sanity/workbench", "@sanity/sdk-react"],
  // PostHog first-party proxy. The browser talks to /ingest on our own
  // origin and Next forwards to PostHog's US hosts, so blockers keyed on
  // third-party analytics domains never see it. PostHog's endpoints keep a
  // trailing slash before the query string, which Next would otherwise 308
  // away, so trailing-slash redirects are off site-wide (no link on the
  // site uses one).
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
};

export default nextConfig;
