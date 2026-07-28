import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.mathislambert.fr",
      },
    ],
  },
  /**
   * The only surviving mention of /blog anywhere, and it exists so links already
   * in the wild (search results, a bookmark, an old LinkedIn post) land on the
   * note instead of a 404. Nothing in the app points here. Delete this block
   * once the old URLs have dropped out of search, and /blog stops resolving.
   */
  async redirects() {
    return [
      { source: "/blog", destination: "/notes", permanent: true },
      { source: "/blog/:slug", destination: "/notes/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
