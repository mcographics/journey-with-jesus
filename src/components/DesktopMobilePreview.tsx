"use client";

import { useEffect, useRef, useState } from "react";
import { Smartphone, X } from "lucide-react";

export function DesktopMobilePreview() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const desktopPointer = window.matchMedia("(min-width: 769px) and (hover: hover) and (pointer: fine)");
    const closeWhenUnavailable = () => {
      if (desktopPointer.matches) return;
      setIsOpen(false);
      if (dialogRef.current?.open) dialogRef.current.close();
    };

    desktopPointer.addEventListener("change", closeWhenUnavailable);
    closeWhenUnavailable();
    return () => desktopPointer.removeEventListener("change", closeWhenUnavailable);
  }, []);

  const openPreview = () => {
    if (!window.matchMedia("(min-width: 769px) and (hover: hover) and (pointer: fine)").matches) return;
    setPreviewUrl(`${window.location.pathname}${window.location.search}${window.location.hash}`);
    setIsOpen(true);
  };

  const closePreview = () => {
    const dialog = dialogRef.current;
    if (dialog?.open) {
      dialog.close();
    } else {
      setIsOpen(false);
    }
  };

  return (
    <>
      <button
        aria-controls="desktop-mobile-preview-dialog"
        aria-label="Preview the current page in a mobile layout"
        aria-pressed={isOpen}
        className="mobile-preview-trigger"
        id="desktop-mobile-preview-trigger"
        onClick={openPreview}
        type="button"
      >
        <Smartphone aria-hidden="true" size={16} strokeWidth={1.8} />
        <span>Mobile preview</span>
      </button>

      <dialog
        aria-labelledby="mobile-preview-title"
        className="mobile-preview-dialog"
        id="desktop-mobile-preview-dialog"
        onCancel={() => setIsOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) closePreview();
        }}
        onClose={() => setIsOpen(false)}
        ref={dialogRef}
      >
        <div className="mobile-preview-toolbar">
          <div className="mobile-preview-heading">
            <h2 id="mobile-preview-title">Mobile preview</h2>
            <span>390 px wide · desktop-only tool</span>
          </div>
          <button
            aria-label="Close mobile preview"
            className="mobile-preview-close"
            onClick={closePreview}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        <div className="mobile-preview-viewport">
          {isOpen && previewUrl ? (
            <iframe
              className="mobile-preview-frame"
              src={previewUrl}
              title="Current page in a 390 pixel mobile layout"
            />
          ) : null}
        </div>
      </dialog>
    </>
  );
}
