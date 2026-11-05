import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { AccessibilitySettings } from "@/components/AccessibilitySettings";
import { ACCESSIBILITY_PREFERENCES_KEY } from "@/lib/accessibility-preferences";

beforeEach(() => {
  window.localStorage.removeItem(ACCESSIBILITY_PREFERENCES_KEY);
  document.documentElement.dataset.accessibilityBrightness = "100";
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
