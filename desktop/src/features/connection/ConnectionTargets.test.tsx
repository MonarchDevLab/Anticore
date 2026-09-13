import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ConnectionTargets, { getDistinctTargets } from "./ConnectionTargets";
import { connectionCopy } from "./copy";

describe("getDistinctTargets", () => {
  it("deduplicates subdomains and prefers root domain", () => {
    const rawHosts = [
      "discord.com",
      "cdn.discordapp.com",
      "api.roblox.com",
      "assetdelivery.roblox.com",
      "roblox.com",
      "setup.rbxcdn.com",
      "wattpad.com",
      "eksisozluk.com",
      "pastebin.com",
    ];

    const result = getDistinctTargets(rawHosts);

    // Roblox should only appear once, and it must prefer roblox.com over subdomains
    const robloxMatches = result.filter((h) => h.includes("roblox"));
    expect(robloxMatches).toEqual(["roblox.com"]);

    // Discord should only appear once
    const discordMatches = result.filter((h) => h.includes("discord"));
    expect(discordMatches).toEqual(["discord.com"]);

    // Diverse targets must all be present
    expect(result).toContain("wattpad.com");
    expect(result).toContain("eksisozluk.com");
    expect(result).toContain("pastebin.com");
  });

  it("handles multi-part country TLDs properly", () => {
    const rawHosts = [
      "eksisozluk1923.com",
      "haber.gov.tr",
      "portal.gov.tr",
    ];
    const result = getDistinctTargets(rawHosts);
    expect(result).toContain("eksisozluk1923.com");
    // Different government subdomains are distinct institutions
    const govHosts = result.filter((h) => h.endsWith(".gov.tr"));
    expect(govHosts.length).toBe(2);
  });
});

describe("ConnectionTargets component", () => {
  const mockCopy = connectionCopy.tr;
  const mockHosts = [
    "discord.com",
    "roblox.com",
    "api.roblox.com",
    "wattpad.com",
    "eksisozluk.com",
    "imgur.com",
    "pastebin.com",
  ];

  it("renders distinct targets without duplicate roblox subdomains", () => {
    render(
      <ConnectionTargets
        hosts={mockHosts}
        session="1"
        copy={mockCopy}
        onManage={vi.fn()}
      />
    );

    // Page 1 should show discord.com, roblox.com, wattpad.com
    expect(screen.getByText("discord.com")).toBeDefined();
    expect(screen.getByText("roblox.com")).toBeDefined();
    expect(screen.getByText("wattpad.com")).toBeDefined();
    expect(screen.queryByText("api.roblox.com")).toBeNull();
  });

  it("rotates to next batch of targets on shuffle button click", () => {
    render(
      <ConnectionTargets
        hosts={mockHosts}
        session="1"
        copy={mockCopy}
        onManage={vi.fn()}
      />
    );

    const cycleButton = screen.getByTitle(mockCopy.cycleTargets);
    expect(cycleButton).toBeDefined();

    // Click shuffle/rotate
    fireEvent.click(cycleButton);

    // Now page 2 should show eksisozluk.com, imgur.com, pastebin.com
    expect(screen.getByText("eksisozluk.com")).toBeDefined();
    expect(screen.getByText("imgur.com")).toBeDefined();
    expect(screen.getByText("pastebin.com")).toBeDefined();
    expect(screen.queryByText("discord.com")).toBeNull();
  });
});
