import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ElectronApi } from "../shared/types";
import { DEFAULT_PET_STATE } from "../shared/defaults";
import { PetWindow } from "./PetWindow";

describe("PetWindow", () => {
  beforeEach(() => {
    const api: Partial<ElectronApi> = {
      pet: {
        getState: vi.fn().mockResolvedValue(DEFAULT_PET_STATE),
        setState: vi.fn().mockResolvedValue(DEFAULT_PET_STATE),
        togglePaused: vi.fn().mockResolvedValue(DEFAULT_PET_STATE),
        onRuntimeState: vi.fn().mockReturnValue(() => undefined)
      },
      app: {
        openChat: vi.fn(),
        openSettings: vi.fn(),
        setLaunchAtStartup: vi.fn(),
        onInlineChatOpen: vi.fn().mockReturnValue(() => undefined)
      },
      chat: {
        history: vi.fn().mockResolvedValue([]),
        send: vi.fn(),
        clear: vi.fn(),
        onDelta: vi.fn().mockReturnValue(() => undefined),
        onDone: vi.fn().mockReturnValue(() => undefined),
        onError: vi.fn().mockReturnValue(() => undefined)
      }
    };

    window.electronApi = api as ElectronApi;
  });

  it("renders the desktop pet and quick actions", () => {
    render(<PetWindow />);

    expect(screen.getByLabelText("切换聊天输入")).toBeInTheDocument();
    expect(screen.getByTitle("聊天")).toBeInTheDocument();
    expect(screen.getByTitle("设置")).toBeInTheDocument();
  });
});
