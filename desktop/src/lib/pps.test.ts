import { describe, it, expect } from "vitest";

describe("PPS waveform and delta calculation", () => {
  it("should calculate delta correctly on normal packet increment", () => {
    const lastTouched = 100;
    const currentTouched = 125;
    const delta = Math.max(0, currentTouched - lastTouched);
    expect(delta).toBe(25);
  });

  it("should reset lastTouched if engine restarts and currentTouched < lastTouched", () => {
    let lastTouched = 500;
    const currentTouched = 10;
    if (currentTouched < lastTouched) {
      lastTouched = currentTouched;
    }
    const delta = Math.max(0, currentTouched - lastTouched);
    expect(delta).toBe(0);
    expect(lastTouched).toBe(10);
  });
});
