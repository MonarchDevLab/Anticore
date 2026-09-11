import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import Wizard from "./Wizard";
import { api } from "../lib/tauri";

vi.mock("../lib/tauri", () => ({ api: {
  addSites: vi.fn(), startEngine: vi.fn(), applySecureDns: vi.fn(), applyDohRegistry: vi.fn(),
} }));
vi.mock("../lib/i18n", () => ({ useI18n: () => ({ lang: "tr", t: (key: string) => key }) }));
beforeEach(() => { vi.resetAllMocks(); localStorage.clear(); });
afterEach(cleanup);

function finishWizard(onComplete = vi.fn()) {
  render(<Wizard onComplete={onComplete} pushLog={vi.fn()} />);
  for (let step = 0; step < 3; step++) fireEvent.click(screen.getByText("wiz_next"));
  fireEvent.click(screen.getByText("wiz_finish"));
  return onComplete;
}

it("keeps onboarding incomplete when the engine cannot start", async () => {
  vi.mocked(api.startEngine).mockRejectedValue(new Error("Driver unavailable"));
  const complete = finishWizard();
  expect((await screen.findByRole("alert")).textContent).toContain("Driver unavailable");
  expect(complete).not.toHaveBeenCalled();
  expect(localStorage.getItem("anticore_onboarded")).toBeNull();
});

it("does not change DNS by default and remembers the successful profile", async () => {
  const complete = finishWizard();
  await waitFor(() => expect(complete).toHaveBeenCalledOnce());
  expect(api.applySecureDns).not.toHaveBeenCalled();
  expect(api.applyDohRegistry).not.toHaveBeenCalled();
  expect(localStorage.getItem("anticore_last_profile")).toBe("universal");
});

it("does not start the engine after the site list fails", async () => {
  vi.mocked(api.addSites).mockRejectedValue(new Error("Cannot save sites"));
  finishWizard();
  expect((await screen.findByRole("alert")).textContent).toContain("Cannot save sites");
  expect(api.startEngine).not.toHaveBeenCalled();
});

it("applies DNS when checked and finishes onboarding", async () => {
  const complete = vi.fn();
  render(<Wizard onComplete={complete} pushLog={vi.fn()} />);
  for (let step = 0; step < 3; step++) fireEvent.click(screen.getByText("wiz_next"));
  const dnsCheckbox = screen.getByRole("checkbox");
  fireEvent.click(dnsCheckbox);
  fireEvent.click(screen.getByText("wiz_finish"));
  await waitFor(() => expect(complete).toHaveBeenCalledOnce());
  expect(api.applySecureDns).toHaveBeenCalledOnce();
  expect(api.applyDohRegistry).toHaveBeenCalledOnce();
  expect(api.startEngine).toHaveBeenCalledOnce();
});

it("continues engine startup even if optional DNS step fails with warning", async () => {
  vi.mocked(api.applySecureDns).mockRejectedValue(new Error("Permission denied"));
  const complete = vi.fn();
  render(<Wizard onComplete={complete} pushLog={vi.fn()} />);
  for (let step = 0; step < 3; step++) fireEvent.click(screen.getByText("wiz_next"));
  const dnsCheckbox = screen.getByRole("checkbox");
  fireEvent.click(dnsCheckbox);
  fireEvent.click(screen.getByText("wiz_finish"));
  await waitFor(() => expect(complete).toHaveBeenCalledOnce());
  expect(api.startEngine).toHaveBeenCalledOnce();
  expect(localStorage.getItem("anticore_onboarded")).toBe("true");
});

