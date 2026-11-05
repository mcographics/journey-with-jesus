import { afterEach, describe, expect, it } from "vitest";
import {
  ACCESSIBILITY_PREFERENCES_KEY,
  applyAccessibilityPreferences,
  defaultAccessibilityPreferences,
  normalizeAccessibilityPreferences,
  readAccessibilityPreferences,
} from "@/lib/accessibility-preferences";

afterEach(() => {
  document.documentElement.removeAttribute("data-accessibility-brightness");
  document.documentElement.removeAttribute("data-accessibility-text-size");
  document.documentElement.removeAttribute("data-accessibility-line-spacing");
  document.documentElement.removeAttribute("data-accessibility-underline-links");
  document.documentElement.removeAttribute("data-accessibility-contrast");
  document.documentElement.removeAttribute("data-accessibility-color-vision");
  document.documentElement.removeAttribute("data-accessibility-enhanced-focus");
  document.documentElement.removeAttribute("data-accessibility-reduce-motion");
  document.documentElement.style.removeProperty("--light-mode-overlay-opacity");
  window.localStorage.removeItem(ACCESSIBILITY_PREFERENCES_KEY);
});

describe("accessibility preferences", () => {
  it("keeps the default light appearance unchanged and follows reduced-motion preferences", () => {
    expect(defaultAccessibilityPreferences(true)).toEqual({
      brightness: 100,
      textSize: "default",
      relaxedLineSpacing: false,
      underlineLinks: false,
      highContrast: false,
      colorVisionMode: "standard",
      enhancedFocus: false,
      reduceMotion: true,
    });
  });

  it("clamps brightness to supported 5 percent steps and validates stored values", () => {
    expect(normalizeAccessibilityPreferences({ brightness: 58, textSize: "largest", highContrast: true })).toEqual({
      brightness: 70,
      textSize: "largest",
      relaxedLineSpacing: false,
      underlineLinks: false,
      highContrast: true,
      colorVisionMode: "standard",
      enhancedFocus: false,
      reduceMotion: false,
    });
    expect(normalizeAccessibilityPreferences({ brightness: 97.5 }).brightness).toBe(100);
  });

  it("validates selected vision profiles and migrates the former on/off setting", () => {
    expect(normalizeAccessibilityPreferences({ colorVisionMode: "tritanopia" }).colorVisionMode).toBe("tritanopia");
    expect(normalizeAccessibilityPreferences({ colorVisionMode: "unknown" }).colorVisionMode).toBe("standard");
    expect(normalizeAccessibilityPreferences({ colorVisionFriendly: true }).colorVisionMode).toBe("deuteranopia");
  });

  it("uses OS reduced motion as the default and safely ignores invalid saved JSON", () => {
    expect(readAccessibilityPreferences(null, true).reduceMotion).toBe(true);
    expect(readAccessibilityPreferences("not-json", true).reduceMotion).toBe(true);
  });

  it("applies preferences as document settings without applying a brightness filter", () => {
    const preferences = normalizeAccessibilityPreferences({
      brightness: 85, textSize: "large", relaxedLineSpacing: true, underlineLinks: true,
      highContrast: true, colorVisionMode: "tritanopia", enhancedFocus: true, reduceMotion: true,
    });
    applyAccessibilityPreferences(preferences);

    expect(document.documentElement.dataset.accessibilityBrightness).toBe("85");
    expect(document.documentElement.dataset.accessibilityTextSize).toBe("large");
    expect(document.documentElement.dataset.accessibilityLineSpacing).toBe("true");
    expect(document.documentElement.dataset.accessibilityUnderlineLinks).toBe("true");
    expect(document.documentElement.dataset.accessibilityContrast).toBe("high");
    expect(document.documentElement.dataset.accessibilityColorVision).toBe("tritanopia");
    expect(document.documentElement.dataset.accessibilityEnhancedFocus).toBe("true");
    expect(document.documentElement.dataset.accessibilityReduceMotion).toBe("true");
    expect(document.documentElement.style.getPropertyValue("--light-mode-overlay-opacity")).toBe("0.1");
    expect(document.body.style.filter).toBe("");
  });
});
