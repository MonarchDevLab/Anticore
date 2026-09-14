import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SupportView from "./SupportView";
import { connectivitySync } from "../services/connectivitySync";

vi.mock("../services/connectivitySync", () => ({
  connectivitySync: {
    sendFeedback: vi.fn(),
  },
}));

vi.mock("../lib/i18n", () => ({
  useI18n: () => ({
    lang: "tr",
    t: (key: string) => key,
  }),
}));

describe("SupportView Component", () => {
  const pushLog = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(cleanup);

  it("renders form elements correctly", () => {
    render(<SupportView pushLog={pushLog} />);
    expect(screen.getByText("support_title")).toBeDefined();
    expect(screen.getByText("support_cat_bug")).toBeDefined();
    expect(screen.getByLabelText(/support_label_subject/i)).toBeDefined();
    expect(screen.getByLabelText(/support_label_message/i)).toBeDefined();
  });

  it("shows error when message is under 10 characters", async () => {
    render(<SupportView pushLog={pushLog} />);
    const subjectInput = screen.getByLabelText(/support_label_subject/i);
    const messageInput = screen.getByLabelText(/support_label_message/i);
    const submitBtn = screen.getByRole("button", { name: /support_btn_send/i });

    fireEvent.change(subjectInput, { target: { value: "Test Başlığı" } });
    fireEvent.change(messageInput, { target: { value: "Kısa" } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText("support_error_message_req")).toBeDefined();
    expect(connectivitySync.sendFeedback).not.toHaveBeenCalled();
  });

  it("submits feedback successfully and switches to success card", async () => {
    vi.mocked(connectivitySync.sendFeedback).mockResolvedValue({ success: true });

    render(<SupportView pushLog={pushLog} />);
    const subjectInput = screen.getByLabelText(/support_label_subject/i);
    const messageInput = screen.getByLabelText(/support_label_message/i);
    const submitBtn = screen.getByRole("button", { name: /support_btn_send/i });

    fireEvent.change(subjectInput, { target: { value: "Discord bağlantı hatası" } });
    fireEvent.change(messageInput, { target: { value: "Bağlantı kurulurken sürekli zaman aşımına uğruyor." } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(connectivitySync.sendFeedback).toHaveBeenCalledWith(
        expect.objectContaining({
          category: "bug",
          subject: "Discord bağlantı hatası",
          message: "Bağlantı kurulurken sürekli zaman aşımına uğruyor.",
          includeDiagnostics: true,
        })
      );
    });

    expect(await screen.findByText("support_success_title")).toBeDefined();
    expect(pushLog).toHaveBeenCalledWith(expect.stringContaining("Discord bağlantı hatası"));
  });
});
