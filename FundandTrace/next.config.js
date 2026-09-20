// Content-Security-Policy: default-deny with explicit allowlists. The nonce
// based strict-dynamic setup requires middleware to inject per-request nonces
// (see https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy),
// which this pages-router app does not have yet — so script-src allows the
// inline Next.js bootstrap scripts and GTM explicitly instead.
const cspDirectives = [
  "default-src 'self'",
  // Next.js hydration requires inline scripts; GTM injects inline snippets.
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
  // Campaign images come from Cloudinary; avatars may point at any https origin.
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com",
  // Stripe Elements + KYC (m.stripe.network), payment iframes.
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.paystack.com https://checkout.flutterwave.com https://www.google.com",
  "connect-src 'self' " +
    (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") +
    " https://api.stripe.com https://m.stripe.network https://api.paystack.co https://api.flutterwave.com https://api.Cloudinary.com https://res.cloudinary.com https://www.google-analytics.com https://www.googletagmanager.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // GTM/Stripe open frames; keep a baseline frame-ancestors guard.
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspDirectives },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

module.exports = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    STRIPEPUBLIC: process.env.STRIPEPUBLIC,
    LOCK: process.env.LOCK,
  },
  compiler: {
    // SWC replaces the removed .babelrc plugin for SSR-safe display names.
    styledComponents: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/campaign",
        destination: "/Categories",
        permanent: true,
      },
      {
        source: "/category",
        destination: "/Categories",
        permanent: true,
      },
    ];
  },
};
