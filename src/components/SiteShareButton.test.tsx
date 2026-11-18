import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SiteShareButton } from "./SiteShareButton";

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function (this: HTMLDialogElement) { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function (this: HTMLDialogElement) { this.open = false; } });
  Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
  Object.defineProperty(navigator, "canShare", { configurable: true, value: undefined });
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
    fireEvent.click(screen.getByText("Share a link instead"));
    const facebook = new URL(screen.getByRole("link", { name: "Facebook" }).getAttribute("href")!);
    expect(facebook.searchParams.get("u")).toBe("https://kerygmapath.com/characters/");
    const email = screen.getByRole("link", { name: "Email link" }).getAttribute("href")!;
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

function mockImageSharing(share = vi.fn().mockResolvedValue(undefined), canShare = vi.fn().mockReturnValue(true)) {
  Object.defineProperty(navigator, "share", { configurable: true, value: share });
  Object.defineProperty(navigator, "canShare", { configurable: true, value: canShare });
  const fetchImage = vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(["artwork-bytes"], { type: "image/jpeg" }) });
  vi.stubGlobal("fetch", fetchImage);
  return { share, canShare, fetchImage };
}

function openSharing() {
  render(<SiteShareButton />);
  fireEvent.click(screen.getByRole("button", { name: "Share this page" }));
}

describe("image attachments", () => {
  it("passes the actual image bytes and page link to native sharing", async () => {
    const { share, canShare, fetchImage } = mockImageSharing();
    openSharing();
    const button = await screen.findByRole("button", { name: "Share image + link" });
    await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(button);
    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    const payload = share.mock.calls[0][0] as ShareData;
    expect(payload.files).toHaveLength(1);
    const file = payload.files![0];
    expect(file.name).toBe("Kerygma-Path.jpg");
    expect(file.type).toBe("image/jpeg");
    expect(file.size).toBe(13);
    const bytes = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsText(file);
    });
    expect(bytes).toBe("artwork-bytes");
    expect(payload.text).toContain("https://kerygmapath.com/characters/");
    expect(canShare).toHaveBeenCalledWith({ files: [file] });
    expect(fetchImage.mock.calls[0][0]).toBe("/images/kerygma-path-share-20261117.jpg");
    expect(screen.getByRole("img").getAttribute("src")).toContain("kerygma-path-share-20261117.jpg");
  });

  it("offers an explicit download when file sharing is unsupported", () => {
    openSharing();
    expect((screen.getByRole("button", { name: "Share image + link" }) as HTMLButtonElement).disabled).toBe(true);
    const download = screen.getByRole("link", { name: "Download image" });
    expect(download.getAttribute("download")).toBe("Kerygma-Path.jpg");
    expect(download.getAttribute("href")).toBe("/images/kerygma-path-share-20261117.jpg");
    expect(screen.getByText(/This browser cannot attach images directly/)).toBeTruthy();
  });

  it("does not replace a failed image share with a link-only share", async () => {
    const { share } = mockImageSharing(vi.fn().mockRejectedValue(new DOMException("Denied", "NotAllowedError")));
    openSharing();
    const button = await screen.findByRole("button", { name: "Share image + link" });
    await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(button);
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("The image could not be shared."));
    expect(share).toHaveBeenCalledTimes(1);
    expect(share.mock.calls[0][0].files).toHaveLength(1);
  });

  it("does not claim success when sharing is cancelled", async () => {
    const { share } = mockImageSharing(vi.fn().mockRejectedValue(new DOMException("Cancelled", "AbortError")));
    openSharing();
    const button = await screen.findByRole("button", { name: "Share image + link" });
    await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(button);
    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("keeps image sharing disabled if the image cannot be loaded", async () => {
    const { share, fetchImage } = mockImageSharing();
    fetchImage.mockResolvedValue({ ok: false });
    openSharing();
    await screen.findByText(/The image could not be prepared/);
    expect((screen.getByRole("button", { name: "Share image + link" }) as HTMLButtonElement).disabled).toBe(true);
    expect(share).not.toHaveBeenCalled();
  });

  it("keeps image sharing disabled when the device rejects file sharing", async () => {
    const { share } = mockImageSharing(vi.fn(), vi.fn().mockReturnValue(false));
    openSharing();
    await screen.findByText(/This browser cannot attach images directly/);
    expect((screen.getByRole("button", { name: "Share image + link" }) as HTMLButtonElement).disabled).toBe(true);
    expect(share).not.toHaveBeenCalled();
  });
});
