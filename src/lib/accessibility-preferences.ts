export const ACCESSIBILITY_PREFERENCES_KEY = "journey-with-jesus-accessibility";

export type TextSize = "default" | "large" | "largest";

export type AccessibilityPreferences = {
  brightness: number;
  textSize: TextSize;
  relaxedLineSpacing: boolean;
  underlineLinks: boolean;
  highContrast: boolean;
  enhancedFocus: boolean;
  reduceMotion: boolean;
};

export function defaultAccessibilityPreferences(reduceMotion = false): AccessibilityPreferences {
  return {
    brightness: 100,
    textSize: "default",
    relaxedLineSpacing: false,
    underlineLinks: false,
    highContrast: false,
    enhancedFocus: false,
    reduceMotion,
  };
}

export function normalizeAccessibilityPreferences(
  value: unknown,
  fallbackReduceMotion = false,
): AccessibilityPreferences {
  const fallback = defaultAccessibilityPreferences(fallbackReduceMotion);
  if (!value || typeof value !== "object") return fallback;
  const input = value as Record<string, unknown>;
  const brightness = typeof input.brightness === "number" && Number.isFinite(input.brightness)
    ? Math.round(Math.max(70, Math.min(100, input.brightness)) / 5) * 5
    : fallback.brightness;
  const textSize: TextSize = input.textSize === "large" || input.textSize === "largest"
    ? input.textSize
    : "default";

  return {
    brightness,
    textSize,
    relaxedLineSpacing: typeof input.relaxedLineSpacing === "boolean" ? input.relaxedLineSpacing : fallback.relaxedLineSpacing,
    underlineLinks: typeof input.underlineLinks === "boolean" ? input.underlineLinks : fallback.underlineLinks,
    highContrast: typeof input.highContrast === "boolean" ? input.highContrast : fallback.highContrast,
    enhancedFocus: typeof input.enhancedFocus === "boolean" ? input.enhancedFocus : fallback.enhancedFocus,
    reduceMotion: typeof input.reduceMotion === "boolean" ? input.reduceMotion : fallback.reduceMotion,
  };
}

export function applyAccessibilityPreferences(preferences: AccessibilityPreferences) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.accessibilityTextSize = preferences.textSize;
  root.dataset.accessibilityLineSpacing = String(preferences.relaxedLineSpacing);
  root.dataset.accessibilityUnderlineLinks = String(preferences.underlineLinks);
  root.dataset.accessibilityContrast = preferences.highContrast ? "high" : "standard";
  root.dataset.accessibilityEnhancedFocus = String(preferences.enhancedFocus);
  root.dataset.accessibilityReduceMotion = String(preferences.reduceMotion);
  root.dataset.accessibilityBrightness = String(preferences.brightness);
  const overlayOpacity = ((100 - preferences.brightness) / 30) * 0.2;
  root.style.setProperty("--light-mode-overlay-opacity", String(overlayOpacity));
}

export function readAccessibilityPreferences(
  serialized: string | null,
  prefersReducedMotion = false,
): AccessibilityPreferences {
  if (!serialized) return defaultAccessibilityPreferences(prefersReducedMotion);
  try {
    return normalizeAccessibilityPreferences(JSON.parse(serialized), prefersReducedMotion);
  } catch {
    return defaultAccessibilityPreferences(prefersReducedMotion);
  }
}
