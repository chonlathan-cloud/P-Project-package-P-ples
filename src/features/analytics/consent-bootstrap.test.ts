import { describe, expect, it } from "vitest";
import {
  CONSENT_DEFAULT_BOOTSTRAP_SCRIPT,
  DEFAULT_DENIED_CONSENT,
} from "./consent";

describe("consent bootstrap", () => {
  it("queues every Consent Mode v2 value as denied without loading Google", () => {
    for (const [consentType, value] of Object.entries(DEFAULT_DENIED_CONSENT)) {
      expect(CONSENT_DEFAULT_BOOTSTRAP_SCRIPT).toContain(
        `${consentType}: '${value}'`,
      );
    }

    expect(CONSENT_DEFAULT_BOOTSTRAP_SCRIPT).toContain(
      "gtag('consent', 'default'",
    );
    expect(CONSENT_DEFAULT_BOOTSTRAP_SCRIPT).not.toContain(
      "googletagmanager.com",
    );
  });
});
