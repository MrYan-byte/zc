import { fireEvent, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PET_STATE } from "../shared/defaults";

const { api } = vi.hoisted(() => ({
  api: {
    pet: {
      getState: vi.fn(),
      setState: vi.fn(),
      togglePaused: vi.fn(),
      onRuntimeState: vi.fn()
    },
    app: {
      openChat: vi.fn(),
      openSettings: vi.fn(),
      setLaunchAtStartup: vi.fn(),
      beginPetDrag: vi.fn(),
      dragPetTo: vi.fn(),
      endPetDrag: vi.fn(),
      onInlineChatOpen: vi.fn()
    },
    chat: {
      history: vi.fn(),
      send: vi.fn(),
      clear: vi.fn(),
      onDelta: vi.fn(),
      onDone: vi.fn(),
      onError: vi.fn()
    }
  }
}));

vi.mock("./electronApi", () => ({
  electronApi: api
}));

import { PetWindow } from "./PetWindow";

describe("PetWindow", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    api.pet!.getState = vi.fn().mockResolvedValue(DEFAULT_PET_STATE);
    api.pet!.setState = vi.fn().mockResolvedValue(DEFAULT_PET_STATE);
    api.pet!.togglePaused = vi.fn().mockResolvedValue(DEFAULT_PET_STATE);
    api.pet!.onRuntimeState = vi.fn().mockReturnValue(() => undefined);

    api.app!.openChat = vi.fn();
    api.app!.openSettings = vi.fn();
    api.app!.setLaunchAtStartup = vi.fn();
    api.app!.beginPetDrag = vi.fn();
    api.app!.dragPetTo = vi.fn();
    api.app!.endPetDrag = vi.fn();
    api.app!.onInlineChatOpen = vi.fn().mockReturnValue(() => undefined);

    api.chat!.history = vi.fn().mockResolvedValue([]);
    api.chat!.send = vi.fn();
    api.chat!.clear = vi.fn();
    api.chat!.onDelta = vi.fn().mockReturnValue(() => undefined);
    api.chat!.onDone = vi.fn().mockReturnValue(() => undefined);
    api.chat!.onError = vi.fn().mockReturnValue(() => undefined);
  });

  it("renders the desktop pet and quick actions", () => {
    const { container } = render(<PetWindow />);

    expect(container.querySelector(".pet-stage")).toBeInTheDocument();
    expect(container.querySelectorAll(".pet-actions .icon-button")).toHaveLength(3);
  });

  it("plays the wave state when the character is clicked", async () => {
    const { container } = render(<PetWindow />);
    const petStage = container.querySelector(".pet-stage");

    expect(petStage).toBeInTheDocument();
    fireEvent.click(petStage as Element);

    await waitFor(() => {
      expect(api.pet!.setState).toHaveBeenCalledWith("wave");
    });
  });

  it("selects a pet state from the debug action panel", async () => {
    const { getAllByTitle, getByLabelText, getByText } = render(<PetWindow />);

    fireEvent.click(getAllByTitle("切换动作")[0]);

    fireEvent.click(getByText("angry"));

    await waitFor(() => {
      expect(api.pet!.setState).toHaveBeenCalledWith("angry");
    });
  });
});
