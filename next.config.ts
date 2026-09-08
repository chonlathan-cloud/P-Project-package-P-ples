import type { NextConfig } from "next";

const apiOrigin = (() => {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_CONTENT_API_URL ?? "http://localhost:8000",
    ).origin;
  } catch {
    throw new Error("NEXT_PUBLIC_CONTENT_API_URL must be a valid absolute URL");
  }
})();

export function buildContentSecurityPolicy({
  apiOrigin,
  development,
  gtmEnabled,
}: {
  apiOrigin: string;
  development: boolean;
  gtmEnabled: boolean;
}) {
  const googleScript = gtmEnabled ? " https://www.googletagmanager.com" : "";
  const googleImages = gtmEnabled
    ? " https://www.googletagmanager.com https://www.google-analytics.com https://www.google.com https://www.google.co.th https://googleads.g.doubleclick.net"
    : "";
  const googleConnections = gtmEnabled
    ? " https://www.google-analytics.com https://region1.google-analytics.com https://www.google.com https://googleads.g.doubleclick.net"
    : "";

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "object-src 'none'",
    `img-src 'self' data: blob: ${apiOrigin} https://storage.googleapis.com${googleImages}`,
    "font-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    `script-src 'self' 'unsafe-inline'${development ? " 'unsafe-eval'" : ""}${googleScript}`,
    `connect-src 'self' ${apiOrigin} https://*.googleapis.com https://securetoken.googleapis.com${googleConnections}`,
  ].join("; ");
}

const contentSecurityPolicy = buildContentSecurityPolicy({
  apiOrigin,
  development: process.env.NODE_ENV === "development",
  gtmEnabled: /^GTM-[A-Z0-9]+$/.test(process.env.NEXT_PUBLIC_GTM_ID ?? ""),
});

export const legacyRedirects = [
  {
    source: "/product",
    destination: "/products",
    permanent: true,
  },
  {
    source: "/ddboxprinting",
    destination: "/company",
    permanent: true,
  },
] as const;

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async redirects() {
    return legacyRedirects.map((redirect) => ({ ...redirect }));
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
