import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Product photos live in Neon Object Storage. The hostname is
    // branch-specific (br-<branch>.storage.<cluster>.<region>.aws.neon.tech),
    // so this is a wildcard — otherwise every new branch would break images.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.aws.neon.tech",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
