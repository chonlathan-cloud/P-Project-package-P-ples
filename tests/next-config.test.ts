import { describe, expect, it } from "vitest";

import { legacyRedirects } from "../next.config";

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
