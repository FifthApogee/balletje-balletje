import type { NextConfig } from "next";

const repoName = "balletje-balletje";
const basePath = process.env.GITHUB_ACTIONS ? `/${repoName}` : undefined;

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  images: {
    unoptimized: true,
  },
  env: {
    // Mirrors basePath into a var reachable from raw asset-path strings
    // (background-image url()s, <audio src>) that Next doesn't rewrite on
    // its own. See src/lib/asset-path.ts.
    NEXT_PUBLIC_BASE_PATH: basePath ?? "",
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
