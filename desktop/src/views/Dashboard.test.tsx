import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import Dashboard from "./Dashboard";

const profiles = [{ id: "universal", name: "Universal", steps: [], description: "" }];
vi.mock("../features/connection/useConnectionData", () => ({ useConnectionData: () => ({
  profiles, hosts: [], dns: null, error: false, loading: false,
}) }));
vi.mock("../lib/i18n", () => ({ useI18n: () => ({ lang: "tr" }) }));
vi.mock("../features/connection/ConnectionActivity", () => ({ default: () => null }));
vi.mock("../features/connection/ConnectionTargets", () => ({ default: () => null }));
afterEach(cleanup);

it.each(["service", "detached"])("does not persist the %s mode name as a profile", async (mode) => {
  const select = vi.fn();
  render(<Dashboard status={{ running: true, profile_id: mode, packets_seen: 0, packets_touched: 0, passthrough: 0, uptime_sec: 0 }} running logs={[]} selectedProfile="universal" onSelectedProfileChange={select} onNavigate={vi.fn()} busy={false} onToggle={vi.fn()} />);
  await waitFor(() => expect(select).not.toHaveBeenCalled());
});
