import { describe, expect, it } from "vitest";
import robots, { buildRobots } from "./robots";

describe("robots metadata", () => {
  it("blocks indexing until the canonical-domain cutover enables it", () => {
    expect(robots()).toEqual({
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    });
  });

  it("allows the approved privacy notice while keeping private routes blocked", () => {
    expect(buildRobots(true)).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/thank-you", "/terms"],
      },
      sitemap: expect.stringMatching(/\/sitemap\.xml$/),
    });
  });
});
