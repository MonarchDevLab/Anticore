import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import Setup from "./Setup";
import { api } from "../lib/tauri";

vi.mock("../lib/tauri", () => ({ api: {
  getSetupStatus: vi.fn(), listProfiles: vi.fn(), checkIsAdmin: vi.fn(), detachedStart: vi.fn(),
} }));
vi.mock("../lib/i18n", () => ({ useI18n: () => ({ lang: "tr", t: (key: string) => key }) }));
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.listProfiles).mockResolvedValue([{ id: "universal", name: "Universal", builtin: true, description: "", steps: [] }]);
  vi.mocked(api.checkIsAdmin).mockResolvedValue(true);
  vi.mocked(api.getSetupStatus).mockResolvedValue({ service_installed: false, service_running: false, detached_running: false });
});
afterEach(cleanup);

it("shows unknown state and blocks starts when status cannot be read", async () => {
  vi.mocked(api.getSetupStatus).mockRejectedValue(new Error("SC query failed"));
  render(<Setup pushLog={vi.fn()} />);
  expect((await screen.findByRole("alert")).textContent).toContain("SC query failed");
  expect((screen.getByRole("button", { name: "setup_detached_btn" }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.queryByText("setup_status_not_installed")).toBeNull();
});

it("blocks privileged actions for a non-admin user", async () => {
  vi.mocked(api.checkIsAdmin).mockResolvedValue(false);
  render(<Setup pushLog={vi.fn()} />);
  await screen.findByText("privilege_required_title");
  expect((screen.getByRole("button", { name: "setup_service_btn" }) as HTMLButtonElement).disabled).toBe(true);
});

it("surfaces a detached startup failure without reporting success", async () => {
  vi.mocked(api.detachedStart).mockRejectedValue(new Error("Driver failed"));
  const log = vi.fn();
  render(<Setup pushLog={log} />);
  const start = screen.getByRole("button", { name: "setup_detached_btn" }) as HTMLButtonElement;
  await waitFor(() => expect(start.disabled).toBe(false));
  fireEvent.click(start);
  expect((await screen.findByRole("alert")).textContent).toContain("Driver failed");
  expect(log.mock.calls.flat().some((line) => String(line).startsWith("[+]"))).toBe(false);
});
