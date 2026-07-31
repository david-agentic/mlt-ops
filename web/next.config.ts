import type { NextConfig } from "next";
import path from "node:path";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

// `postgres` ships a real cloudflare:sockets-based build behind a "workerd"
// package.json export condition, but Turbopack has no option to select an
// export condition — only to alias one import specifier to another file. So
// when building for Cloudflare we alias the package straight to that file.
// Scoped via MLT_CLOUDFLARE_BUILD (set in the `cf:*` npm scripts, not by
// npm_lifecycle_event — opennextjs-cloudflare re-invokes `npm run build`
// internally, which resets npm_lifecycle_event back to "build" and defeats
// that check). The plain Node/Vercel build must keep resolving the default
// (Node net-based) build, since the cf build has no Node `net` at all.
const isCloudflareBuild = process.env.MLT_CLOUDFLARE_BUILD === "1";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  ...(isCloudflareBuild && {
    turbopack: {
      resolveAlias: {
        postgres: path.join(process.cwd(), "node_modules/postgres/cf/src/index.js").split(path.sep).join("/"),
      },
    },
  }),
};

export default nextConfig;
