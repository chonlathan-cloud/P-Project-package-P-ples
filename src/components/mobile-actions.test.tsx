import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { company } from "@/content/company";
import { MobileActions } from "./mobile-actions";

const navigation = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

describe("MobileActions", () => {
  beforeEach(() => {
    navigation.pathname = "/";
  });

  it("does not duplicate actions on the Contact page", () => {
    navigation.pathname = "/contact";

    render(<MobileActions />);

    expect(
      screen.queryByRole("navigation", { name: "ทางลัดติดต่อ" }),
    ).not.toBeInTheDocument();
  });

  it("prioritizes LINE OA in global contact shortcuts", () => {
    render(<MobileActions />);

    expect(
      screen.getByRole("navigation", { name: "ทางลัดติดต่อ" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "LINE OA" })).toHaveAttribute(
      "href",
      company.lineOaHref,
    );
  });
});
