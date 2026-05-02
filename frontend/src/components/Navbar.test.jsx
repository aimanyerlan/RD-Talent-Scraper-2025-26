import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Navbar from "./Navbar";
import * as api from "../services/api";

vi.mock("../services/api");

describe("Navbar", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(api.fetchMe).mockReset();
    vi.mocked(api.logoutUser).mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows Log in and Register when not authenticated", async () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /log in/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: /register/i })).toBeInTheDocument();
    expect(api.fetchMe).not.toHaveBeenCalled();
  });

  it("shows profile menu when access token exists", async () => {
    localStorage.setItem("access", "test-access-token");
    vi.mocked(api.fetchMe).mockResolvedValue({
      email: "user@example.test",
      full_name: "Test User",
      avatar_url: "",
      role: "user",
    });

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(api.fetchMe).toHaveBeenCalled();
    });
    expect(screen.getByRole("button", { name: /profile menu/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /log in/i })).not.toBeInTheDocument();
  });

  it("clears tokens and navigates on logout", async () => {
    localStorage.setItem("access", "a");
    localStorage.setItem("refresh", "r");
    vi.mocked(api.logoutUser).mockImplementation(async () => {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
    });
    vi.mocked(api.fetchMe).mockResolvedValue({
      email: "user@example.test",
      full_name: "Test User",
      avatar_url: "",
      role: "user",
    });

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Navbar />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /profile menu/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /profile menu/i }));
    await user.click(screen.getByRole("button", { name: /^logout$/i }));

    expect(localStorage.getItem("access")).toBeNull();
    expect(localStorage.getItem("refresh")).toBeNull();
  });
});
