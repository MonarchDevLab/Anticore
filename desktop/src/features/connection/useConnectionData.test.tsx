import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { api } from "../../lib/tauri";
import { useConnectionData } from "./useConnectionData";

vi.mock("../../lib/tauri", () => ({ api: {
  listProfiles: vi.fn(), getBlacklist: vi.fn(), checkDnsHealth: vi.fn(),
} }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });

it("clears stale successful data when a reload fails", async () => {
  vi.mocked(api.listProfiles).mockResolvedValue([{ id: "universal", name: "Universal", builtin: true, description: "", steps: [] }]);
  vi.mocked(api.getBlacklist).mockResolvedValue(["example.com"]);
  vi.mocked(api.checkDnsHealth).mockResolvedValue({ poisoned: false, resolved_ip: "1.1.1.1", is_secure: true, message: "ok" });
  const { result } = renderHook(useConnectionData);
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.profiles).toHaveLength(1);
  vi.mocked(api.listProfiles).mockRejectedValue(new Error("Disconnected"));
  vi.mocked(api.getBlacklist).mockRejectedValue(new Error("Disconnected"));
  vi.mocked(api.checkDnsHealth).mockRejectedValue(new Error("Disconnected"));
  act(() => result.current.reload());
  await waitFor(() => expect(result.current.error).toBe(true));
  expect(result.current.profiles).toEqual([]);
  expect(result.current.hosts).toEqual([]);
  expect(result.current.dns).toBeNull();
});
