"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, Copy, Forward, Mail, Smartphone, X } from "lucide-react";
import { shareLinks } from "@/lib/share";

type ShareData = { title: string; url: string };

function ShareDialog({ data, onClose }: { data: ShareData; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");
  const canShare = typeof navigator.share === "function";

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
    try {
      await navigator.share(data);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setStatus("Choose a platform or copy the link below.");
      }
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
        <p>Choose where to share this page.</p>
        <div aria-label="Social sharing options" className="site-share-platforms">
          {shareLinks(data.url, data.title).map(({ name, href }) => (
            <a href={href} key={name} rel="noopener noreferrer" target="_blank">
              <span>{name}</span><ArrowUpRight aria-hidden="true" size={16} />
            </a>
          ))}
        </div>
        <div className="site-share-actions">
          <button onClick={copyLink} type="button"><Copy aria-hidden="true" size={18} /><span>Copy link</span></button>
          <a href={`mailto:?subject=${encodeURIComponent(data.title)}&body=${encodeURIComponent(`${data.title}\n${data.url}`)}`}><Mail aria-hidden="true" size={18} /><span>Email</span></a>
          {canShare && <button onClick={nativeShare} type="button"><Smartphone aria-hidden="true" size={18} /><span>More apps…</span></button>}
        </div>
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
