import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { AccessibilitySettings } from "@/components/AccessibilitySettings";
import { ACCESSIBILITY_PREFERENCES_KEY } from "@/lib/accessibility-preferences";

beforeEach(() => {
  window.localStorage.removeItem(ACCESSIBILITY_PREFERENCES_KEY);
  for (const attribute of [
    "accessibilityBrightness", "accessibilityTextSize", "accessibilityLineSpacing",
    "accessibilityUnderlineLinks", "accessibilityContrast", "accessibilityColorVision",
    "accessibilityEnhancedFocus", "accessibilityReduceMotion",
  ]) document.documentElement.removeAttribute("data-" + attribute.replace(/[A-Z]/g, (letter) => "-" + letter.toLowerCase()));
  document.documentElement.style.removeProperty("--light-mode-overlay-opacity");
});

describe("AccessibilitySettings", () => {
  it("opens as a labeled disclosure and persists changed preferences", async () => {
    render(<AccessibilitySettings />);
    const trigger = screen.getByRole("button", { name: "Accessibility settings" });
    fireEvent.click(trigger);

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("region", { name: "Accessibility settings" })).toBeTruthy();
    fireEvent.change(screen.getByRole("slider", { name: "Light mode brightness" }), { target: { value: "85" } });

    await waitFor(() => expect(document.documentElement.dataset.accessibilityBrightness).toBe("85"));
    expect(JSON.parse(window.localStorage.getItem(ACCESSIBILITY_PREFERENCES_KEY) ?? "{}").brightness).toBe(85);
    expect(screen.getByText("85%")).toBeTruthy();
  });

  it("applies every checkbox and color-vision profile to the whole document", async () => {
    render(<AccessibilitySettings />);
    fireEvent.click(screen.getByRole("button", { name: "Accessibility settings" }));

    for (const label of [
      "More line spacing",
      "Underline links",
      "High contrast colors",
      "Extra visible keyboard focus",
      "Reduce interface motion",
    ]) {
      fireEvent.click(screen.getByRole("checkbox", { name: label }));
    }

    const palette = screen.getByRole("combobox", { name: "Color vision palette" }) as HTMLSelectElement;
    for (const mode of ["protanopia", "deuteranopia", "tritanopia", "monochromacy", "standard"]) {
      fireEvent.change(palette, { target: { value: mode } });
      expect(document.documentElement.dataset.accessibilityColorVision).toBe(mode);
    }
    fireEvent.change(screen.getByRole("combobox", { name: "Text size" }), { target: { value: "largest" } });

    await waitFor(() => {
      expect(document.documentElement.dataset.accessibilityLineSpacing).toBe("true");
      expect(document.documentElement.dataset.accessibilityUnderlineLinks).toBe("true");
      expect(document.documentElement.dataset.accessibilityContrast).toBe("high");
      expect(document.documentElement.dataset.accessibilityEnhancedFocus).toBe("true");
      expect(document.documentElement.dataset.accessibilityReduceMotion).toBe("true");
      expect(document.documentElement.dataset.accessibilityTextSize).toBe("largest");
    });
    const saved = JSON.parse(window.localStorage.getItem(ACCESSIBILITY_PREFERENCES_KEY) ?? "{}");
    expect(saved).toMatchObject({
      relaxedLineSpacing: true, underlineLinks: true, highContrast: true,
      enhancedFocus: true, reduceMotion: true, textSize: "largest", colorVisionMode: "standard",
    });
  });

  it("resets preferences and closes with Escape while returning focus to its trigger", () => {
    window.localStorage.setItem(ACCESSIBILITY_PREFERENCES_KEY, JSON.stringify({ brightness: 75, highContrast: true }));
    render(<AccessibilitySettings />);
    const trigger = screen.getByRole("button", { name: "Accessibility settings" });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "Reset to defaults" }));

    expect(window.localStorage.getItem(ACCESSIBILITY_PREFERENCES_KEY)).toBeNull();
    expect(document.documentElement.dataset.accessibilityBrightness).toBe("100");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("region", { name: "Accessibility settings" })).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
