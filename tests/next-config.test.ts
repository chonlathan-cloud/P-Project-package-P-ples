import { describe, expect, it } from "vitest";

import { buildContentSecurityPolicy, legacyRedirects } from "../next.config";

describe("legacy Wix redirects", () => {
  it("redirects each legacy path directly to its final canonical route", () => {
    expect(legacyRedirects).toEqual([
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
    ]);
  });
});

describe("analytics Content Security Policy", () => {
  it("allows only the Google endpoints needed when GTM is enabled", () => {
    const policy = buildContentSecurityPolicy({
      apiOrigin: "https://api.example.com",
      development: false,
      gtmEnabled: true,
    });

    expect(policy).toContain(
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
    );
    expect(policy).toContain("https://www.google-analytics.com");
    expect(policy).not.toContain("'unsafe-eval'");
  });

  it("does not allow analytics origins when GTM is disabled", () => {
    const policy = buildContentSecurityPolicy({
      apiOrigin: "https://api.example.com",
      development: false,
      gtmEnabled: false,
    });

    expect(policy).not.toContain("googletagmanager.com");
    expect(policy).not.toContain("google-analytics.com");
  });
});
