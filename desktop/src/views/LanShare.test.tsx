import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import LanShare from "./LanShare";
import { api, type LanInfoDto } from "../lib/tauri";

const mockLanInfo: LanInfoDto = {
  local_ip: "192.168.1.150",
  proxy_port: 10808,
  proxy_running: false,
  hotspot_mode_enabled: false,
  active_connections: 0,
  total_connections: 0,
  bytes_transferred: 0,
  pac_url: "http://192.168.1.150:10808/anticore.pac",
  firewall_allowed: true,
  connected_devices: [],
};

vi.mock("../lib/tauri", () => ({
  api: {
    getLanInfo: vi.fn(),
    startLanProxy: vi.fn(),
    stopLanProxy: vi.fn(),
    setLanShareHotspotMode: vi.fn(),
    openHotspotSettings: vi.fn(),
    allowFirewallLanProxy: vi.fn(),
  },
}));

vi.mock("../lib/i18n", () => ({
  useI18n: () => ({
    lang: "tr",
    t: (key: string) => key,
  }),
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.getLanInfo).mockResolvedValue(mockLanInfo);
});

afterEach(cleanup);

it("renders LAN IP, port and PAC URL correctly", async () => {
  render(<LanShare pushLog={vi.fn()} />);

  await waitFor(() => {
    expect(screen.getByText("192.168.1.150")).toBeDefined();
  });
  expect(screen.getByText("10808")).toBeDefined();
  expect(screen.getByText("http://192.168.1.150:10808/anticore.pac")).toBeDefined();
});

it("calls startLanProxy when proxy toggle button is clicked", async () => {
  vi.mocked(api.startLanProxy).mockResolvedValue({
    ...mockLanInfo,
    proxy_running: true,
  });

  const pushLog = vi.fn();
  render(<LanShare pushLog={pushLog} />);

  await screen.findByText("192.168.1.150");

  const startBtn = screen.getByRole("button", { name: /lan_btn_start_proxy/i });
  fireEvent.click(startBtn);

  await waitFor(() => {
    expect(api.startLanProxy).toHaveBeenCalled();
  });
  expect(pushLog).toHaveBeenCalledWith(expect.stringContaining("[+]"));
});

it("calls openHotspotSettings when Windows Hotspot button is clicked", async () => {
  vi.mocked(api.openHotspotSettings).mockResolvedValue();
  const pushLog = vi.fn();
  render(<LanShare pushLog={pushLog} />);

  await screen.findByText("192.168.1.150");

  const hotspotBtn = screen.getByRole("button", { name: /lan_btn_open_hotspot/i });
  fireEvent.click(hotspotBtn);

  await waitFor(() => {
    expect(api.openHotspotSettings).toHaveBeenCalled();
  });
});

it("switches guide tabs between iOS, Android, PC and Console", async () => {
  render(<LanShare pushLog={vi.fn()} />);

  await screen.findByText("192.168.1.150");

  expect(screen.getByText("lan_guide_ios_step1")).toBeDefined();

  const androidTab = screen.getByRole("button", { name: /Android/i });
  fireEvent.click(androidTab);
  expect(screen.getByText("lan_guide_android_step1")).toBeDefined();

  const pcTab = screen.getByRole("button", { name: /PC \/ Mac/i });
  fireEvent.click(pcTab);
  expect(screen.getByText(/lan_guide_pc_step1/i)).toBeDefined();

  const consoleTab = screen.getByRole("button", { name: /Konsol/i });
  fireEvent.click(consoleTab);
  expect(screen.getByText(/lan_guide_console_step1/i)).toBeDefined();
});

it("renders connected devices table with IP, MAC, and vendor information", async () => {
  vi.mocked(api.getLanInfo).mockResolvedValue({
    ...mockLanInfo,
    connected_devices: [
      {
        ip: "192.168.1.75",
        mac: "3C:22:FB:AB:CD:EF",
        vendor: "Apple Inc. (iPhone / iPad / Mac)",
        device_type: "mobile",
        active_streams: 2,
        total_requests: 45,
        bytes_transferred: 1048576,
        last_seen_secs_ago: 3,
        last_target: "discord.com:443",
      },
    ],
  });

  render(<LanShare pushLog={vi.fn()} />);

  await waitFor(() => {
    expect(screen.getByText("192.168.1.75")).toBeDefined();
  });
  expect(screen.getByText("3C:22:FB:AB:CD:EF")).toBeDefined();
  expect(screen.getByText("Apple Inc. (iPhone / iPad / Mac)")).toBeDefined();
  expect(screen.getByText("1 MB")).toBeDefined();
  expect(screen.getByText("discord.com:443")).toBeDefined();
});

it("shows firewall warning and calls allowFirewallLanProxy when clicked", async () => {
  vi.mocked(api.getLanInfo).mockResolvedValue({
    ...mockLanInfo,
    firewall_allowed: false,
  });
  vi.mocked(api.allowFirewallLanProxy).mockResolvedValue(true);

  render(<LanShare pushLog={vi.fn()} />);

  await waitFor(() => {
    expect(screen.getByText("lan_firewall_status_warn")).toBeDefined();
  });

  const fixBtn = screen.getByRole("button", { name: /lan_btn_fix_firewall/i });
  fireEvent.click(fixBtn);

  await waitFor(() => {
    expect(api.allowFirewallLanProxy).toHaveBeenCalled();
  });
});
