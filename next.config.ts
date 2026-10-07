import type { NextConfig } from "next";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;
const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

// Baseline hardening that cannot break inline Next.js scripts or Stripe
// redirects. A full script-src CSP needs per-request nonces (see
// https://nextjs.org/docs/app/guides/content-security-policy).
const CONTENT_SECURITY_POLICY = [
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
  // No includeSubDomains: the zone has legacy subdomains (cpanel, autodiscover).
  { key: "Strict-Transport-Security", value: `max-age=${ONE_YEAR_SECONDS}` },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  images: {
    // Upload keys are timestamped (immutable), so optimized variants can be
    // cached long-term instead of being re-encoded on the 0.5-CPU container.
    minimumCacheTTL: THIRTY_DAYS_SECONDS,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
