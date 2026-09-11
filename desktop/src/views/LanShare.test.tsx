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
};

vi.mock("../lib/tauri", () => ({
  api: {
    getLanInfo: vi.fn(),
    startLanProxy: vi.fn(),
    stopLanProxy: vi.fn(),
    setLanShareHotspotMode: vi.fn(),
    openHotspotSettings: vi.fn(),
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

it("switches guide tabs between iOS and Android", async () => {
  render(<LanShare pushLog={vi.fn()} />);

  await screen.findByText("192.168.1.150");

  expect(screen.getByText("lan_guide_ios_step1")).toBeDefined();

  const androidTab = screen.getByRole("button", { name: /Android/i });
  fireEvent.click(androidTab);

  expect(screen.getByText("lan_guide_android_step1")).toBeDefined();
});
