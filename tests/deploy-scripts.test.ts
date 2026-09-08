import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repositoryRoot = path.resolve(import.meta.dirname, "..");

const deploymentScripts = [
  ["deploy_web_test.sh", "mode=test service=web mutation=build-and-deploy"],
  [
    "deploy_web_prod.sh",
    "mode=prod service=web mutation=build-candidate-verify-promote",
  ],
  ["deploy_api_test.sh", "mode=test service=api mutation=build-and-deploy"],
  [
    "deploy_api_prod.sh",
    "mode=prod service=api mutation=build-candidate-verify-promote",
  ],
] as const;

describe("deployment entrypoints", () => {
  it.each(deploymentScripts)(
    "prints a non-mutating plan for %s",
    (script, expected) => {
      const output = execFileSync("bash", [script, "--dry-run"], {
        cwd: repositoryRoot,
        encoding: "utf8",
        timeout: 3_000,
      });

      expect(output).toContain("DD Box deployment plan");
      expect(output).toContain(expected);
    },
  );

  it("keeps the former Web Test command and positional tag compatible", () => {
    const output = execFileSync(
      "bash",
      ["deploy-web-test.sh", "legacy-test-tag", "--dry-run"],
      {
        cwd: repositoryRoot,
        encoding: "utf8",
        timeout: 3_000,
      },
    );

    expect(output).toContain("mode=test service=web mutation=build-and-deploy");
    expect(output).toContain("image_tag=legacy-test-tag");
  });

  it("builds the Production web candidate with the approved GTM container", () => {
    const config = readFileSync(
      path.join(repositoryRoot, "deploy/cloudbuild-web-prod.yaml"),
      "utf8",
    );

    expect(config).toContain("--build-arg=NEXT_PUBLIC_GTM_ID=${_GTM_ID}");
    expect(config).toContain('_GTM_ID: "GTM-MWW3HWHR"');
  });
});
