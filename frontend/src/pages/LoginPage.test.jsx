import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "./LoginPage";
import * as api from "../services/api";

vi.mock("../services/api");

describe("LoginPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(api.loginUser).mockReset();
    vi.stubGlobal("location", {
      href: "http://localhost/login",
      pathname: "/login",
      reload: vi.fn(),
      assign: vi.fn(),
      replace: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls loginUser and stores JWT tokens on success", async () => {
    vi.mocked(api.loginUser).mockResolvedValue({
      access: "access-token",
      refresh: "refresh-token",
    });

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<span>Home</span>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/email/i), "active@example.test");
    await user.type(screen.getByLabelText(/^password$/i), "VerySecurePass123!");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    await waitFor(() => {
      expect(api.loginUser).toHaveBeenCalledWith({
        email: "active@example.test",
        password: "VerySecurePass123!",
      });
    });

    expect(localStorage.getItem("access")).toBe("access-token");
    expect(localStorage.getItem("refresh")).toBe("refresh-token");
  });

  it("shows validation message when login fails", async () => {
    vi.mocked(api.loginUser).mockRejectedValue(new Error("Invalid credentials"));

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<span>Home</span>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/email/i), "x@y.z");
    await user.type(screen.getByLabelText(/^password$/i), "wrong");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/invalid email or password/i).length).toBeGreaterThan(0);
    });
  });
});
