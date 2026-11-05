"use client";

import { Accessibility } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  ACCESSIBILITY_PREFERENCES_KEY,
  applyAccessibilityPreferences,
  defaultAccessibilityPreferences,
  readAccessibilityPreferences,
  type AccessibilityPreferences,
} from "@/lib/accessibility-preferences";

export function AccessibilitySettings() {
  const [preferences, setPreferences] = useState(defaultAccessibilityPreferences());
  const [isOpen, setIsOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const mediaQuery = typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    const load = () => {
      let saved: string | null = null;
      try { saved = window.localStorage.getItem(ACCESSIBILITY_PREFERENCES_KEY); } catch {}
      const next = readAccessibilityPreferences(saved, mediaQuery?.matches ?? false);
      setPreferences(next);
      applyAccessibilityPreferences(next);
    };
    const updateSystemMotionPreference = () => {
      try {
        if (window.localStorage.getItem(ACCESSIBILITY_PREFERENCES_KEY)) return;
      } catch {}
      const next = { ...defaultAccessibilityPreferences(mediaQuery?.matches ?? false) };
      setPreferences(next);
      applyAccessibilityPreferences(next);
    };
    const syncAcrossTabs = (event: StorageEvent) => {
      if (event.key !== ACCESSIBILITY_PREFERENCES_KEY && event.key !== null) return;
      const next = readAccessibilityPreferences(event.newValue, mediaQuery?.matches ?? false);
      setPreferences(next);
      applyAccessibilityPreferences(next);
    };

    load();
    mediaQuery?.addEventListener("change", updateSystemMotionPreference);
    window.addEventListener("storage", syncAcrossTabs);
    return () => {
      mediaQuery?.removeEventListener("change", updateSystemMotionPreference);
      window.removeEventListener("storage", syncAcrossTabs);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!anchorRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
    };
  }, [isOpen]);

  function updatePreferences(update: Partial<AccessibilityPreferences>) {
    const next = { ...preferences, ...update };
    setPreferences(next);
    applyAccessibilityPreferences(next);
    try { window.localStorage.setItem(ACCESSIBILITY_PREFERENCES_KEY, JSON.stringify(next)); } catch {}
  }

  function resetPreferences() {
    let prefersReducedMotion = false;
    try { prefersReducedMotion = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch {}
    const defaults = defaultAccessibilityPreferences(prefersReducedMotion);
    setPreferences(defaults);
    applyAccessibilityPreferences(defaults);
    try { window.localStorage.removeItem(ACCESSIBILITY_PREFERENCES_KEY); } catch {}
  }

  return (
    <div className="accessibility-settings-anchor" ref={anchorRef}>
      <button
        aria-controls="accessibility-settings-panel"
        aria-expanded={isOpen}
        aria-label="Accessibility settings"
        className="accessibility-settings-trigger"
        onClick={() => setIsOpen((open) => !open)}
        ref={triggerRef}
        type="button"
      >
        <Accessibility aria-hidden="true" size={18} />
        <span>Accessibility</span>
      </button>
      <section
        aria-labelledby="accessibility-settings-title"
        className="accessibility-settings-panel"
        hidden={!isOpen}
        id="accessibility-settings-panel"
        role="region"
      >
        <div className="accessibility-panel-heading">
          <h2 id="accessibility-settings-title">Accessibility settings</h2>
          <button type="button" className="accessibility-close" onClick={() => setIsOpen(false)} aria-label="Close accessibility settings">×</button>
        </div>
        <p className="accessibility-panel-intro">These preferences are saved in this browser. Your default light and dark themes stay unchanged.</p>
        <label className="accessibility-range-label" htmlFor="light-mode-brightness">
          <span>Light mode brightness</span>
          <output>{preferences.brightness}%</output>
        </label>
        <input
          id="light-mode-brightness"
          className="accessibility-range"
          type="range"
          min="70"
          max="100"
          step="5"
          value={preferences.brightness}
          aria-label="Light mode brightness"
          aria-valuetext={`${preferences.brightness}% light mode brightness`}
          onChange={(event) => updatePreferences({ brightness: Number(event.target.value) })}
        />
        <p className="accessibility-help">Only the site interface is dimmed in light mode. Video playback keeps its original brightness.</p>

        <label className="accessibility-select-label" htmlFor="accessibility-text-size">Text size</label>
        <select id="accessibility-text-size" value={preferences.textSize} onChange={(event) => updatePreferences({ textSize: event.target.value as AccessibilityPreferences["textSize"] })}>
          <option value="default">Default</option>
          <option value="large">Large</option>
          <option value="largest">Largest</option>
        </select>
        <p className="accessibility-help">The larger settings zoom the page while keeping heading and paragraph sizes in proportion.</p>

        <label className="accessibility-select-label" htmlFor="accessibility-color-vision">Color vision palette</label>
        <select
          id="accessibility-color-vision"
          value={preferences.colorVisionMode}
          onChange={(event) => updatePreferences({ colorVisionMode: event.target.value as AccessibilityPreferences["colorVisionMode"] })}
        >
          <option value="standard">Standard colors</option>
          <option value="protanopia">Protanopia (red-weak or red-blind)</option>
          <option value="deuteranopia">Deuteranopia (green-weak or green-blind)</option>
          <option value="tritanopia">Tritanopia (blue-yellow deficiency)</option>
          <option value="monochromacy">Monochromacy (little or no color vision)</option>
        </select>

        <fieldset className="accessibility-options">
          <legend>Reading and navigation</legend>
          <label><input type="checkbox" checked={preferences.relaxedLineSpacing} onChange={(event) => updatePreferences({ relaxedLineSpacing: event.target.checked })} /> More line spacing</label>
          <label><input type="checkbox" checked={preferences.underlineLinks} onChange={(event) => updatePreferences({ underlineLinks: event.target.checked })} /> Underline links</label>
          <label><input type="checkbox" checked={preferences.highContrast} onChange={(event) => updatePreferences({ highContrast: event.target.checked })} /> High contrast colors</label>
          <label><input type="checkbox" checked={preferences.enhancedFocus} onChange={(event) => updatePreferences({ enhancedFocus: event.target.checked })} /> Extra visible keyboard focus</label>
          <label><input type="checkbox" checked={preferences.reduceMotion} onChange={(event) => updatePreferences({ reduceMotion: event.target.checked })} /> Reduce interface motion</label>
        </fieldset>
        <p className="accessibility-help">These site-wide palettes change accent, link, and status colors for the selected color-vision profile. They do not simulate vision or alter video colors. Status messages keep their text labels.</p>
        <button className="accessibility-reset" type="button" onClick={resetPreferences}>Reset to defaults</button>
      </section>
    </div>
  );
}
