"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ArrowUpRight, Copy, Download, Forward, ImagePlus, Mail, X } from "lucide-react";
import { shareLinks, socialPreview } from "@/lib/share";

type ShareData = { title: string; url: string };
type ShareImage = { state: "loading" | "unsupported" | "error" } | { state: "ready"; file: File };
const imageSource = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${new URL(socialPreview.url).pathname}`;

function ShareDialog({ data, onClose }: { data: ShareData; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");
  const supportsFileSharing = typeof navigator.share === "function" && typeof navigator.canShare === "function";
  const [image, setImage] = useState<ShareImage>({ state: supportsFileSharing ? "loading" : "unsupported" });
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!supportsFileSharing) return;
    const controller = new AbortController();
    // Prepare the file before the next tap, preserving user activation for share().
    const prepareImage = async () => {
      try {
        const response = await fetch(imageSource, { signal: controller.signal });
        if (!response.ok) throw new Error("Image unavailable");
        const blob = await response.blob();
        if (!blob.size || (blob.type && !blob.type.startsWith("image/"))) throw new Error("Invalid image");
        const file = new File([blob], "Kerygma-Path.jpg", { type: "image/jpeg" });
        if (!controller.signal.aborted) {
          setImage(navigator.canShare({ files: [file] }) ? { state: "ready", file } : { state: "unsupported" });
        }
      } catch {
        if (!controller.signal.aborted) setImage({ state: "error" });
      }
    };
    void prepareImage();
    return () => controller.abort();
  }, [supportsFileSharing]);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(data.url);
      setStatus("Link copied!");
    } catch {
      linkRef.current?.focus();
      linkRef.current?.select();
      setStatus("Select and copy the link below.");
    }
  };

  const nativeShare = async () => {
    if (image.state !== "ready" || sharing) return;
    setSharing(true);
    setStatus("");
    try {
      await navigator.share({
        files: [image.file],
        title: data.title,
        text: `${data.title}\n${data.url}`,
      });
      setStatus("Image sent to your sharing app. Check the image and link before posting.");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setStatus("The image could not be shared. Download it and attach it to your post or email.");
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <dialog
      aria-labelledby="site-share-title"
      className="site-share-dialog"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      onKeyDown={(event) => { if (event.key === "Escape") event.stopPropagation(); }}
      ref={dialogRef}
    >
      <div className="site-share-panel">
        <div className="site-share-heading">
          <h2 id="site-share-title">Share Kerygma Path</h2>
          <button aria-label="Close sharing options" className="site-share-close" onClick={onClose} type="button" autoFocus><X aria-hidden="true" size={20} /></button>
        </div>
        <p>Share this image with the page link.</p>
        <Image alt={socialPreview.alt} className="site-share-preview" height={socialPreview.height} src={imageSource} width={socialPreview.width} />
        <div className="site-share-actions site-share-image-actions">
          <button aria-describedby="site-share-image-help" className="site-share-image-button" disabled={image.state !== "ready" || sharing} onClick={nativeShare} type="button">
            <ImagePlus aria-hidden="true" size={19} /><span>{image.state === "loading" ? "Preparing image…" : "Share image + link"}</span>
          </button>
          <a download="Kerygma-Path.jpg" href={imageSource}><Download aria-hidden="true" size={18} /><span>Download image</span></a>
        </div>
        <p className="site-share-help" id="site-share-image-help">
          {image.state === "unsupported"
            ? "This browser cannot attach images directly. Download the image, then attach it to your post or email."
            : image.state === "error"
              ? "The image could not be prepared for sharing. Download it and attach it to your post or email."
              : "Choose an app to receive the image file and page link. Check both are included before posting; each app handles sharing differently."}
        </p>
        <div className="site-share-actions">
          <button onClick={copyLink} type="button"><Copy aria-hidden="true" size={18} /><span>Copy link</span></button>
          <a href={`mailto:?subject=${encodeURIComponent(data.title)}&body=${encodeURIComponent(`${data.title}\n${data.url}\n\n${socialPreview.url}`)}`}><Mail aria-hidden="true" size={18} /><span>Email link</span></a>
        </div>
        <p className="site-share-help">Email link opens a message with links only. To include an attachment, use Share image + link with your email app, or download and attach the image.</p>
        <details className="site-share-link-options">
          <summary>Share a link instead</summary>
          <p className="site-share-help">These buttons share a link. Image previews are controlled by the platform; they are not photo attachments.</p>
          <div aria-label="Social sharing options" className="site-share-platforms">
            {shareLinks(data.url, data.title).map(({ name, href }) => (
              <a href={href} key={name} rel="noopener noreferrer" target="_blank">
                <span>{name}</span><ArrowUpRight aria-hidden="true" size={16} />
              </a>
            ))}
          </div>
        </details>
        <label className="site-share-link-label" htmlFor="site-share-link">Page link</label>
        <input className="site-share-link" id="site-share-link" onFocus={(event) => event.target.select()} readOnly ref={linkRef} value={data.url} />
        <p aria-live="polite" className="site-share-status" role="status">{status}</p>
      </div>
    </dialog>
  );
}

export function SiteShareButton() {
  const [data, setData] = useState<ShareData | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const close = () => {
    setData(null);
    // Restore focus after the native modal has been removed.
    requestAnimationFrame(() => {
      // The desktop controls may have retracted while the dialog was open.
      const handle = document.querySelector<HTMLButtonElement>(".desktop-utility-handle");
      if (window.matchMedia("(min-width: 769px)").matches && handle?.getAttribute("aria-expanded") !== "true") {
        handle?.focus();
      } else {
        buttonRef.current?.focus();
      }
    });
  };

  return (
    <>
      <button
        aria-expanded={data !== null}
        aria-haspopup="dialog"
        aria-label="Share this page"
        className="site-share-toggle"
        onClick={() => {
          const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href;
          setData({ title: document.title, url: canonical ?? "https://kerygmapath.com/" });
        }}
        ref={buttonRef}
        title="Share this page"
        type="button"
      ><Forward aria-hidden="true" size={20} strokeWidth={1.8} /></button>
      {data && createPortal(<ShareDialog data={data} onClose={close} />, document.body)}
    </>
  );
}
