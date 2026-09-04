import { describe, expect, it } from "vitest";
import robots from "./robots";

describe("robots metadata", () => {
  it("blocks indexing until the canonical-domain cutover enables it", () => {
    expect(robots()).toEqual({
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    });
  });
});
