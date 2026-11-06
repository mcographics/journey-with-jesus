export const ACCESSIBILITY_PREFERENCES_KEY = "journey-with-jesus-accessibility";

export type TextSize = "default" | "large" | "largest";

export const COLOR_VISION_MODES = ["standard", "protanopia", "deuteranopia", "tritanopia", "monochromacy"] as const;
export type ColorVisionMode = (typeof COLOR_VISION_MODES)[number];

export type AccessibilityPreferences = {
  brightness: number;
  textSize: TextSize;
  relaxedLineSpacing: boolean;
  underlineLinks: boolean;
  highContrast: boolean;
  colorVisionMode: ColorVisionMode;
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
    colorVisionMode: "standard",
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
  const colorVisionMode: ColorVisionMode = COLOR_VISION_MODES.includes(input.colorVisionMode as ColorVisionMode)
    ? input.colorVisionMode as ColorVisionMode
    : input.colorVisionFriendly === true ? "deuteranopia" : fallback.colorVisionMode;

  return {
    brightness,
    textSize,
    relaxedLineSpacing: typeof input.relaxedLineSpacing === "boolean" ? input.relaxedLineSpacing : fallback.relaxedLineSpacing,
    underlineLinks: typeof input.underlineLinks === "boolean" ? input.underlineLinks : fallback.underlineLinks,
    highContrast: typeof input.highContrast === "boolean" ? input.highContrast : fallback.highContrast,
    colorVisionMode,
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
  root.dataset.accessibilityColorVision = preferences.colorVisionMode;
  root.dataset.accessibilityEnhancedFocus = String(preferences.enhancedFocus);
  root.dataset.accessibilityReduceMotion = String(preferences.reduceMotion);
  root.dataset.accessibilityBrightness = String(preferences.brightness);
  root.style.setProperty("--light-mode-overlay-opacity", "0");
  root.style.setProperty("--light-surface-mix", `${((100 - preferences.brightness) / 30) * 45}%`);
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
