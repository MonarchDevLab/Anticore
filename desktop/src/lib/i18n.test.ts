import { describe, it, expect } from "vitest";
import { setStoredLanguage, getStoredLanguage, translations } from "./i18n";

describe("i18n module", () => {
  it("should set and get language", () => {
    setStoredLanguage("en");
    expect(getStoredLanguage()).toBe("en");
    
    setStoredLanguage("tr");
    expect(getStoredLanguage()).toBe("tr");
  });

  it("should contain required navigation keys", () => {
    expect(translations.tr["nav_dashboard"]).toBeDefined();
    expect(translations.en["nav_dashboard"]).toBeDefined();
  });
});
