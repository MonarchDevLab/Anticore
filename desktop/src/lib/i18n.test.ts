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

  it("should contain required quick panel keys in both languages", () => {
    const qpKeys = [
      "qp_title",
      "qp_active",
      "qp_passive",
      "qp_engine_active",
      "qp_engine_passive",
      "qp_profile",
      "qp_telemetry_pps",
      "qp_telemetry_bypass",
      "qp_telemetry_latency",
      "qp_action_dns",
      "qp_action_discord",
      "qp_open_main",
      "qp_quit",
    ] as const;

    for (const k of qpKeys) {
      expect(translations.tr[k]).toBeDefined();
      expect(translations.en[k]).toBeDefined();
    }
  });
});
