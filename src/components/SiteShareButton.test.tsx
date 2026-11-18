import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SiteShareButton } from "./SiteShareButton";

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function (this: HTMLDialogElement) { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function (this: HTMLDialogElement) { this.open = false; } });
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  document.head.innerHTML = '<link rel="canonical" href="https://kerygmapath.com/characters/">';
  document.title = "Kerygma Path & Gospel Stories";
});

describe("site sharing", () => {
  it("shares the canonical page, provides email and copies the link", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<SiteShareButton />);
    fireEvent.click(screen.getByRole("button", { name: "Share this page" }));
    expect(screen.getByRole("dialog", { name: "Share Kerygma Path" })).toBeTruthy();
    const facebook = new URL(screen.getByRole("link", { name: "Facebook" }).getAttribute("href")!);
    expect(facebook.searchParams.get("u")).toBe("https://kerygmapath.com/characters/");
    const email = screen.getByRole("link", { name: "Email" }).getAttribute("href")!;
    expect(decodeURIComponent(email)).toContain("subject=Kerygma Path & Gospel Stories");
    expect(decodeURIComponent(email)).toContain("https://kerygmapath.com/characters/");
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Link copied!"));
    expect(writeText).toHaveBeenCalledWith("https://kerygmapath.com/characters/");
    fireEvent.click(screen.getByRole("button", { name: "Close sharing options" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.body.style.overflow).toBe("");
  });

  it("selects a manual copy fallback when clipboard access is denied", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } });
    render(<SiteShareButton />);
    fireEvent.click(screen.getByRole("button", { name: "Share this page" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Select and copy the link below."));
    const input = screen.getByRole("textbox", { name: "Page link" }) as HTMLInputElement;
    expect(document.activeElement).toBe(input);
    expect(input.selectionEnd).toBe(input.value.length);
  });
});
